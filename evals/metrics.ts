/** Agreement statistics for 1-4 ordinal scores. Pure, so they are unit-tested against sklearn. */

const CATEGORIES = [1, 2, 3, 4];

/**
 * Cohen's kappa with quadratic weights: 1 is perfect agreement, 0 is what chance gives, and a
 * 1-vs-4 disagreement costs nine times a 1-vs-2 one. The usual statistic for ordinal ratings.
 */
export function quadraticKappa(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) throw new Error('Need two equal, non-empty rating lists.');
  const k = CATEGORIES.length;
  const index = (score: number) => CATEGORIES.indexOf(score);
  const observed = CATEGORIES.map(() => CATEGORIES.map(() => 0));
  const histA = CATEGORIES.map(() => 0);
  const histB = CATEGORIES.map(() => 0);
  a.forEach((score, i) => {
    observed[index(score)]![index(b[i]!)]! += 1;
    histA[index(score)]! += 1;
    histB[index(b[i]!)]! += 1;
  });

  let weightedObserved = 0;
  let weightedExpected = 0;
  for (let i = 0; i < k; i += 1) {
    for (let j = 0; j < k; j += 1) {
      const weight = (i - j) ** 2 / (k - 1) ** 2;
      weightedObserved += weight * observed[i]![j]!;
      weightedExpected += (weight * histA[i]! * histB[j]!) / a.length;
    }
  }
  if (weightedExpected === 0) return weightedObserved === 0 ? 1 : 0;
  return 1 - weightedObserved / weightedExpected;
}

export function exactAgreement(a: number[], b: number[]): number {
  return a.filter((score, i) => score === b[i]).length / a.length;
}

export function withinOne(a: number[], b: number[]): number {
  return a.filter((score, i) => Math.abs(score - b[i]!) <= 1).length / a.length;
}

/**
 * Run-to-run stability. `runs[r][i]` is run r's score for item i. Returns the share of items
 * where every run gave the same score, and the mean per-item standard deviation.
 */
export function stability(runs: number[][]): { identical: number; meanStdDev: number } {
  const items = runs[0]!.length;
  let identical = 0;
  let totalStdDev = 0;
  for (let i = 0; i < items; i += 1) {
    const scores = runs.map((run) => run[i]!);
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
    if (scores.every((score) => score === scores[0])) identical += 1;
    totalStdDev += Math.sqrt(variance);
  }
  return { identical: identical / items, meanStdDev: totalStdDev / items };
}
