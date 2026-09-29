import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { applyTranscriptEvent, type LiveTurn } from '@/session/turns';
import { MockVoiceProvider } from '@/voice/mock';
import type { Speaker } from '@/voice/speech';
import type { SessionState } from '@/voice/VoiceProvider';

describe('MockVoiceProvider', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function run(
    attempt: number,
    options: { textOnly?: boolean; reduceMotion?: boolean; speaker?: Speaker; scenarioId?: string } = {},
  ) {
    const provider = new MockVoiceProvider(options.speaker);
    const states: SessionState[] = [];
    let turns: LiveTurn[] = [];
    provider.onStateChange((state) => states.push(state));
    provider.onTranscript((event) => {
      turns = applyTranscriptEvent(turns, event);
    });
    void provider.startSession({
      scenarioId: options.scenarioId ?? 'pr-blocking-release',
      difficulty: 'L2',
      attempt,
      textOnly: options.textOnly ?? false,
      speechRate: 1,
      reduceMotion: options.reduceMotion ?? false,
    });
    return { provider, states, turns: () => turns };
  }

  it('streams partial captions, alternates speakers, then ends on the stop condition', () => {
    const { states, turns } = run(1);
    expect(states[0]).toEqual({ status: 'connecting' });

    vi.advanceTimersByTime(700);
    expect(turns()).toHaveLength(1);
    expect(turns()[0]).toMatchObject({ speaker: 'persona', final: false });

    vi.runAllTimers();
    expect(turns().every((turn) => turn.final)).toBe(true);
    expect(turns().map((turn) => turn.speaker).slice(0, 3)).toEqual(['persona', 'user', 'persona']);
    expect(states).toContainEqual({ status: 'persona_speaking' });
    expect(states).toContainEqual({ status: 'listening' });
    expect(states.at(-1)).toEqual({ status: 'ended', reason: 'stop_condition' });
  });

  it('stopSession ends immediately and cancels the rest of the replay', async () => {
    const { provider, states, turns } = run(1);
    vi.advanceTimersByTime(1500);
    const seen = turns().length;

    await provider.stopSession();
    vi.runAllTimers();

    expect(states.at(-1)).toEqual({ status: 'ended', reason: 'user_stopped' });
    expect(states.filter((state) => state.status === 'ended')).toHaveLength(1);
    expect(turns()).toHaveLength(seen);
  });

  it('replays the retry recording from the second attempt on', () => {
    const first = run(1);
    vi.runAllTimers();
    const retry = run(2);
    vi.runAllTimers();
    expect(retry.turns().map((turn) => turn.text)).not.toEqual(first.turns().map((turn) => turn.text));
  });

  it('shows whole lines at once when Reduce Motion is on', () => {
    const { turns } = run(1, { reduceMotion: true });
    vi.advanceTimersByTime(700);
    expect(turns()[0]).toMatchObject({ final: true, text: "Hey, what's up? I've only got a few minutes before standup." });
  });

  it('text-only mode waits for the typed reply and offers the recorded line as a start', () => {
    const { provider, states, turns } = run(1, { textOnly: true });
    vi.runAllTimers();
    expect(states.at(-1)).toEqual({ status: 'listening' });
    expect(turns()).toHaveLength(1);
    expect(provider.suggestedReply()).toMatch(/^Hey, um, so I just wanted/);

    provider.sendText('Your auth refactor has blocked the release for three days.');
    vi.runAllTimers();
    expect(turns().map((turn) => turn.speaker)).toEqual(['persona', 'user', 'persona']);
    expect(turns()[1]!.text).toBe('Your auth refactor has blocked the release for three days.');

    provider.sendText('Can you merge by 4pm?');
    vi.runAllTimers();
    provider.sendText('Thanks.');
    vi.runAllTimers();
    expect(states.at(-1)).toEqual({ status: 'ended', reason: 'stop_condition' });
    expect(provider.suggestedReply()).toBeNull();
  });

  describe('reading lines aloud', () => {
    const fakeSpeaker = () => ({ speak: vi.fn<Speaker['speak']>(), stop: vi.fn() });

    it("speaks every persona line, in each person's own pitch, and never the user's lines", () => {
      const speaker = fakeSpeaker();
      const { turns } = run(1, { speaker, scenarioId: 'pitch-seed-round' });
      vi.runAllTimers();
      const personaLines = turns().filter((turn) => turn.speaker === 'persona');
      expect(speaker.speak.mock.calls.map(([text]) => text)).toEqual(personaLines.map((turn) => turn.text));
      const pitches = new Set(speaker.speak.mock.calls.map(([, voice]) => voice.pitch));
      expect(pitches.size).toBe(new Set(personaLines.map((turn) => turn.name ?? 'lead')).size);
    });

    it('stays silent in text-only mode', () => {
      const speaker = fakeSpeaker();
      const { provider } = run(1, { speaker, textOnly: true });
      vi.runAllTimers();
      provider.sendText('Your auth refactor has blocked the release for three days.');
      vi.runAllTimers();
      expect(speaker.speak).not.toHaveBeenCalled();
    });

    it('goes quiet while a screen reader announcement plays, and on stop', async () => {
      const speaker = fakeSpeaker();
      const { provider } = run(1, { speaker });
      provider.setVolume(0);
      vi.runAllTimers();
      expect(speaker.speak).not.toHaveBeenCalled();
      expect(speaker.stop).toHaveBeenCalled();

      const again = run(1, { speaker: fakeSpeaker() });
      await again.provider.stopSession();
      vi.runAllTimers();
      expect(again.states.at(-1)).toEqual({ status: 'ended', reason: 'user_stopped' });
    });
  });
});
