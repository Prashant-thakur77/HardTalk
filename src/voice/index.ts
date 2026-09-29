import { config } from '@/config';

import { ElevenLabsVoiceProvider } from './elevenlabs';
import { MockVoiceProvider } from './mock';
import { deviceSpeaker } from './speech';
import type { VoiceProvider } from './VoiceProvider';

export function createVoiceProvider(): VoiceProvider {
  return config.mock ? new MockVoiceProvider(deviceSpeaker) : new ElevenLabsVoiceProvider();
}

export type { EndReason, SessionState, Speaker, TranscriptEvent, VoiceProvider } from './VoiceProvider';
