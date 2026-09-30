import { Hono } from 'hono';
import { z } from 'zod';

import { gradeTranscript, GradingError, type GradeModel } from '../../src/grading/grade';
import { trackGradeSchema } from '../../src/grading/rubric.schema';
import { turnSchema } from '../../src/grading/transcript';
import { detectDistress, detectDistressInDocument } from '../../src/safety/rules';
import { MAX_SOURCE_CHARS, MIN_SOURCE_CHARS } from '../../src/scenarios/draft';
import { scenarioSchema, type Scenario } from '../../src/scenarios/schema';
import { trackIdSchema, type Track } from '../../src/tracks/schema';
import { getScenario, getTrack, graderConfig, safetyConfig } from './data';
import { DraftError } from './drafter';
import { rateLimit } from './limits';

/** Each service is optional so the server runs with whichever keys are configured. */
export interface Services {
  gradeModelFor?: (scenario: Scenario) => GradeModel;
  mintVoiceToken?: () => Promise<string>;
  /** Model-based distress check for lines the shared rules pass. Live mode only. */
  checkDistress?: (line: string) => Promise<boolean>;
  /** Drafts a scenario from pasted text (Pro). Throws DraftError when it cannot. */
  draftScenario?: (track: Track, source: string) => Promise<Scenario>;
  /** Provider calls allowed per client address per window. */
  limit?: { max: number; windowMs: number };
}

const DEFAULT_LIMIT = { max: 60, windowMs: 60 * 60 * 1000 };

/** A built-in scenario by id, or a custom (Pro) scenario the user wrote, sent in full. */
const scenarioRefSchema = z.union([
  z.strictObject({ scenarioId: z.string() }),
  z.strictObject({ scenario: scenarioSchema.refine((scenario) => scenario.id.startsWith('custom-')) }),
]);

const cappedTurn = turnSchema.extend({ text: z.string().min(1).max(2000) });

const gradeRequestSchema = z.intersection(
  scenarioRefSchema,
  z.object({ turns: z.array(cappedTurn).min(1).max(40) }),
);

const NOT_SCORED = { error: 'This conversation was not scored.', safety: true } as const;

function resolveScenario(ref: z.infer<typeof scenarioRefSchema>): Scenario | undefined {
  return 'scenario' in ref ? ref.scenario : getScenario(ref.scenarioId);
}

export function createApp(services: Services) {
  const app = new Hono();

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'The service is unavailable. Try again in a moment.' }, 502);
  });

  const limited = rateLimit(services.limit ?? DEFAULT_LIMIT);
  app.use('/grade', limited);
  app.use('/voice/token', limited);
  app.use('/scenario/draft', limited);
  app.use('/safety/check', rateLimit({ max: 600, windowMs: DEFAULT_LIMIT.windowMs }));

  app.get('/health', (c) =>
    c.json({
      ok: true,
      grading: Boolean(services.gradeModelFor),
      voice: Boolean(services.mintVoiceToken),
      safetyModel: Boolean(services.checkDistress),
      drafting: Boolean(services.draftScenario),
    }),
  );

  app.post('/grade', async (c) => {
    if (!services.gradeModelFor) return c.json({ error: 'Grading is not configured on this server.' }, 503);
    const body = gradeRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'Expected { scenarioId or scenario, turns[] }.' }, 400);

    const scenario = resolveScenario(body.data);
    if (!scenario) return c.json({ error: 'Unknown scenario.' }, 404);

    // A conversation where someone sounds genuinely distressed is never scored.
    const distressed = body.data.turns.some(
      (turn) => turn.speaker === 'user' && detectDistress(turn.text, safetyConfig),
    );
    if (distressed) return c.json(NOT_SCORED, 422);

    try {
      const result = await gradeTranscript({
        turns: body.data.turns,
        callModel: services.gradeModelFor(scenario),
        schema: trackGradeSchema(getTrack(scenario.track).rubrics),
        retryCopy: graderConfig.retry,
      });
      if (result.grade.safety_flag) return c.json(NOT_SCORED, 422);
      return c.json({ grade: result.grade, downgraded: result.downgraded });
    } catch (error) {
      if (error instanceof GradingError) return c.json({ error: error.message }, 422);
      throw error;
    }
  });

  app.post('/scenario/draft', async (c) => {
    if (!services.draftScenario) return c.json({ error: 'Drafting is not configured on this server.' }, 503);
    const body = z
      .strictObject({ track: trackIdSchema, source: z.string().trim().min(MIN_SOURCE_CHARS).max(MAX_SOURCE_CHARS) })
      .safeParse(await c.req.json().catch(() => null));
    if (!body.success) {
      return c.json({ error: `Expected { track, source } with ${MIN_SOURCE_CHARS}–${MAX_SOURCE_CHARS} characters.` }, 400);
    }
    // Pasted text that sounds like distress is not turned into a roleplay.
    if (detectDistressInDocument(body.data.source, safetyConfig)) {
      return c.json({ error: 'This text was not drafted.', safety: true }, 422);
    }
    try {
      return c.json({ scenario: await services.draftScenario(getTrack(body.data.track), body.data.source) });
    } catch (error) {
      if (error instanceof DraftError) return c.json({ error: error.message }, 422);
      throw error;
    }
  });

  // The app sends every finished user line here in the background during a live session.
  app.post('/safety/check', async (c) => {
    const body = z.strictObject({ text: z.string().min(1).max(2000) }).safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'Expected { text }.' }, 400);
    if (detectDistress(body.data.text, safetyConfig)) return c.json({ distress: true, source: 'rules' });
    if (!services.checkDistress) return c.json({ distress: false, source: 'rules' });
    try {
      return c.json({ distress: await services.checkDistress(body.data.text), source: 'model' });
    } catch (error) {
      // Say so, rather than let a failure read as "no distress": the app shows that the extra
      // check is offline while the on-device rules keep running.
      console.error(error);
      return c.json({ distress: false, source: 'rules', modelError: true });
    }
  });

  app.post('/voice/token', async (c) => {
    if (!services.mintVoiceToken) return c.json({ error: 'Voice is not configured on this server.' }, 503);
    const body = scenarioRefSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'Expected { scenarioId } or { scenario }.' }, 400);
    if (!resolveScenario(body.data)) return c.json({ error: 'Unknown scenario.' }, 404);
    return c.json({ token: await services.mintVoiceToken() });
  });

  return app;
}
