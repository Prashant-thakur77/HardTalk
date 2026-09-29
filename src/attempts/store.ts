import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { z } from 'zod';

import { gradeSchema } from '@/grading/rubric.schema';
import { turnSchema } from '@/grading/transcript';
import { difficultySchema } from '@/scenarios/schema';

/**
 * Grades saved before practice tracks had fixed workplace flags (ask_made, ask_text,
 * boundary_held). The ask became the key line; the flags were never shown on their own.
 */
function migrateGrade(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || 'key_line' in raw) return raw;
  const { ask_text: askText, ...rest } = raw as Record<string, unknown>;
  return { ...rest, key_line: askText ?? null };
}

const attemptSchema = z.object({
  id: z.string(),
  scenarioId: z.string(),
  difficulty: difficultySchema,
  mode: z.enum(['voice', 'text']).default('voice'),
  /** 1-based attempt number within this scenario. */
  number: z.number().int().min(1),
  turns: z.array(turnSchema),
  grade: z.preprocess(migrateGrade, gradeSchema),
  endReason: z.enum(['stop_condition', 'turn_limit']),
  createdAt: z.number(),
});
export type Attempt = z.infer<typeof attemptSchema>;
export type SessionMode = Attempt['mode'];

const STORAGE_KEY = 'hardtalk.attempts.v1';
/** Graded sessions ever completed on this device. Deleting history does not reset it. */
const USED_KEY = 'hardtalk.graded-sessions.v1';

let attempts: Attempt[] = [];
let gradedSessionsUsed = 0;
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
  const loaded = parsed.success ? parsed.data : [];
  const used = Number(await AsyncStorage.getItem(USED_KEY));
  gradedSessionsUsed = Math.max(Number.isFinite(used) ? used : 0, loaded.length);
  publish(loaded);
}

export async function addAttempt(attempt: Attempt): Promise<void> {
  gradedSessionsUsed += 1;
  publish([...attempts, attempt]);
  await AsyncStorage.multiSet([
    [STORAGE_KEY, JSON.stringify(attempts)],
    [USED_KEY, String(gradedSessionsUsed)],
  ]);
}

/** What the free tier counts. History can be deleted; this cannot, short of reinstalling. */
export function getGradedSessionsUsed(): number {
  return gradedSessionsUsed;
}

/**
 * Withdraws an attempt the server's distress check flagged after it was scored: the transcript
 * is deleted and the free session it used is given back, since it was never a practice session.
 */
export async function withdrawAttempt(id: string): Promise<void> {
  if (!attempts.some((attempt) => attempt.id === id)) return;
  gradedSessionsUsed = Math.max(0, gradedSessionsUsed - 1);
  publish(attempts.filter((attempt) => attempt.id !== id));
  await AsyncStorage.multiSet([
    [STORAGE_KEY, JSON.stringify(attempts)],
    [USED_KEY, String(gradedSessionsUsed)],
  ]);
}

/** Removes every saved transcript and score. The free-session count is kept. */
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
