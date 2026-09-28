import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

export const SPEECH_RATES = [
  { label: 'Slower', value: 0.85 },
  { label: 'Normal', value: 1 },
  { label: 'Faster', value: 1.15 },
] as const;

export interface Preferences {
  /** Persona speaking rate. */
  speechRate: number;
  /** From the OS setting: captions appear a whole line at a time. */
  reduceMotion: boolean;
}

const STORAGE_KEY = 'hardtalk.speech-rate.v1';
let preferences: Preferences = { speechRate: 1, reduceMotion: false };
const listeners = new Set<() => void>();

function publish(next: Preferences) {
  preferences = next;
  listeners.forEach((listener) => listener());
}

export async function loadPreferences(): Promise<void> {
  const [reduceMotion, savedRate] = await Promise.all([
    AccessibilityInfo.isReduceMotionEnabled().catch(() => false),
    AsyncStorage.getItem(STORAGE_KEY),
  ]);
  const rate = Number(savedRate);
  publish({
    reduceMotion,
    speechRate: SPEECH_RATES.some((option) => option.value === rate) ? rate : 1,
  });
  AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) =>
    publish({ ...preferences, reduceMotion: enabled }),
  );
}

export async function setSpeechRate(speechRate: number): Promise<void> {
  publish({ ...preferences, speechRate });
  await AsyncStorage.setItem(STORAGE_KEY, String(speechRate));
}

export function getPreferences(): Preferences {
  return preferences;
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getPreferences,
    getPreferences,
  );
}
