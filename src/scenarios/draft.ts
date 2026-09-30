import { z } from 'zod';

import type { TrackId } from '../tracks/schema';
import { customScenarioId } from './ids';
import { faceSchema, moodSchema, scenarioSchema, type Scenario } from './schema';

/** Longest pasted text the drafter accepts: a full job posting or a one-page pitch. */
export const MAX_SOURCE_CHARS = 6000;
export const MIN_SOURCE_CHARS = 80;

const asksAbout = z.array(z.string().min(1).max(40)).min(1).max(3);
const { skin, hair, hair_style, top } = faceSchema.shape;
/** Every feature required, so the model always picks one: a face that suits the name it chose. */
const face = z.object({ skin, hair, hair_style, top, glasses: z.boolean(), beard: z.boolean(), earrings: z.boolean() });
const level = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  behaviour: z.string().min(20),
  mood: moodSchema,
});

/**
 * What the drafter model returns for pasted text: a scenario without the parts the app owns
 * (id, track, faces, voices, turn limit). Kept flat and fully required so it works as a
 * structured-output schema.
 */
export const draftSchema = z.object({
  title: z.string().min(1).max(80),
  summary: z.string().min(1),
  user_goal: z.string().min(1),
  persona: z.object({
    name: z.string().regex(/^[A-Z][a-z]+$/),
    role: z.string().min(1),
    goal: z.string().min(1),
    hidden_objection: z.string().min(1),
    tone: z.string().min(1),
    context: z.array(z.string().min(1)).min(1).max(8),
    asks_about: asksAbout,
    face,
  }),
  panel: z
    .array(
      z.object({
        name: z.string().regex(/^[A-Z][a-z]+$/),
        role: z.string().min(1),
        stance: z.enum(['agrees', 'questions', 'neutral']),
        view: z.string().min(1),
        tone: z.string().min(1),
        asks_about: asksAbout,
        face,
      }),
    )
    .max(2),
  difficulty_levels: z.object({ L1: level, L2: level, L3: level }),
  opening_line: z.string().min(1),
  stop_condition: z.string().min(1),
});
export type Draft = z.infer<typeof draftSchema>;

/** Turns a validated draft into a custom scenario, checked by the same schema as the built-ins. */
export function scenarioFromDraft(draft: Draft, track: TrackId, now = Date.now(), id = customScenarioId(draft.title, now)): Scenario {
  return scenarioSchema.parse({
    ...draft,
    id,
    track,
    max_user_turns: 6,
  });
}
