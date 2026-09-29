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
    },
    ...scenario.panel.map((member) => ({
      name: member.name,
      role: member.role,
      face: member.face ?? faceFor(member.name),
      mood: STANCE_MOOD[member.stance],
      stance: member.stance,
      asksAbout: member.asks_about ?? [],
      pitch: member.voice?.pitch ?? pitchFor(member.name),
    })),
  ];
}

/** How the room looks once the scorecard is in: won over by a strong try, unmoved by a weak one. */
export function reactionMood(score: number): Mood {
  if (score >= 12) return 'pleased';
  if (score >= 9) return 'neutral';
  return 'skeptical';
}

/** What the brief says about each person's stance, so the user knows who is on which side. */
export const STANCE_LABEL: Record<Person['stance'], string> = {
  lead: 'Leads the conversation',
  agrees: 'Mostly on your side',
  questions: 'Will question you',
  neutral: 'Neutral',
};
