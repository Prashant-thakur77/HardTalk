import { describe, expect, it } from 'vitest';

import { downgradeUngrounded, findUngrounded, isGrounded } from '../evidence';
import type { Grade } from '../rubric.schema';
import type { Turn } from '../transcript';

const turns: Turn[] = [
  { speaker: 'persona', text: "It's a big change. I want it done properly." },
  { speaker: 'user', text: 'Your auth refactor has been in review for three days.' },
  { speaker: 'persona', text: 'So what do you want?' },
  { speaker: 'user', text: "Can we agree the first part merges by 4pm?" },
];

function grade(overrides: Partial<Record<keyof Grade['dimensions'], Partial<Grade['dimensions']['clarity']>>> = {}): Grade {
  const base = (quote: string, score = 3) => ({
    score,
    evidence_quotes: [quote],
    rationale: 'r',
    better_line: 'b',
  });
  return {
    dimensions: {
      clarity: { ...base('Your auth refactor has been in review for three days.'), ...overrides.clarity },
      empathy: { ...base('Your auth refactor has been in review', 2), ...overrides.empathy },
      ask_made: { ...base('Can we agree the first part merges by 4pm?', 4), ...overrides.ask_made },
      boundary_held: { ...base('first part merges by 4pm', 3), ...overrides.boundary_held },
    },
    key_line: 'Can we agree the first part merges by 4pm?',
    safety_flag: false,
  };
}

describe('isGrounded', () => {
  it('accepts a verbatim substring of a user turn', () => {
    expect(isGrounded('in review for three days', turns)).toBe(true);
  });

  it('tolerates curly quotes, case and whitespace differences from speech-to-text', () => {
    expect(isGrounded('can we agree the first part  merges by 4pm?', turns)).toBe(true);
    expect(isGrounded('It’s a big change', [{ speaker: 'user', text: "It's a big change" }])).toBe(true);
  });

  it('rejects a paraphrase', () => {
    expect(isGrounded('Your refactor has been stuck for three days.', turns)).toBe(false);
  });

  it('rejects a quote of the persona, even though it is in the transcript', () => {
    expect(isGrounded("It's a big change.", turns)).toBe(false);
  });

  it('rejects a quote stitched across two user turns', () => {
    expect(isGrounded('three days. Can we agree', turns)).toBe(false);
  });

  it('rejects empty or trivial quotes', () => {
    expect(isGrounded('', turns)).toBe(false);
    expect(isGrounded(' . ', turns)).toBe(false);
  });

  it('rejects fragments inside words ("no" inside "know")', () => {
    const said: Turn[] = [{ speaker: 'user', text: 'I know the change is big.' }];
    expect(isGrounded('no', said)).toBe(false);
    expect(isGrounded('ch', said)).toBe(false);
    expect(isGrounded('now the change', said)).toBe(false);
  });

  it('rejects one- and two-word scraps that are not a whole sentence', () => {
    const said: Turn[] = [{ speaker: 'user', text: 'I know it is big. No. It has to merge today.' }];
    expect(isGrounded('it', said)).toBe(false);
    expect(isGrounded('is big', said)).toBe(false);
    expect(isGrounded('No.', said)).toBe(true);
    expect(isGrounded('has to merge', said)).toBe(true);
  });
});

describe('findUngrounded', () => {
  it('returns nothing for a fully grounded grade', () => {
    expect(findUngrounded(grade(), turns)).toEqual([]);
  });

  it('flags a score above 1 whose quote is invented', () => {
    const invented = grade({ empathy: { evidence_quotes: ['I totally understand how you feel.'] } });
    expect(findUngrounded(invented, turns)).toEqual([
      { dimension: 'empathy', quotes: ['I totally understand how you feel.'] },
    ]);
  });

  it('flags a score above 1 with no quotes at all', () => {
    expect(findUngrounded(grade({ clarity: { evidence_quotes: [] } }), turns)).toEqual([
      { dimension: 'clarity', quotes: [] },
    ]);
  });

  it('does not require evidence for a score of 1', () => {
    expect(findUngrounded(grade({ clarity: { score: 1, evidence_quotes: [] } }), turns)).toEqual([]);
  });
});

describe('downgradeUngrounded', () => {
  it('drops an ungrounded dimension to 1, strips the bad quote, keeps good quotes, and says why', () => {
    const mixed = grade({
      ask_made: { evidence_quotes: ['Can we agree the first part merges by 4pm?', 'Please merge it now.'] },
      empathy: { evidence_quotes: ['I hear you.'] },
    });
    const result = downgradeUngrounded(mixed, turns);

    expect(result.dimensions.empathy?.score).toBe(1);
    expect(result.dimensions.empathy?.evidence_quotes).toEqual([]);
    expect(result.dimensions.empathy?.rationale).toMatch(/could not be found/i);

    expect(result.dimensions.ask_made?.score).toBe(4);
    expect(result.dimensions.ask_made?.evidence_quotes).toEqual(['Can we agree the first part merges by 4pm?']);

    expect(result.dimensions.clarity).toEqual(mixed.dimensions.clarity);
  });

  it('replaces a score-1 comment that rested only on words the user never said', () => {
    const result = downgradeUngrounded(
      grade({ boundary_held: { score: 1, evidence_quotes: ['No pressure though.'], rationale: 'You removed the stakes.' } }),
      turns,
    );
    expect(result.dimensions.boundary_held?.score).toBe(1);
    expect(result.dimensions.boundary_held?.evidence_quotes).toEqual([]);
    expect(result.dimensions.boundary_held?.rationale).not.toMatch(/removed the stakes/);
  });

  it('clears the key line when it is not verbatim user speech', () => {
    const result = downgradeUngrounded({ ...grade(), key_line: 'merge the PR today' }, turns);
    expect(result.key_line).toBeNull();
  });

  it('leaves a grounded grade untouched', () => {
    const clean = grade();
    expect(downgradeUngrounded(clean, turns)).toEqual(clean);
  });
});
