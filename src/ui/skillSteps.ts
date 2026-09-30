/** How to read a bar that compares two tries: `since` is "last time" or "on your first try". */
export const skillKey = (since: string) =>
  `Grey steps you had ${since}, coloured steps are new, dashed steps were lost.`;

export type StepState = 'kept' | 'gained' | 'lost' | 'scored' | 'empty';

/**
 * The four steps of a 1–4 score. Compared with an earlier try, each step was kept, gained or
 * lost; alone, each step was scored or not.
 */
export function stepStates(score: number, previous?: number): StepState[] {
  return [1, 2, 3, 4].map((step) => {
    if (previous === undefined) return step <= score ? 'scored' : 'empty';
    if (step <= Math.min(score, previous)) return 'kept';
    if (step <= score) return 'gained';
    return step <= previous ? 'lost' : 'empty';
  });
}
