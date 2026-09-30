import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';
import { z } from 'zod';

/**
 * How the real conversation went, told by the user after practising for it. It closes the loop
 * from practice to the moment that mattered, and it never leaves the device.
 */
export const OUTCOMES = [
  { value: 'well', label: 'It went well' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'not_yet', label: 'Not this time' },
] as const;
export type Outcome = (typeof OUTCOMES)[number]['value'];

const outcomesSchema = z.record(
  z.string(),
  z.object({ outcome: z.enum(['well', 'mixed', 'not_yet']), at: z.number() }),
);
type Outcomes = z.infer<typeof outcomesSchema>;

const STORAGE_KEY = 'hardtalk.outcomes.v1';
let outcomes: Outcomes = {};
const listeners = new Set<() => void>();

function publish(next: Outcomes) {
  outcomes = next;
  listeners.forEach((listener) => listener());
}

export async function loadOutcomes(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = outcomesSchema.safeParse(raw ? JSON.parse(raw) : {});
  publish(parsed.success ? parsed.data : {});
}

export async function recordOutcome(scenarioId: string, outcome: Outcome, now = Date.now()): Promise<void> {
  publish({ ...outcomes, [scenarioId]: { outcome, at: now } });
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(outcomes));
}

/** Deleting practice history deletes these too: they are part of the same private record. */
export async function deleteAllOutcomes(): Promise<void> {
  publish({});
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export function getOutcomes(): Outcomes {
  return outcomes;
}

export function useOutcomes(): Outcomes {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getOutcomes,
    getOutcomes,
  );
}

export const outcomeLabel = (outcome: Outcome) => OUTCOMES.find((option) => option.value === outcome)!.label;
