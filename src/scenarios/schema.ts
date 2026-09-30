import { z } from 'zod';

import { dimensionSchema } from '../grading/rubric.schema';
import { trackIdSchema } from '../tracks/schema';

export const difficultySchema = z.enum(['L1', 'L2', 'L3']);
export type Difficulty = z.infer<typeof difficultySchema>;

/** How a persona's face looks while they listen. Drawn by src/ui/Face.tsx. */
export const moodSchema = z.enum(['friendly', 'neutral', 'skeptical', 'stern', 'pleased']);
export type Mood = z.infer<typeof moodSchema>;

/** A drawn face, described in words so the YAML reads like a casting note. */
export const faceSchema = z.strictObject({
  skin: z.enum(['porcelain', 'light', 'tan', 'olive', 'brown', 'deep']),
  hair: z.enum(['black', 'dark_brown', 'brown', 'auburn', 'blonde', 'grey', 'white']),
  hair_style: z.enum(['short', 'crop', 'curly', 'afro', 'long', 'bob', 'bun', 'ponytail', 'bald']),
  top: z.enum(['blue', 'green', 'amber', 'purple', 'red', 'teal', 'charcoal']),
  glasses: z.boolean().default(false),
  beard: z.boolean().default(false),
  earrings: z.boolean().default(false),
});
export type Face = z.infer<typeof faceSchema>;

/** What a person tends to ask about, shown on the brief so the user knows what to prepare. */
const asksAboutSchema = z.array(z.string().min(1).max(40)).min(1).max(3);

/** The skills a person judges you on: one or two of the track's rubrics. */
export const caresAboutSchema = z.array(dimensionSchema).min(1).max(2);

/** How a person sounds when mock mode reads their lines aloud. Live mode uses their ElevenLabs voice. */
export const voiceSchema = z.strictObject({ pitch: z.number().min(0.5).max(2) });
export type Voice = z.infer<typeof voiceSchema>;

const levelSchema = z.strictObject({
  name: z.string().min(1),
  /** What the user sees on the brief. Says how hard, never how to win. */
  summary: z.string().min(1),
  /** What the persona is told. Stays out of the UI: it can name the way through. */
  behaviour: z.string().min(20),
  /** The lead persona's expression at this level. */
  mood: moodSchema.default('neutral'),
});

/** Someone else in the room: an investor who likes you, a moderator who presses both sides. */
export const panelistSchema = z.strictObject({
  name: z.string().regex(/^[A-Z][a-z]+$/, 'One capitalised first name: it is also the voice tag.'),
  role: z.string().min(1),
  stance: z.enum(['agrees', 'questions', 'neutral']),
  /** What they think and what they will ask. The persona model reads this; the user does not. */
  view: z.string().min(1),
  tone: z.string().min(1),
  asks_about: asksAboutSchema.optional(),
  cares_about: caresAboutSchema.optional(),
  face: faceSchema.optional(),
  voice: voiceSchema.optional(),
});
export type Panelist = z.infer<typeof panelistSchema>;

/** The scenario fields. Use scenarioSchema to validate: it also checks the names are distinct. */
export const scenarioFieldsSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/),
  /** Scenarios saved before tracks existed were all workplace conversations. */
  track: trackIdSchema.default('workplace'),
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
    asks_about: asksAboutSchema.optional(),
    cares_about: caresAboutSchema.optional(),
    face: faceSchema.optional(),
    voice: voiceSchema.optional(),
  }),
  panel: z.array(panelistSchema).max(2).default([]),
  difficulty_levels: z.strictObject({ L1: levelSchema, L2: levelSchema, L3: levelSchema }),
  opening_line: z.string().min(1),
  stop_condition: z.string().min(1),
  max_user_turns: z.number().int().min(1).max(10),
});

export const scenarioSchema = scenarioFieldsSchema.refine(
  (scenario) => {
    const names = [scenario.persona.name, ...scenario.panel.map((member) => member.name)];
    return new Set(names).size === names.length;
  },
  { message: 'Everyone in the room needs a different name, so captions can say who spoke.' },
);
export type Scenario = z.infer<typeof scenarioSchema>;
