import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SessionState, TranscriptEvent } from '../VoiceProvider';

type Options = Record<string, (...args: never[]) => void> & { overrides: unknown; conversationToken: string };

const sdk = vi.hoisted(() => ({
  options: null as Options | null,
  endSession: vi.fn(),
  micGranted: true,
}));

vi.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: async () => ({ granted: sdk.micGranted }),
}));
vi.mock('@elevenlabs/react-native', () => ({}));
vi.mock('@elevenlabs/client', () => ({
  Conversation: {
    startSession: async (options: Options) => {
      sdk.options = options;
      return { endSession: sdk.endSession };
    },
  },
}));
vi.mock('@/config', () => ({ config: { mock: false, serverUrl: 'http://server.test' } }));

const { ElevenLabsVoiceProvider } = await import('../elevenlabs');

function fire(name: string, payload?: unknown) {
  (sdk.options![name] as (payload: unknown) => void)(payload);
}

async function start() {
  const provider = new ElevenLabsVoiceProvider();
  const states: SessionState[] = [];
  const events: TranscriptEvent[] = [];
  provider.onStateChange((state) => states.push(state));
  provider.onTranscript((event) => events.push(event));
  await provider.startSession({ scenarioId: 'pr-blocking-release', difficulty: 'L2', attempt: 1 });
  return { provider, states, events };
}

describe('ElevenLabsVoiceProvider', () => {
  beforeEach(() => {
    sdk.options = null;
    sdk.micGranted = true;
    sdk.endSession.mockReset().mockImplementation(async () => fire('onDisconnect', { reason: 'user' }));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ token: 'minted' }), { status: 200 })),
    );
  });

  it('asks the server for a token and sends the persona prompt for the chosen level', async () => {
    await start();
    expect(fetch).toHaveBeenCalledWith('http://server.test/voice/token', expect.objectContaining({ method: 'POST' }));
    expect(sdk.options!.conversationToken).toBe('minted');
    const overrides = sdk.options!.overrides as { agent: { prompt: { prompt: string }; firstMessage: string } };
    expect(overrides.agent.prompt.prompt).toContain('Defensive');
    expect(overrides.agent.firstMessage).toBe("Hey, what's up? I've only got a few minutes before standup.");
  });

  it('does not connect without microphone permission, and says why', async () => {
    sdk.micGranted = false;
    const { states } = await start();
    expect(sdk.options).toBeNull();
    expect(states.at(-1)).toEqual({ status: 'error', message: expect.stringMatching(/Microphone/) });
  });

  it('turns agent messages, corrections and modes into captions and states', async () => {
    const { states, events } = await start();
    fire('onModeChange', { mode: 'speaking' });
    fire('onMessage', { role: 'agent', message: 'It is a big change and I want it done properly.', event_id: 1 });
    fire('onAgentResponseCorrection', { corrected_agent_response: 'It is a big change', event_id: 1 });
    fire('onModeChange', { mode: 'listening' });
    fire('onMessage', { role: 'user', message: 'Can we split it?', event_id: 2 });

    expect(states).toContainEqual({ status: 'persona_speaking' });
    expect(states.at(-1)).toEqual({ status: 'listening' });
    expect(events.map((event) => [event.id, event.speaker, event.text])).toEqual([
      ['persona-1', 'persona', 'It is a big change and I want it done properly.'],
      ['persona-1', 'persona', 'It is a big change'],
      ['user-2', 'user', 'Can we split it?'],
    ]);
  });

  it('reports the agent hanging up as the stop condition', async () => {
    const { states } = await start();
    fire('onDisconnect', { reason: 'agent' });
    expect(states.at(-1)).toEqual({ status: 'ended', reason: 'stop_condition' });
  });

  it('ends at the turn limit only after the persona has finished speaking', async () => {
    const { states } = await start();
    for (let turn = 1; turn <= 6; turn += 1) fire('onMessage', { role: 'user', message: `turn ${turn}`, event_id: turn });
    fire('onModeChange', { mode: 'speaking' });
    expect(sdk.endSession).not.toHaveBeenCalled();

    fire('onModeChange', { mode: 'listening' });
    await vi.waitFor(() => expect(states.at(-1)).toEqual({ status: 'ended', reason: 'turn_limit' }));
  });

  it('reports a user stop as user_stopped, once', async () => {
    const { provider, states } = await start();
    await provider.stopSession();
    await provider.stopSession();
    expect(sdk.endSession).toHaveBeenCalledTimes(1);
    expect(states.at(-1)).toEqual({ status: 'ended', reason: 'user_stopped' });
  });

  it('surfaces a connection error instead of failing silently', async () => {
    const { states } = await start();
    fire('onDisconnect', { reason: 'error', message: 'ICE failed' });
    expect(states.at(-1)).toEqual({ status: 'error', message: 'ICE failed' });
  });
});
