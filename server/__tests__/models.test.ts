import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { openAiCompatibleJsonModel, type JsonRequest } from '../src/models';

const request: JsonRequest = {
  system: 'Grade it.',
  user: 'The transcript.',
  schema: z.strictObject({ distress: z.boolean(), mood: z.enum(['calm', 'tense']) }),
  maxTokens: 2000,
  effort: 'low',
};

const reply = (status: number, body: unknown) =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });

const answer = (content: string, extra: Record<string, unknown> = {}) =>
  reply(200, { choices: [{ message: { content, ...extra }, finish_reason: 'stop' }] });

describe('openAiCompatibleJsonModel', () => {
  it('asks for the schema as structured output, with the key as a bearer token', async () => {
    const fetch = vi.fn().mockResolvedValue(answer('{"distress":false}'));
    const model = openAiCompatibleJsonModel({ baseUrl: 'https://example.test/v1/', apiKey: 'k', model: 'm', fetch });
    await expect(model(request)).resolves.toEqual({ text: '{"distress":false}', refused: false });

    const [url, init] = fetch.mock.calls[0]!;
    expect(url).toBe('https://example.test/v1/chat/completions');
    expect(init.headers.authorization).toBe('Bearer k');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('m');
    expect(body.messages).toEqual([
      { role: 'system', content: 'Grade it.' },
      { role: 'user', content: 'The transcript.' },
    ]);
    expect(body.response_format.type).toBe('json_schema');
    // The full schema, with its enums, so a local model's grammar can enforce them.
    expect(body.response_format.json_schema.schema.properties.mood.enum).toEqual(['calm', 'tense']);
  });

  it('sends no key to a local model that needs none', async () => {
    const fetch = vi.fn().mockResolvedValue(answer('{}'));
    await openAiCompatibleJsonModel({ baseUrl: 'http://localhost:11434/v1', model: 'qwen2.5', fetch })(request);
    expect(fetch.mock.calls[0]![1].headers).not.toHaveProperty('authorization');
  });

  it('falls back to plain JSON, with the schema in the instructions, when the schema is rejected', async () => {
    const fetch = vi.fn().mockResolvedValueOnce(reply(400, 'unsupported schema')).mockResolvedValueOnce(answer('{"distress":true}'));
    const model = openAiCompatibleJsonModel({ baseUrl: 'https://example.test', model: 'm', fetch });
    await expect(model(request)).resolves.toEqual({ text: '{"distress":true}', refused: false });

    const retry = JSON.parse(fetch.mock.calls[1]![1].body);
    expect(retry.response_format).toEqual({ type: 'json_object' });
    expect(retry.messages[0].content).toContain('"enum":["calm","tense"]');
  });

  it('reports a refusal or a content filter as refused', async () => {
    const refusing = vi.fn().mockResolvedValue(answer('', { refusal: 'No.' }));
    await expect(openAiCompatibleJsonModel({ baseUrl: 'x', model: 'm', fetch: refusing })(request)).resolves.toMatchObject({
      refused: true,
    });
    const filtered = vi.fn().mockResolvedValue(reply(200, { choices: [{ message: { content: null }, finish_reason: 'content_filter' }] }));
    await expect(openAiCompatibleJsonModel({ baseUrl: 'x', model: 'm', fetch: filtered })(request)).resolves.toEqual({
      text: '',
      refused: true,
    });
  });

  it('throws with the provider’s own words when the call fails', async () => {
    const fetch = vi.fn().mockResolvedValue(reply(429, 'quota exceeded'));
    await expect(openAiCompatibleJsonModel({ baseUrl: 'x', model: 'm', fetch })(request)).rejects.toThrow(/429: quota exceeded/);
  });
});
