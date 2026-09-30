import { describe, expect, it, vi } from 'vitest';

import type { GradeModel } from '../../src/grading/grade';
import type { Grade } from '../../src/grading/rubric.schema';
import { createApp } from '../src/app';
import { DraftError } from '../src/drafter';

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
  key_line: null,
  safety_flag: false,
};

const custom = {
  id: 'custom-raise-1',
  title: 'Ask for a raise',
  summary: 'Budgets are frozen.',
  user_goal: 'A clear answer on a raise',
  persona: { name: 'Dana', role: 'Lead', goal: 'Hold budget', hidden_objection: 'Frozen', tone: 'Guarded', context: ['x'] },
  difficulty_levels: {
    L1: { name: 'Cooperative', summary: 'Busy.', behaviour: 'Agrees once the request is specific enough.' },
    L2: { name: 'Defensive', summary: 'Pushes back.', behaviour: 'Justifies once and needs a second, specific ask.' },
    L3: { name: 'Deflecting', summary: 'Deflects.', behaviour: 'Changes the subject and questions standing twice.' },
  },
  opening_line: 'You wanted to talk?',
  stop_condition: 'End when the ask is answered.',
  max_user_turns: 6,
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
    expect((json.grade as Grade).dimensions.ask_made?.score).toBe(1);
    expect((json.grade as Grade).dimensions.clarity?.score).toBe(3);
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

  it('grades a custom scenario sent in full', async () => {
    const callModel = vi.fn<GradeModel>().mockResolvedValue({
      ...grade,
      dimensions: { ...grade.dimensions, ask_made: dimension(1, 'x') },
    });
    const gradeModelFor = vi.fn(() => callModel);
    const scenario = { ...custom, id: 'custom-raise-1' };
    const { status } = await post(createApp({ gradeModelFor }), { scenario, turns });
    expect(status).toBe(200);
    expect(gradeModelFor).toHaveBeenCalledWith(expect.objectContaining({ id: 'custom-raise-1', title: 'Ask for a raise' }));
  });

  it('rejects a full scenario object that pretends to be a built-in one', async () => {
    const { status } = await post(appWith(vi.fn<GradeModel>()), { scenario: { ...custom, id: 'pr-blocking-release' }, turns });
    expect(status).toBe(400);
  });

  it('never scores a conversation where the user sounds genuinely distressed', async () => {
    const callModel = vi.fn<GradeModel>();
    const { status, json } = await post(appWith(callModel), {
      scenarioId: 'pr-blocking-release',
      turns: [...turns, { speaker: 'user', text: "Honestly I don't want to be alive anymore." }],
    });
    expect(status).toBe(422);
    expect(json.safety).toBe(true);
    expect(callModel).not.toHaveBeenCalled();
  });

  it('does not return a score when the grader raises the safety flag', async () => {
    const callModel = vi.fn<GradeModel>().mockResolvedValue({ ...grade, safety_flag: true });
    const { status, json } = await post(appWith(callModel), { scenarioId: 'pr-blocking-release', turns });
    expect(status).toBe(422);
    expect(json).toEqual({ error: 'This conversation was not scored.', safety: true });
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
    expect(await response.json()).toEqual({ ok: true, grading: false, voice: true, safetyModel: false, drafting: false });
  });
});

describe('POST /safety/check', () => {
  it('answers from the shared rules without calling the model when they already match', async () => {
    const checkDistress = vi.fn(async () => false);
    const { json } = await post(createApp({ checkDistress }), { text: "I'm going to kill myself on Friday." }, '/safety/check');
    expect(json).toEqual({ distress: true, source: 'rules' });
    expect(checkDistress).not.toHaveBeenCalled();
  });

  it('asks the model about lines the rules pass, which is how paraphrases get caught', async () => {
    const checkDistress = vi.fn(async () => true);
    const { json } = await post(createApp({ checkDistress }), { text: 'I just want everything to go quiet for good.' }, '/safety/check');
    expect(json).toEqual({ distress: true, source: 'model' });
    expect(checkDistress).toHaveBeenCalledWith('I just want everything to go quiet for good.');
  });

  it('says the model check failed instead of passing a failure off as "no distress"', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const checkDistress = vi.fn(async () => {
      throw new Error('401 invalid key');
    });
    const { status, json } = await post(createApp({ checkDistress }), { text: 'That man touched me today.' }, '/safety/check');
    expect(status).toBe(200);
    expect(json).toEqual({ distress: true, source: 'rules' });

    const quiet = await post(createApp({ checkDistress }), { text: 'Can we split the PR?' }, '/safety/check');
    expect(quiet.json).toEqual({ distress: false, source: 'rules', modelError: true });
  });

  it('falls back to the rules alone when no model is configured', async () => {
    const { json } = await post(createApp({}), { text: 'Can we split the PR?' }, '/safety/check');
    expect(json).toEqual({ distress: false, source: 'rules' });
  });
});

describe('limits', () => {
  it('caps provider calls per client, so a stranger on the network cannot drain the keys', async () => {
    const app = createApp({ mintVoiceToken: async () => 't', limit: { max: 2, windowMs: 60_000 } });
    const statuses = [];
    for (let i = 0; i < 3; i += 1) statuses.push((await post(app, { scenarioId: 'pr-blocking-release' }, '/voice/token')).status);
    expect(statuses).toEqual([200, 200, 429]);
  });

  it('rejects an oversized turn before any model call', async () => {
    const callModel = vi.fn<GradeModel>();
    const { status } = await post(appWith(callModel), {
      scenarioId: 'pr-blocking-release',
      turns: [{ speaker: 'user', text: 'x'.repeat(2001) }],
    });
    expect(status).toBe(400);
    expect(callModel).not.toHaveBeenCalled();
  });
});

describe('POST /scenario/draft', () => {
  const source = 'Junior Software Engineer (Graduate). You will build and test features for our booking platform. '.repeat(2);

  it('says so when drafting is not configured', async () => {
    const { status } = await post(createApp({}), { track: 'interview', source }, '/scenario/draft');
    expect(status).toBe(503);
  });

  it('drafts from pasted text with the chosen track', async () => {
    const draftScenario = vi.fn().mockResolvedValue({ id: 'custom-x-1' });
    const { status, json } = await post(createApp({ draftScenario }), { track: 'interview', source }, '/scenario/draft');
    expect(status).toBe(200);
    expect(json.scenario).toEqual({ id: 'custom-x-1' });
    expect(draftScenario).toHaveBeenCalledWith(expect.objectContaining({ id: 'interview' }), source.trim());
  });

  it('refuses text too short to draft from, and an unknown track', async () => {
    const draftScenario = vi.fn();
    const app = createApp({ draftScenario });
    expect((await post(app, { track: 'interview', source: 'Too short.' }, '/scenario/draft')).status).toBe(400);
    expect((await post(app, { track: 'karaoke', source }, '/scenario/draft')).status).toBe(400);
    expect(draftScenario).not.toHaveBeenCalled();
  });

  it('does not turn text that sounds like distress into a roleplay', async () => {
    const draftScenario = vi.fn();
    const distressed = `${source} Honestly I don't want to be alive anymore.`;
    const { status, json } = await post(createApp({ draftScenario }), { track: 'workplace', source: distressed }, '/scenario/draft');
    expect(status).toBe(422);
    expect(json.safety).toBe(true);
    expect(draftScenario).not.toHaveBeenCalled();
  });

  it('passes on why a draft failed', async () => {
    const draftScenario = vi.fn().mockRejectedValue(new DraftError('The panel could not be drafted.'));
    const { status, json } = await post(createApp({ draftScenario }), { track: 'pitch', source }, '/scenario/draft');
    expect(status).toBe(422);
    expect(json.error).toBe('The panel could not be drafted.');
  });
});
