import { describe, expect, it } from 'vitest';

import type { DimensionGrade, Grade } from '@/grading/rubric.schema';
import { faceFor, reactionOf, type Person } from '@/scenarios/people';

const result = (score: number): DimensionGrade => ({ score, evidence_quotes: [], rationale: 'r', better_line: 'b' });
const grade: Grade = {
  dimensions: { clarity: result(4), empathy: result(1), ask_made: result(3), boundary_held: result(2) },
  key_line: null,
  safety_flag: false,
};
const person = (caresAbout: Person['caresAbout']): Person => ({
  name: 'Maya',
  role: 'Partner',
  face: faceFor('Maya'),
  mood: 'neutral',
  stance: 'lead',
  asksAbout: [],
  pitch: 1,
  caresAbout,
});
const workplace = ['clarity', 'empathy', 'ask_made', 'boundary_held'] as const;

describe('reactionOf', () => {
  it('is won over when the skills they care about average 3 or more', () => {
    expect(reactionOf(person(['clarity', 'ask_made']), grade, [...workplace])).toEqual({
      verdict: 'won',
      basis: [
        { dimension: 'clarity', score: 4 },
        { dimension: 'ask_made', score: 3 },
      ],
    });
  });

  it('is unconvinced by a weak score on what they care about, whatever else went well', () => {
    expect(reactionOf(person(['empathy']), grade, [...workplace]).verdict).toBe('unconvinced');
  });

  it('weighs every rubric when a person names none, and lands in between', () => {
    expect(reactionOf(person([]), grade, [...workplace]).verdict).toBe('unsure');
  });
});
