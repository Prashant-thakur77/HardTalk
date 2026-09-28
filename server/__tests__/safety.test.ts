import { describe, expect, it, vi } from 'vitest';

import { claudeDistressCheck } from '../src/safety';

function client(response: { stop_reason: string; text?: string }) {
  const create = vi.fn(async () => ({
    stop_reason: response.stop_reason,
    content: response.text === undefined ? [] : [{ type: 'text', text: response.text }],
  }));
  return { client: { beta: { messages: { create } } } as never, create };
}

describe('claudeDistressCheck', () => {
  it('returns the model verdict and sends the line inside the data-driven wrapper', async () => {
    const { client: fake, create } = client({ stop_reason: 'end_turn', text: '{"distress":false}' });
    await expect(claudeDistressCheck({ client: fake, model: 'claude-opus-5' })('Can we split it?')).resolves.toBe(false);
    const request = (create.mock.calls[0] as unknown[])[0] as { messages: { content: string }[]; system: { text: string }[] };
    expect(request.messages[0]!.content).toContain('<line>\nCan we split it?\n</line>');
    expect(request.system[0]!.text).toContain('If you are unsure, answer distress: true.');
  });

  it('treats a refusal as distress', async () => {
    const { client: fake } = client({ stop_reason: 'refusal' });
    await expect(claudeDistressCheck({ client: fake, model: 'claude-opus-5' })('…')).resolves.toBe(true);
  });

  it('treats an unreadable answer as distress', async () => {
    const { client: fake } = client({ stop_reason: 'end_turn', text: 'maybe' });
    await expect(claudeDistressCheck({ client: fake, model: 'claude-opus-5' })('…')).resolves.toBe(true);
  });
});
