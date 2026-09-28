import { describe, expect, it, vi } from 'vitest';

import { gradeTranscript } from '../../src/grading/grade';
import { getScenario, graderConfig } from '../src/data';
import { claudeGradeModel } from '../src/grader';

const scenario = getScenario('pr-blocking-release')!;
const turns = [
  { speaker: 'persona' as const, text: "Hey, what's up?" },
  { speaker: 'user' as const, text: 'Your PR has blocked the release for three days.' },
];

const dimension = { score: 3, evidence_quotes: ['Your PR has blocked the release for three days.'], rationale: 'r', better_line: 'b' };
const valid = {
  dimensions: { clarity: dimension, empathy: dimension, ask_made: dimension, boundary_held: dimension },
  ask_made: false,
  ask_text: null,
  boundary_held: false,
  safety_flag: false,
};

function fakeClient(...texts: string[]) {
  const create = vi.fn();
  texts.forEach((text) =>
    create.mockResolvedValueOnce({ stop_reason: 'end_turn', content: [{ type: 'text', text }] }),
  );
  return { client: { beta: { messages: { create } } } as never, create };
}

describe('claudeGradeModel', () => {
  it('sends a cached system prompt built from data, structured output, and refusal fallbacks', async () => {
    const { client, create } = fakeClient(JSON.stringify(valid));
    await claudeGradeModel({ client, model: 'claude-opus-5', effort: 'medium' }, scenario)({ turns });

    const request = create.mock.calls[0]![0];
    expect(request.model).toBe('claude-opus-5');
    expect(request.fallbacks).toBe('default');
    expect(request.system[0].cache_control).toEqual({ type: 'ephemeral' });
    expect(request.system[0].text).toContain('Situation-Behavior-Impact');
    expect(request.messages[0].content).toContain('USER: Your PR has blocked the release for three days.');
    expect(request.output_config.format.type).toBe('json_schema');
    expect(request.output_config.format).not.toHaveProperty('parse');
  });

  it('lets an out-of-schema answer reach the retry instead of throwing (score 5, then valid)', async () => {
    const { client, create } = fakeClient(
      JSON.stringify({ ...valid, dimensions: { ...valid.dimensions, clarity: { ...dimension, score: 5 } } }),
      JSON.stringify(valid),
    );
    const callModel = claudeGradeModel({ client, model: 'claude-opus-5', effort: 'medium' }, scenario);
    const result = await gradeTranscript({ turns, callModel, retryCopy: graderConfig.retry });

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1]![0].messages[0].content).toMatch(/did not match the required schema/);
    expect(result.grade.dimensions.clarity.score).toBe(3);
  });

  it('treats truncated JSON as a schema problem, not a crash', async () => {
    const { client } = fakeClient('{"dimensions": {"clarity"', JSON.stringify(valid));
    const callModel = claudeGradeModel({ client, model: 'claude-opus-5', effort: 'medium' }, scenario);
    const result = await gradeTranscript({ turns, callModel, retryCopy: graderConfig.retry });
    expect(result.modelCalls).toBe(2);
  });
});
