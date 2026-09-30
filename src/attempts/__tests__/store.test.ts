import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => void storage.set(key, value),
    multiSet: async (pairs: [string, string][]) => pairs.forEach(([key, value]) => storage.set(key, value)),
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
      key_line: null,
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

  it('still loads attempts saved before tracks, keeping the ask as the key line', async () => {
    const { key_line: _, ...grade } = attempt('old', 'pr', 'L1', 1).grade;
    const saved = { ...attempt('old', 'pr', 'L1', 1), grade: { ...grade, ask_made: true, ask_text: 'Merge by 4pm?', boundary_held: true } };
    storage.set('hardtalk.attempts.v1', JSON.stringify([saved]));
    await store.loadAttempts();
    expect(store.getAttempts()[0]?.grade.key_line).toBe('Merge by 4pm?');
  });

  it("moves an old pitch grade's close from Ask made to Next step, and leaves workplace grades alone", () => {
    const d = { score: 3, evidence_quotes: [], rationale: 'r', better_line: 'b' };
    const pitch = { dimensions: { answer_directness: d, evidence: d, objection_handling: d, ask_made: d }, key_line: null, safety_flag: false };
    const workplace = { dimensions: { clarity: d, empathy: d, ask_made: d, boundary_held: d }, key_line: null, safety_flag: false };
    expect(Object.keys((store.migrateGrade(pitch) as typeof pitch).dimensions)).toEqual([
      'answer_directness',
      'evidence',
      'objection_handling',
      'next_step',
    ]);
    expect(store.migrateGrade(workplace)).toEqual(workplace);
  });

  it('drops corrupt saved data instead of crashing', async () => {
    storage.set('hardtalk.attempts.v1', JSON.stringify([{ id: 'broken' }]));
    await store.loadAttempts();
    expect(store.getAttempts()).toEqual([]);
  });

  it('deletes every transcript on request, without resetting the free-session count', async () => {
    await store.addAttempt(attempt('a1', 'pr', 'L2', 1));
    await store.addAttempt(attempt('a2', 'pr', 'L2', 2));
    await store.deleteAllAttempts();
    await store.loadAttempts();
    expect(store.getAttempts()).toEqual([]);
    expect(store.getGradedSessionsUsed()).toBe(2);
  });

  it('withdraws a flagged attempt: transcript gone, free session given back, once', async () => {
    await store.addAttempt(attempt('a1', 'pr', 'L2', 1));
    await store.addAttempt(attempt('a2', 'pr', 'L2', 2));
    await store.withdrawAttempt('a2');
    await store.withdrawAttempt('a2');
    await store.loadAttempts();
    expect(store.getAttempts().map((a) => a.id)).toEqual(['a1']);
    expect(store.getGradedSessionsUsed()).toBe(1);
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
