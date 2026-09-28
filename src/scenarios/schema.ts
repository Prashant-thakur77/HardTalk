import { z } from 'zod';

export const difficultySchema = z.enum(['L1', 'L2', 'L3']);
export type Difficulty = z.infer<typeof difficultySchema>;

export const scenarioSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  persona: z.object({
    name: z.string().min(1),
    role: z.string().min(1),
  }),
  opening_line: z.string().min(1),
});
export type Scenario = z.infer<typeof scenarioSchema>;
