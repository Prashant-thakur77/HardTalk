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

export const DIMENSION_LABELS: Record<Dimension, string> = {
  clarity: 'Clarity',
  empathy: 'Empathy',
  ask_made: 'Ask made',
  boundary_held: 'Boundary held',
};
