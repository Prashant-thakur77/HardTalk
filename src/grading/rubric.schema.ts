import { z } from 'zod';

/** Every rubric in data/rubrics/. A track grades on four of them. */
export const DIMENSIONS = [
  'clarity',
  'empathy',
  'ask_made',
  'boundary_held',
  'answer_directness',
  'evidence',
  'objection_handling',
  'star_structure',
  'ownership',
  'claim_clarity',
  'rebuttal',
  'steelman',
  'held_position',
] as const;
export const dimensionSchema = z.enum(DIMENSIONS);
export type Dimension = z.infer<typeof dimensionSchema>;

/** Every track scores four dimensions, so every total is out of 16 and deltas compare. */
export const DIMENSIONS_PER_TRACK = 4;
export const MAX_TOTAL = DIMENSIONS_PER_TRACK * 4;

export const dimensionGradeSchema = z.object({
  score: z.number().int().min(1).max(4),
  evidence_quotes: z.array(z.string().min(1)),
  rationale: z.string().min(1),
  better_line: z.string().min(1),
});
export type DimensionGrade = z.infer<typeof dimensionGradeSchema>;

const gradeFields = {
  /** The user's single most important line, verbatim: the ask, the close, the result, the claim. */
  key_line: z.string().nullable(),
  safety_flag: z.boolean(),
};

/** A stored or transported grade: whichever four dimensions its track scores. */
export const gradeSchema = z.object({
  dimensions: z
    .partialRecord(dimensionSchema, dimensionGradeSchema)
    .refine((dimensions) => Object.keys(dimensions).length === DIMENSIONS_PER_TRACK, {
      message: `A grade scores exactly ${DIMENSIONS_PER_TRACK} dimensions.`,
    }),
  ...gradeFields,
});
export type Grade = z.infer<typeof gradeSchema>;

/**
 * The exact shape the grader must return for one track: those four dimensions, no others. Used
 * as the model's output schema, so a missing or extra dimension is a schema error.
 */
export function trackGradeSchema(dimensions: readonly Dimension[]) {
  return z.object({
    dimensions: z.strictObject(Object.fromEntries(dimensions.map((id) => [id, dimensionGradeSchema]))),
    ...gradeFields,
  });
}

/** The grade's dimensions as [id, grade] pairs, in the order they were scored. */
export function scoredDimensions(grade: Grade): [Dimension, DimensionGrade][] {
  return Object.entries(grade.dimensions).flatMap(([id, result]) =>
    result ? [[dimensionSchema.parse(id), result] as [Dimension, DimensionGrade]] : [],
  );
}

export function totalScore(grade: Grade): number {
  return scoredDimensions(grade).reduce((sum, [, result]) => sum + result.score, 0);
}

/** Shape of data/rubrics/*.yaml: anchored 1–4 descriptors plus the framework they come from. */
export const rubricSchema = z.strictObject({
  id: dimensionSchema,
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
