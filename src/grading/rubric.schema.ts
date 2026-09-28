import { z } from 'zod';

export const DIMENSIONS = ['clarity', 'empathy', 'ask_made', 'boundary_held'] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const dimensionGradeSchema = z.object({
  score: z.number().int().min(1).max(4),
  evidence_quotes: z.array(z.string().min(1)),
  rationale: z.string().min(1),
  better_line: z.string().min(1),
});
export type DimensionGrade = z.infer<typeof dimensionGradeSchema>;

export const gradeSchema = z.object({
  dimensions: z.object({
    clarity: dimensionGradeSchema,
    empathy: dimensionGradeSchema,
    ask_made: dimensionGradeSchema,
    boundary_held: dimensionGradeSchema,
  }),
  ask_made: z.boolean(),
  ask_text: z.string().nullable(),
  boundary_held: z.boolean(),
  safety_flag: z.boolean(),
});
export type Grade = z.infer<typeof gradeSchema>;

/** Shape of data/rubrics/*.yaml: anchored 1–4 descriptors plus the framework they come from. */
export const rubricSchema = z.strictObject({
  id: z.enum(DIMENSIONS),
  name: z.string().min(1),
  question: z.string().min(1),
  framework: z.strictObject({
    name: z.string().min(1),
    source: z.string().min(1),
    applies: z.string().min(1),
  }),
  anchors: z.strictObject({
    1: z.string().min(1),
    2: z.string().min(1),
    3: z.string().min(1),
    4: z.string().min(1),
  }),
  evidence: z.string().min(1),
});
export type Rubric = z.infer<typeof rubricSchema>;
