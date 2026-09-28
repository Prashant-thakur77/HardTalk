import { config } from '@/config';

import { MockVoiceProvider } from './mock';
import type { VoiceProvider } from './VoiceProvider';

export function createVoiceProvider(): VoiceProvider {
  if (config.mock) return new MockVoiceProvider();
  throw new Error('Live voice is not wired yet. Run with EXPO_PUBLIC_MOCK=1.');
}

export type { EndReason, SessionState, Speaker, TranscriptEvent, VoiceProvider } from './VoiceProvider';
