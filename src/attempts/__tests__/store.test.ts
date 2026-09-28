import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => void storage.set(key, value),
    removeItem: async (key: string) => void storage.delete(key),
  },
}));

const store = await import('../store');
type Attempt = import('../store').Attempt;

const dimension = { score: 2, evidence_quotes: ['x'], rationale: 'r', better_line: 'b' };
function attempt(id: string, scenarioId: string, difficulty: 'L1' | 'L2' | 'L3', number: number): Attempt {
  return {
    id,
    scenarioId,
    difficulty,
    mode: 'voice',
    number,
    turns: [{ speaker: 'user', text: 'x' }],
    grade: {
      dimensions: { clarity: dimension, empathy: dimension, ask_made: dimension, boundary_held: dimension },
      ask_made: false,
      ask_text: null,
      boundary_held: false,
      safety_flag: false,
    },
    endReason: 'stop_condition',
    createdAt: number,
  };
}

describe('attempt store', () => {
  beforeEach(async () => {
    storage.clear();
    await store.loadAttempts();
  });

  it('persists attempts so history survives a restart', async () => {
    await store.addAttempt(attempt('a1', 'pr', 'L2', 1));
    await store.loadAttempts();
    expect(store.getAttempts().map((a) => a.id)).toEqual(['a1']);
    expect(store.nextAttemptNumber('pr')).toBe(2);
  });

  it('drops corrupt saved data instead of crashing', async () => {
    storage.set('hardtalk.attempts.v1', JSON.stringify([{ id: 'broken' }]));
    await store.loadAttempts();
    expect(store.getAttempts()).toEqual([]);
  });

  it('deletes every transcript on request', async () => {
    await store.addAttempt(attempt('a1', 'pr', 'L2', 1));
    await store.deleteAllAttempts();
    await store.loadAttempts();
    expect(store.getAttempts()).toEqual([]);
  });

  it('compares a retry only with the latest earlier attempt at the same difficulty', () => {
    const list = [
      attempt('a1', 'pr', 'L2', 1),
      attempt('b1', 'other', 'L2', 1),
      attempt('a2', 'pr', 'L3', 2),
      attempt('a3', 'pr', 'L2', 3),
      attempt('a4', 'pr', 'L2', 4),
    ];
    expect(store.findPreviousAttempt(list, list[4]!)?.id).toBe('a3');
    expect(store.findPreviousAttempt(list, list[3]!)?.id).toBe('a1');
    expect(store.findPreviousAttempt(list, list[2]!)).toBeUndefined();
  });
});
