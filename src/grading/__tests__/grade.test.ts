import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it, vi } from 'vitest';

import { gradeTranscript, GradingError, type GradeModel } from '../grade';
import { graderConfigSchema } from '../prompt';
import type { Grade } from '../rubric.schema';
import type { Turn } from '../transcript';

const { retry: retryCopy } = graderConfigSchema.parse(
  YAML.parse(readFileSync(join(__dirname, '../../../data/prompts/grader.yaml'), 'utf8')),
);
/** Grades with the retry wording shipped in data/prompts/grader.yaml. */
const run = (options: { turns: Turn[]; callModel: GradeModel }) => gradeTranscript({ ...options, retryCopy });

const turns: Turn[] = [
  { speaker: 'persona', text: 'Hey, what is up?' },
  { speaker: 'user', text: 'Your PR has blocked the release for three days.' },
  { speaker: 'persona', text: 'It is a big change.' },
  { speaker: 'user', text: 'Can you split it so part one merges by 4pm?' },
];

function dimension(score: number, quote: string) {
  return { score, evidence_quotes: [quote], rationale: 'because', better_line: 'try this' };
}

const grounded: Grade = {
  dimensions: {
    clarity: dimension(3, 'Your PR has blocked the release for three days.'),
    empathy: dimension(2, 'blocked the release for three days'),
    ask_made: dimension(4, 'Can you split it so part one merges by 4pm?'),
    boundary_held: dimension(2, 'Can you split it'),
  },
  ask_made: true,
  ask_text: 'Can you split it so part one merges by 4pm?',
  boundary_held: false,
  safety_flag: false,
};

const hallucinated: Grade = {
  ...grounded,
  dimensions: { ...grounded.dimensions, empathy: dimension(3, 'I really hear how stressed you are.') },
};

function model(...responses: unknown[]): GradeModel & ReturnType<typeof vi.fn> {
  const fn = vi.fn();
  responses.forEach((response) => fn.mockResolvedValueOnce(response));
  return fn as GradeModel & ReturnType<typeof vi.fn>;
}

describe('gradeTranscript', () => {
  it('returns a grounded grade from a single model call', async () => {
    const callModel = model(grounded);
    const result = await run({ turns, callModel });

    expect(result).toEqual({ grade: grounded, modelCalls: 1, downgraded: [] });
    expect(callModel).toHaveBeenCalledTimes(1);
  });

  it('re-requests once, naming the invented quote, and accepts a corrected grade', async () => {
    const callModel = model(hallucinated, grounded);
    const result = await run({ turns, callModel });

    expect(callModel).toHaveBeenCalledTimes(2);
    const feedback = callModel.mock.calls[1]![0].feedback as string;
    expect(feedback).toContain('I really hear how stressed you are.');
    expect(feedback).toContain('empathy');
    expect(result).toEqual({ grade: grounded, modelCalls: 2, downgraded: [] });
  });

  it('downgrades a dimension that is still ungrounded after the retry', async () => {
    const callModel = model(hallucinated, hallucinated);
    const result = await run({ turns, callModel });

    expect(callModel).toHaveBeenCalledTimes(2);
    expect(result.downgraded).toEqual(['empathy']);
    expect(result.grade.dimensions.empathy.score).toBe(1);
    expect(result.grade.dimensions.empathy.evidence_quotes).toEqual([]);
    expect(result.grade.dimensions.clarity).toEqual(grounded.dimensions.clarity);
  });

  it('re-requests once when the output does not match the schema', async () => {
    const callModel = model({ dimensions: { clarity: { score: 9 } } }, grounded);
    const result = await run({ turns, callModel });

    expect(callModel.mock.calls[1]![0].feedback).toMatch(/schema/i);
    expect(result.grade).toEqual(grounded);
  });

  it('fails loudly rather than inventing a grade when the model never returns valid output', async () => {
    const callModel = model('not json', { nope: true });
    await expect(run({ turns, callModel })).rejects.toBeInstanceOf(GradingError);
  });

  it('refuses to grade a conversation where the user never spoke', async () => {
    const callModel = model(grounded);
    await expect(
      run({ turns: [{ speaker: 'persona', text: 'Hello?' }], callModel }),
    ).rejects.toBeInstanceOf(GradingError);
    expect(callModel).not.toHaveBeenCalled();
  });
});
