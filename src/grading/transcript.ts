import { z } from 'zod';

export const turnSchema = z.strictObject({
  speaker: z.enum(['user', 'persona']),
  /** Which panelist spoke. Absent for the user and for the lead persona. */
  name: z.string().min(1).optional(),
  text: z.string().min(1),
});
export type Turn = z.infer<typeof turnSchema>;

export function userText(turns: Turn[]): string {
  return turns
    .filter((turn) => turn.speaker === 'user')
    .map((turn) => turn.text)
    .join('\n');
}

/** Persona lines are labelled with whoever spoke: the lead persona unless a panelist is named. */
export function formatTranscript(turns: Turn[], personaName: string): string {
  return turns
    .map((turn) =>
      turn.speaker === 'user' ? `USER: ${turn.text}` : `${(turn.name ?? personaName).toUpperCase()} (persona): ${turn.text}`,
    )
    .join('\n');
}
