import { Hono } from 'hono';
import { z } from 'zod';

import { gradeTranscript, GradingError, type GradeModel } from '../../src/grading/grade';
import { turnSchema } from '../../src/grading/transcript';
import type { Scenario } from '../../src/scenarios/schema';
import { getScenario } from './data';

/** Each service is optional so the server runs with whichever keys are configured. */
export interface Services {
  gradeModelFor?: (scenario: Scenario) => GradeModel;
  mintVoiceToken?: () => Promise<string>;
}

const gradeRequestSchema = z.strictObject({
  scenarioId: z.string(),
  turns: z.array(turnSchema).min(1).max(40),
});

const voiceTokenRequestSchema = z.strictObject({ scenarioId: z.string() });

export function createApp(services: Services) {
  const app = new Hono();

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: 'The service is unavailable. Try again in a moment.' }, 502);
  });

  app.get('/health', (c) =>
    c.json({ ok: true, grading: Boolean(services.gradeModelFor), voice: Boolean(services.mintVoiceToken) }),
  );

  app.post('/grade', async (c) => {
    if (!services.gradeModelFor) return c.json({ error: 'Grading is not configured on this server.' }, 503);
    const body = gradeRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'Expected { scenarioId, turns[] }.' }, 400);

    const scenario = getScenario(body.data.scenarioId);
    if (!scenario) return c.json({ error: `Unknown scenario "${body.data.scenarioId}".` }, 404);

    try {
      const result = await gradeTranscript({
        turns: body.data.turns,
        callModel: services.gradeModelFor(scenario),
      });
      return c.json({ grade: result.grade, downgraded: result.downgraded });
    } catch (error) {
      if (error instanceof GradingError) return c.json({ error: error.message }, 422);
      throw error;
    }
  });

  app.post('/voice/token', async (c) => {
    if (!services.mintVoiceToken) return c.json({ error: 'Voice is not configured on this server.' }, 503);
    const body = voiceTokenRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!body.success) return c.json({ error: 'Expected { scenarioId }.' }, 400);
    if (!getScenario(body.data.scenarioId)) {
      return c.json({ error: `Unknown scenario "${body.data.scenarioId}".` }, 404);
    }
    return c.json({ token: await services.mintVoiceToken() });
  });

  return app;
}
