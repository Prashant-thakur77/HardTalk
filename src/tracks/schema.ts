import { z } from 'zod';

import { DIMENSIONS_PER_TRACK, dimensionSchema } from '../grading/rubric.schema';

export const TRACK_IDS = ['workplace', 'pitch', 'interview', 'debate'] as const;
export const trackIdSchema = z.enum(TRACK_IDS);
export type TrackId = z.infer<typeof trackIdSchema>;

/**
 * Shape of data/tracks/*.yaml. A track is a kind of practice: the room the persona is in, what
 * the grader grades, the four rubrics it grades on, and the one line of yours it pulls out.
 */
export const trackSchema = z
  .strictObject({
    id: trackIdSchema,
    name: z.string().min(1),
    tagline: z.string().min(1).max(60),
    /** Completes the persona prompt's "You are in {{setting}}." */
    setting: z.string().min(1),
    /** Completes the grader prompt's "people rehearse {{practising}}." */
    practising: z.string().min(1),
    rubrics: z.array(dimensionSchema).length(DIMENSIONS_PER_TRACK),
    key_line: z.strictObject({
      label: z.string().min(1),
      instruction: z.string().min(1),
      closest: z.string().min(1),
      none: z.string().min(1),
      /** When there is no key line, this rubric's first evidence quote stands in. */
      from: dimensionSchema,
    }),
    custom_opening_line: z.string().min(1),
    /** What to paste to have a panel drafted for it: the prompt above the text box. */
    paste_label: z.string().min(1),
    /** Placeholder examples for the five-answer "Describe it" form, in this track's terms. */
    describe_examples: z.strictObject({
      title: z.string().min(1),
      name: z.string().min(1),
      role: z.string().min(1),
      goal: z.string().min(1),
      pushback: z.string().min(1),
    }),
    /** One practical tip shown on the brief, for habits of this kind of conversation. */
    tip: z.string().min(1).optional(),
  })
  .refine((track) => new Set(track.rubrics).size === track.rubrics.length, 'A rubric is listed twice.')
  .refine((track) => track.rubrics.includes(track.key_line.from), 'key_line.from must be one of the rubrics.');
export type Track = z.infer<typeof trackSchema>;
