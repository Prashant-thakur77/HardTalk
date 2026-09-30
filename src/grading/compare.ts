import { scoredDimensions, type Dimension, type Grade } from './rubric.schema';

export interface Jump {
  dimension: Dimension;
  before: number;
  after: number;
  /** What the user said last time as evidence for this skill, if the grade quoted anything. */
  beforeQuote: string | null;
  afterQuote: string | null;
}

/**
 * The skill that improved most since the last try, with the words behind each score, so the
 * scorecard can show what the user said differently. Ties go to the rubric listed first. None
 * when nothing went up.
 */
export function biggestJump(previous: Grade, current: Grade): Jump | null {
  let best: Jump | null = null;
  for (const [dimension, result] of scoredDimensions(current)) {
    const earlier = previous.dimensions[dimension];
    if (!earlier || result.score <= earlier.score) continue;
    if (best && result.score - earlier.score <= best.after - best.before) continue;
    best = {
      dimension,
      before: earlier.score,
      after: result.score,
      beforeQuote: earlier.evidence_quotes[0] ?? null,
      afterQuote: result.evidence_quotes[0] ?? null,
    };
  }
  return best;
}
