import { config } from '@/config';

import { ElevenLabsVoiceProvider } from './elevenlabs';
import { MockVoiceProvider } from './mock';
import type { VoiceProvider } from './VoiceProvider';

export function createVoiceProvider(): VoiceProvider {
  return config.mock ? new MockVoiceProvider() : new ElevenLabsVoiceProvider();
}

export type { EndReason, SessionState, Speaker, TranscriptEvent, VoiceProvider } from './VoiceProvider';
