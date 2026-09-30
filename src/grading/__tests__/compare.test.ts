import { describe, expect, it } from 'vitest';

import { biggestJump } from '../compare';
import type { DimensionGrade, Grade } from '../rubric.schema';

const result = (score: number, quote?: string): DimensionGrade => ({
  score,
  evidence_quotes: quote ? [quote] : [],
  rationale: 'r',
  better_line: 'b',
});
const grade = (scores: [number, string?][]): Grade => ({
  dimensions: {
    clarity: result(...scores[0]!),
    empathy: result(...scores[1]!),
    ask_made: result(...scores[2]!),
    boundary_held: result(...scores[3]!),
  },
  key_line: null,
  safety_flag: false,
});

describe('biggestJump', () => {
  it('picks the skill that went up most, with the words behind both scores', () => {
    const before = grade([[2, 'the PR thing'], [2, 'I get that'], [1], [1, 'No pressure though.']]);
    const after = grade([[3, 'Your PR has been in review three days.'], [2, 'I get that'], [4, 'Can we agree 4pm?'], [3, 'The date stays.']]);
    expect(biggestJump(before, after)).toEqual({
      dimension: 'ask_made',
      before: 1,
      after: 4,
      beforeQuote: null,
      afterQuote: 'Can we agree 4pm?',
    });
  });

  it('breaks a tie in favour of the rubric listed first', () => {
    const before = grade([[1], [1], [2], [2]]);
    const after = grade([[3], [3], [2], [2]]);
    expect(biggestJump(before, after)?.dimension).toBe('clarity');
  });

  it('has nothing to show when no skill went up', () => {
    const same = grade([[2], [2], [2], [2]]);
    expect(biggestJump(same, grade([[2], [1], [2], [2]]))).toBeNull();
  });
});
