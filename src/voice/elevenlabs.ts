import personaData from '@data/prompts/persona.yaml';
import type { Conversation } from '@elevenlabs/client';
import { requestRecordingPermissionsAsync } from 'expo-audio';

import { config } from '@/config';
import { getScenario } from '@/scenarios';

import { buildPersonaPrompt, personaConfigSchema } from './personaPrompt';
import type { EndReason, SessionConfig, SessionState, TranscriptEvent, VoiceProvider } from './VoiceProvider';

const personaConfig = personaConfigSchema.parse(personaData);

async function fetchConversationToken(scenarioId: string): Promise<string> {
  const response = await fetch(`${config.serverUrl}/voice/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scenarioId }),
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

  async startSession(session: SessionConfig): Promise<void> {
    const scenario = getScenario(session.scenarioId);
    if (!scenario) throw new Error(`Unknown scenario "${session.scenarioId}"`);
    this.maxUserTurns = scenario.max_user_turns;
    this.emitState({ status: 'connecting' });

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      this.emitState({ status: 'error', message: 'Microphone access is needed to talk to the persona.' });
      return;
    }

    // Importing the React Native package installs its WebRTC + native audio session setup,
    // which the client's Conversation then uses. Loaded lazily so mock mode never touches it.
    const [token, { Conversation }] = await Promise.all([
      fetchConversationToken(scenario.id),
      import('@elevenlabs/react-native').then(() => import('@elevenlabs/client')),
    ]);

    this.conversation = await Conversation.startSession({
      conversationToken: token,
      connectionType: 'webrtc',
      overrides: {
        agent: {
          prompt: { prompt: buildPersonaPrompt(personaConfig, scenario, session.difficulty) },
          firstMessage: scenario.opening_line,
        },
      },
      onMessage: ({ message, role, event_id }) => {
        const speaker = role === 'user' ? 'user' : 'persona';
        this.emitTranscript({ id: `${speaker}-${event_id ?? Date.now()}`, speaker, text: message, final: true });
        if (speaker === 'user') this.userTurns += 1;
      },
      onAgentResponseCorrection: ({ corrected_agent_response, event_id }) => {
        this.emitTranscript({ id: `persona-${event_id}`, speaker: 'persona', text: corrected_agent_response, final: true });
      },
      onModeChange: ({ mode }) => {
        // The persona is told to wrap up at the turn limit; this is the backstop, applied only
        // once it has finished speaking so it is never cut off mid-sentence.
        if (mode === 'listening' && this.userTurns >= this.maxUserTurns) {
          void this.end('turn_limit');
          return;
        }
        this.emitState({ status: mode === 'speaking' ? 'persona_speaking' : 'listening' });
      },
      onDisconnect: (details) => {
        if (details.reason === 'error') {
          this.emitState({ status: 'error', message: details.message });
          return;
        }
        this.emitState({ status: 'ended', reason: this.endReason ?? 'stop_condition' });
      },
      onError: (message) => this.emitState({ status: 'error', message }),
    });
  }

  async stopSession(): Promise<void> {
    await this.end('user_stopped');
  }

  onTranscript(listener: (event: TranscriptEvent) => void): () => void {
    this.transcriptListeners.add(listener);
    return () => this.transcriptListeners.delete(listener);
  }

  onStateChange(listener: (state: SessionState) => void): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  private async end(reason: EndReason) {
    if (this.endReason) return;
    this.endReason = reason;
    await this.conversation?.endSession();
  }

  private emitTranscript(event: TranscriptEvent) {
    this.transcriptListeners.forEach((listener) => listener(event));
  }

  private emitState(state: SessionState) {
    this.stateListeners.forEach((listener) => listener(state));
  }
}
