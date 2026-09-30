import type { Dimension, Grade } from '../grading/rubric.schema';
import type { Difficulty, Face, Mood, Panelist, Scenario } from './schema';

export interface Person {
  name: string;
  role: string;
  face: Face;
  mood: Mood;
  stance: 'lead' | Panelist['stance'];
  /** Topics to prepare for, shown on the brief. Empty for custom personas. */
  asksAbout: string[];
  /** Speech pitch when mock mode reads this person's lines aloud. */
  pitch: number;
  /** The skills this person judges you on. Empty means all of the track's. */
  caresAbout: Dimension[];
}

/** How each panel stance looks while it listens. */
const STANCE_MOOD: Record<Panelist['stance'], Mood> = {
  agrees: 'friendly',
  questions: 'skeptical',
  neutral: 'neutral',
};

/** A stable face for people without one in data, such as custom personas: same name, same face. */
export function faceFor(name: string): Face {
  const hash = [...name].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7);
  const pick = <T>(options: readonly T[], salt: number) => options[(hash >>> salt) % options.length]!;
  return {
    skin: pick(['porcelain', 'light', 'tan', 'olive', 'brown', 'deep'] as const, 0),
    hair: pick(['black', 'dark_brown', 'brown', 'auburn', 'grey'] as const, 3),
    hair_style: pick(['short', 'crop', 'curly', 'long', 'bob', 'bun'] as const, 6),
    top: pick(['blue', 'green', 'amber', 'purple', 'teal', 'charcoal'] as const, 9),
    glasses: (hash >>> 12) % 3 === 0,
    beard: false,
    earrings: false,
  };
}

/** A stable speaking pitch for people without one in data, between 0.8 and 1.2. */
export function pitchFor(name: string): number {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return 0.8 + (sum % 5) * 0.1;
}

/** Everyone in the room, lead persona first. The lead's mood follows the difficulty level. */
export function peopleIn(scenario: Scenario, difficulty: Difficulty): [Person, ...Person[]] {
  const { persona } = scenario;
  return [
    {
      name: persona.name,
      role: persona.role,
      face: persona.face ?? faceFor(persona.name),
      mood: scenario.difficulty_levels[difficulty].mood,
      stance: 'lead',
      asksAbout: persona.asks_about ?? [],
      pitch: persona.voice?.pitch ?? pitchFor(persona.name),
      caresAbout: persona.cares_about ?? [],
    },
    ...scenario.panel.map((member) => ({
      name: member.name,
      role: member.role,
      face: member.face ?? faceFor(member.name),
      mood: STANCE_MOOD[member.stance],
      stance: member.stance,
      asksAbout: member.asks_about ?? [],
      pitch: member.voice?.pitch ?? pitchFor(member.name),
      caresAbout: member.cares_about ?? [],
    })),
  ];
}

/** What the brief says about each person's stance, so the user knows who is on which side. */
export const STANCE_LABEL: Record<Person['stance'], string> = {
  lead: 'Leads the conversation',
  agrees: 'Mostly on your side',
  questions: 'Will question you',
  neutral: 'Neutral',
};

export type Verdict = 'won' | 'unsure' | 'unconvinced';

export const VERDICT: Record<Verdict, { label: string; mood: Mood }> = {
  won: { label: 'Won over', mood: 'pleased' },
  unsure: { label: 'Not sure yet', mood: 'neutral' },
  unconvinced: { label: 'Unconvinced', mood: 'skeptical' },
};

export interface Reaction {
  verdict: Verdict;
  /** The skills behind it, with their scores, so the verdict is never a mystery. */
  basis: { dimension: Dimension; score: number }[];
}

/**
 * How one person in the room took the conversation, worked out only from the evidence-checked
 * scores of the skills they care about: an average of 3 or more wins them over, 2 or more leaves
 * them unsure. Nothing here is generated, so it can never contradict the scorecard.
 */
export function reactionOf(person: Person, grade: Grade, trackRubrics: Dimension[]): Reaction {
  const cared = person.caresAbout.length > 0 ? person.caresAbout : trackRubrics;
  const basis = cared.flatMap((dimension) => {
    const score = grade.dimensions[dimension]?.score;
    return score === undefined ? [] : [{ dimension, score }];
  });
  const average = basis.reduce((sum, item) => sum + item.score, 0) / Math.max(1, basis.length);
  const verdict: Verdict = average >= 3 ? 'won' : average >= 2 ? 'unsure' : 'unconvinced';
  return { verdict, basis };
}
