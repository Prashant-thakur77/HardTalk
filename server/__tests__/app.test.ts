import { describe, expect, it, vi } from 'vitest';

import type { GradeModel } from '../../src/grading/grade';
import type { Grade } from '../../src/grading/rubric.schema';
import { createApp } from '../src/app';

const turns = [
  { speaker: 'persona', text: "Hey, what's up?" },
  { speaker: 'user', text: 'Your PR has blocked the release for three days.' },
];

const dimension = (score: number, quote: string) => ({
  score,
  evidence_quotes: [quote],
  rationale: 'why',
  better_line: 'try',
});

const grade: Grade = {
  dimensions: {
    clarity: dimension(3, 'Your PR has blocked the release for three days.'),
    empathy: dimension(1, 'three days'),
    ask_made: dimension(2, 'I need it merged by four.'),
    boundary_held: dimension(1, 'blocked'),
  },
  ask_made: false,
  ask_text: null,
  boundary_held: false,
  safety_flag: false,
};

function appWith(callModel: GradeModel) {
  return createApp({ gradeModelFor: () => callModel });
}

async function post(app: ReturnType<typeof createApp>, body: unknown, path = '/grade') {
  const response = await app.request(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: response.status, json: (await response.json()) as Record<string, unknown> };
}

describe('POST /grade', () => {
  it('grades a transcript and downgrades evidence the user never said', async () => {
    const callModel = vi.fn<GradeModel>().mockResolvedValue(grade);
    const { status, json } = await post(appWith(callModel), { scenarioId: 'pr-blocking-release', turns });

    expect(status).toBe(200);
    expect(callModel).toHaveBeenCalledTimes(2);
    expect(json.downgraded).toEqual(['ask_made']);
    expect((json.grade as Grade).dimensions.ask_made.score).toBe(1);
    expect((json.grade as Grade).dimensions.clarity.score).toBe(3);
  });

  it('rejects a malformed body without calling the model', async () => {
    const callModel = vi.fn<GradeModel>();
    const { status } = await post(appWith(callModel), { scenarioId: 'pr-blocking-release', turns: 'nope' });
    expect(status).toBe(400);
    expect(callModel).not.toHaveBeenCalled();
  });

  it('404s an unknown scenario', async () => {
    const { status } = await post(appWith(vi.fn<GradeModel>()), { scenarioId: 'nope', turns });
    expect(status).toBe(404);
  });

  it('422s when there is nothing to grade', async () => {
    const { status, json } = await post(appWith(vi.fn<GradeModel>()), {
      scenarioId: 'pr-blocking-release',
      turns: [{ speaker: 'persona', text: 'Hello?' }],
    });
    expect(status).toBe(422);
    expect(json.error).toMatch(/did not speak/);
  });

  it('502s with a readable error when the model provider fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const callModel = vi.fn<GradeModel>().mockRejectedValue(new Error('authentication_error'));
    const { status, json } = await post(appWith(callModel), { scenarioId: 'pr-blocking-release', turns });
    expect(status).toBe(502);
    expect(json.error).toMatch(/unavailable/);
  });
});

describe('POST /voice/token', () => {
  it('returns a minted token for a known scenario and never exposes the provider key', async () => {
    const app = createApp({ mintVoiceToken: async () => 'short-lived-token' });
    const { status, json } = await post(app, { scenarioId: 'pr-blocking-release' }, '/voice/token');
    expect(status).toBe(200);
    expect(json).toEqual({ token: 'short-lived-token' });
  });

  it('503s with a readable reason when voice is not configured', async () => {
    const { status, json } = await post(createApp({}), { scenarioId: 'pr-blocking-release' }, '/voice/token');
    expect(status).toBe(503);
    expect(json.error).toMatch(/not configured/);
  });

  it('404s an unknown scenario without minting', async () => {
    const mintVoiceToken = vi.fn(async () => 'token');
    const { status } = await post(createApp({ mintVoiceToken }), { scenarioId: 'nope' }, '/voice/token');
    expect(status).toBe(404);
    expect(mintVoiceToken).not.toHaveBeenCalled();
  });
});

describe('GET /health', () => {
  it('reports which services are configured', async () => {
    const response = await createApp({ mintVoiceToken: async () => 't' }).request('/health');
    expect(await response.json()).toEqual({ ok: true, grading: false, voice: true });
  });
});
