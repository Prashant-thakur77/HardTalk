import { z } from 'zod';

export const difficultySchema = z.enum(['L1', 'L2', 'L3']);
export type Difficulty = z.infer<typeof difficultySchema>;

const levelSchema = z.strictObject({
  name: z.string().min(1),
  /** What the user sees on the brief. Says how hard, never how to win. */
  summary: z.string().min(1),
  /** What the persona is told. Stays out of the UI: it can name the way through. */
  behaviour: z.string().min(20),
});

export const scenarioSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  user_goal: z.string().min(1),
  persona: z.strictObject({
    name: z.string().min(1),
    role: z.string().min(1),
    goal: z.string().min(1),
    hidden_objection: z.string().min(1),
    tone: z.string().min(1),
    context: z.array(z.string().min(1)).min(1),
  }),
  difficulty_levels: z.strictObject({ L1: levelSchema, L2: levelSchema, L3: levelSchema }),
  opening_line: z.string().min(1),
  stop_condition: z.string().min(1),
  max_user_turns: z.number().int().min(1).max(10),
});
export type Scenario = z.infer<typeof scenarioSchema>;
