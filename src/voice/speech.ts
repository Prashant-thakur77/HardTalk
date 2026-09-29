import * as Speech from 'expo-speech';

/** Reads persona lines aloud in mock mode. Live mode never uses it: ElevenLabs does the voices. */
export interface Speaker {
  speak(text: string, voice: { pitch: number; rate: number }): void;
  stop(): void;
}

/** The device's own speech engine: no network, no keys, a different pitch for each person. */
export const deviceSpeaker: Speaker = {
  speak(text, { pitch, rate }) {
    Speech.speak(text, { pitch, rate, language: 'en' });
  },
  stop() {
    void Speech.stop();
  },
};
