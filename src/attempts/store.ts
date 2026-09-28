import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { gradeSchema } from '@/grading/rubric.schema';
import { turnSchema } from '@/grading/transcript';
import { difficultySchema } from '@/scenarios/schema';

const attemptSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  difficulty: difficultySchema,
  mode: z.enum(['voice', 'text']).default('voice'),
  /** 1-based attempt number within this scenario. */
  number: z.number().int().min(1),
  turns: z.array(turnSchema),
  grade: gradeSchema,
  endReason: z.enum(['stop_condition', 'turn_limit']),
  createdAt: z.number(),
});
export type Attempt = z.infer<typeof attemptSchema>;
export type SessionMode = Attempt['mode'];

const STORAGE_KEY = 'hardtalk.attempts.v1';

let attempts: Attempt[] = [];
const listeners = new Set<() => void>();

function publish(next: Attempt[]) {
  attempts = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Loads saved attempts. Anything that no longer matches the schema is dropped, not crashed on. */
export async function loadAttempts(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = z.array(attemptSchema).safeParse(raw ? JSON.parse(raw) : []);
  publish(parsed.success ? parsed.data : []);
}

export async function addAttempt(attempt: Attempt): Promise<void> {
  publish([...attempts, attempt]);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
}

/** Transcripts live only on this device; this removes all of them. */
export async function deleteAllAttempts(): Promise<void> {
  publish([]);
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function getAttempts(): Attempt[] {
  return attempts;
}

export function useAttempts(): Attempt[] {
  return useSyncExternalStore(subscribe, getAttempts, getAttempts);
}

export function nextAttemptNumber(scenarioId: string): number {
  return attempts.filter((attempt) => attempt.scenarioId === scenarioId).length + 1;
}

export function findAttempt(list: Attempt[], id: string): Attempt | undefined {
  return list.find((attempt) => attempt.id === id);
}

/**
 * The attempt to compare against for the retry delta: the latest earlier attempt on the same
 * scenario at the same difficulty. Comparing an L3 score with an L1 score would mean nothing.
 */
export function findPreviousAttempt(list: Attempt[], attempt: Attempt): Attempt | undefined {
  return list
    .filter(
      (other) =>
        other.scenarioId === attempt.scenarioId &&
        other.difficulty === attempt.difficulty &&
        other.number < attempt.number,
    )
    .at(-1);
}
