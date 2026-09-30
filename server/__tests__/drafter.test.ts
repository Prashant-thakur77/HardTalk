import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it, vi } from 'vitest';

import { getTrack } from '../src/data';
import { claudeDrafter, DraftError } from '../src/drafter';

const { samples } = YAML.parse(readFileSync(join(__dirname, '../../data/mock/drafts.yaml'), 'utf8')) as {
  samples: { track: string; source: string; draft: Record<string, unknown> }[];
};
const interview = samples.find((sample) => sample.track === 'interview')!;

function fakeClient(...replies: ({ text: string } | { refusal: true })[]) {
  const create = vi.fn();
  replies.forEach((reply) =>
    create.mockResolvedValueOnce(
      'refusal' in reply
        ? { stop_reason: 'refusal', content: [] }
        : { stop_reason: 'end_turn', content: [{ type: 'text', text: reply.text }] },
    ),
  );
  return { client: { beta: { messages: { create } } } as never, create };
}

describe('claudeDrafter', () => {
  it('turns a valid draft into a custom scenario on the chosen track', async () => {
    const { client, create } = fakeClient({ text: JSON.stringify(interview.draft) });
    const scenario = await claudeDrafter({ client, model: 'claude-opus-5-5' })(getTrack('interview'), interview.source);

    expect(scenario.id).toMatch(/^custom-/);
    expect(scenario.track).toBe('interview');
    expect(scenario.panel.length).toBeGreaterThan(0);
    const request = create.mock.calls[0]![0];
    expect(request.model).toBe('claude-opus-5-5');
    expect(request.fallbacks).toBe('default');
    expect(request.system[0].text).toContain(getTrack('interview').practising);
    expect(request.messages[0].content).toContain(interview.source.trim());
    expect(request.output_config.format.type).toBe('json_schema');
  });

  it('retries once, naming the problem, when the first answer breaks a rule', async () => {
    const badName = { ...interview.draft, persona: { ...(interview.draft.persona as object), name: 'dr smith' } };
    const { client, create } = fakeClient({ text: JSON.stringify(badName) }, { text: JSON.stringify(interview.draft) });
    const scenario = await claudeDrafter({ client, model: 'm' })(getTrack('interview'), interview.source);

    expect(create).toHaveBeenCalledTimes(2);
    expect(create.mock.calls[1]![0].messages[0].content).toMatch(/broke these rules/);
    expect(scenario.track).toBe('interview');
  });

  it('gives up with a plain message after two bad answers, and on a refusal', async () => {
    const twice = fakeClient({ text: 'not json' }, { text: '{"title": 1}' });
    await expect(claudeDrafter({ client: twice.client, model: 'm' })(getTrack('pitch'), 'x'.repeat(100))).rejects.toThrow(DraftError);

    const refused = fakeClient({ refusal: true });
    await expect(claudeDrafter({ client: refused.client, model: 'm' })(getTrack('pitch'), 'x'.repeat(100))).rejects.toThrow(
      DraftError,
    );
  });
});
