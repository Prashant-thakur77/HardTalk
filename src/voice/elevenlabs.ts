import personaData from '@data/prompts/persona.yaml';
import type { Conversation } from '@elevenlabs/client';
import { requestRecordingPermissionsAsync } from 'expo-audio';

import { config } from '@/config';
import { getScenario, scenarioRef } from '@/scenarios';
import { getTrack } from '@/tracks';

import { buildPersonaPrompt, isPersonaStopLine, personaConfigSchema, splitPanelReply } from './personaPrompt';
import type { EndReason, SessionConfig, SessionState, TranscriptEvent, VoiceProvider } from './VoiceProvider';

const personaConfig = personaConfigSchema.parse(personaData);

async function fetchConversationToken(scenarioId: string): Promise<string> {
  const response = await fetch(`${config.serverUrl}/voice/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(scenarioRef(scenarioId)),
  });
  const body = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !body.token) throw new Error(body.error ?? `Could not start a voice session (${response.status}).`);
  return body.token;
}

/**
 * Live roleplay over ElevenLabs Agents (WebRTC via LiveKit). The server mints a short-lived
 * conversation token, so no ElevenLabs key ever reaches the device. The persona prompt is
 * built from data/ and sent as a per-session override.
 */
export class ElevenLabsVoiceProvider implements VoiceProvider {
  private transcriptListeners = new Set<(event: TranscriptEvent) => void>();
  private stateListeners = new Set<(state: SessionState) => void>();
  private conversation: Conversation | null = null;
  private endReason: EndReason | null = null;
  private userTurns = 0;
  private maxUserTurns = Infinity;
  private textOnly = false;
  private panelNames: string[] = [];
  private ending = false;
  private finished = false;

  async startSession(session: SessionConfig): Promise<void> {
    const scenario = getScenario(session.scenarioId);
    if (!scenario) throw new Error(`Unknown scenario "${session.scenarioId}"`);
    this.maxUserTurns = scenario.max_user_turns;
    this.textOnly = session.textOnly;
    this.panelNames = scenario.panel.map((member) => member.name);
    this.emitState({ status: 'connecting' });

    if (!session.textOnly) {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        this.emitState({
          status: 'error',
          message: 'Microphone access is needed to talk to the persona. Text-only mode works without it.',
        });
        return;
      }
    }

    // Importing the React Native package installs its WebRTC + native audio session setup,
    // which the client's Conversation then uses. Loaded lazily so mock mode never touches it.
    const [token, { Conversation }] = await Promise.all([
      fetchConversationToken(scenario.id),
      import('@elevenlabs/react-native').then(() => import('@elevenlabs/client')),
    ]);
    if (this.endReason) return; // stopped while connecting: never open the call

    this.conversation = await Conversation.startSession({
      conversationToken: token,
      connectionType: 'webrtc',
      textOnly: session.textOnly,
      overrides: {
        agent: {
          prompt: { prompt: buildPersonaPrompt(personaConfig, getTrack(scenario.track), scenario, session.difficulty) },
          firstMessage: scenario.opening_line,
        },
        tts: { speed: session.speechRate },
        conversation: { textOnly: session.textOnly },
      },
      onMessage: ({ message, role, event_id }) => {
        const speaker = role === 'user' ? 'user' : 'persona';
        // Typed lines are captioned the moment they are sent, in sendText.
        if (speaker === 'user' && this.textOnly) return;
        const id = `${speaker}-${event_id ?? Date.now()}`;
        if (speaker === 'user') {
          this.emitTranscript({ id, speaker, text: message, final: true });
          this.userTurns += 1;
        } else {
          this.emitPersonaReply(id, message);
        }
        // The persona dropped the roleplay (stop word or distress): hang up now, unscored,
        // rather than trust the agent to end the call.
        if (speaker === 'persona' && isPersonaStopLine(personaConfig, message)) {
          void this.end('user_stopped');
          return;
        }
        if (speaker === 'persona' && this.textOnly) this.afterPersonaTurn();
      },
      onAgentResponseCorrection: ({ corrected_agent_response, event_id }) => {
        this.emitPersonaReply(`persona-${event_id}`, corrected_agent_response);
      },
      onModeChange: ({ mode }) => {
        if (mode === 'listening') this.afterPersonaTurn();
        else this.emitState({ status: 'persona_speaking' });
      },
      onDisconnect: (details) => {
        if (details.reason === 'error') {
          this.emitState({ status: 'error', message: details.message });
          return;
        }
        this.emitEnded(this.endReason ?? 'stop_condition');
      },
      onError: (message) => this.emitState({ status: 'error', message }),
    });
    // Stopped while the call was being set up: hang up the moment it exists.
    if (this.endReason) await this.conversation.endSession();
  }

  async stopSession(): Promise<void> {
    await this.end('user_stopped');
  }

  sendText(text: string): void {
    if (!this.conversation || this.endReason) return;
    this.conversation.sendUserMessage(text);
    this.emitTranscript({ id: `user-typed-${Date.now()}`, speaker: 'user', text, final: true });
    this.userTurns += 1;
    this.emitState({ status: 'persona_speaking' });
  }

  setVolume(volume: number): void {
    this.conversation?.setVolume({ volume });
  }

  /**
   * The persona is told to wrap up at the turn limit; this is the backstop, applied only once
   * it has finished its turn so it is never cut off mid-sentence.
   */
  private afterPersonaTurn() {
    if (this.userTurns >= this.maxUserTurns) void this.end('turn_limit');
    else this.emitState({ status: 'listening' });
  }

  onTranscript(listener: (event: TranscriptEvent) => void): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  onStateChange(listener: (state: SessionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  /** Ends the session once. The first reason given is the one reported. */
  private async end(reason: EndReason) {
    this.endReason ??= reason;
    if (this.finished || this.ending) return;
    if (!this.conversation) {
      this.emitEnded(this.endReason);
      return;
    }
    this.ending = true;
    await this.conversation.endSession();
  }

  private emitEnded(reason: EndReason) {
    if (this.finished) return;
    this.finished = true;
    this.emitState({ status: 'ended', reason });
  }

  /** One reply can hold several people on a panel: one caption each, labelled with who spoke. */
  private emitPersonaReply(id: string, text: string) {
    splitPanelReply(text, this.panelNames).forEach((line, index) =>
      this.emitTranscript({ id: `${id}-${index}`, speaker: 'persona', ...line, final: true }),
    );
  }

  private emitTranscript(event: TranscriptEvent) {
    this.transcriptListeners.forEach((listener) => listener(event));
  }

  private emitState(state: SessionState) {
    this.stateListeners.forEach((listener) => listener(state));
  }
}
