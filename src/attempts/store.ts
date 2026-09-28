import { useSyncExternalStore } from 'react';

import type { Grade } from '@/grading/rubric.schema';
import type { Turn } from '@/grading/transcript';
import type { Difficulty } from '@/scenarios/schema';
import type { EndReason } from '@/voice/VoiceProvider';

export interface Attempt {
  id: string;
  scenarioId: string;
  difficulty: Difficulty;
  /** 1-based attempt number within this scenario. */
  number: number;
  turns: Turn[];
  grade: Grade;
  endReason: EndReason;
  createdAt: number;
}

let attempts: Attempt[] = [];
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function addAttempt(attempt: Attempt) {
  attempts = [...attempts, attempt];
  listeners.forEach((listener) => listener());
}

export function useAttempts(): Attempt[] {
  return useSyncExternalStore(subscribe, () => attempts, () => attempts);
}

export function nextAttemptNumber(scenarioId: string): number {
  return attempts.filter((attempt) => attempt.scenarioId === scenarioId).length + 1;
}

export function findAttempt(list: Attempt[], id: string): Attempt | undefined {
  return list.find((attempt) => attempt.id === id);
}

/** The attempt immediately before this one on the same scenario, for the retry delta. */
export function findPreviousAttempt(list: Attempt[], attempt: Attempt): Attempt | undefined {
  return list
    .filter((other) => other.scenarioId === attempt.scenarioId && other.number < attempt.number)
    .at(-1);
}
