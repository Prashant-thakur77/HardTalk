import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: async (key: string) => storage.get(key) ?? null,
    setItem: async (key: string, value: string) => void storage.set(key, value),
    removeItem: async (key: string) => void storage.delete(key),
  },
}));

const outcomes = await import('../outcomes');

describe('real-conversation outcomes', () => {
  beforeEach(async () => {
    storage.clear();
    await outcomes.loadOutcomes();
  });

  it('remembers how the real one went, per scenario, across a restart', async () => {
    await outcomes.recordOutcome('interview-first-role', 'well', 1700000000000);
    await outcomes.loadOutcomes();
    expect(outcomes.getOutcomes()).toEqual({ 'interview-first-role': { outcome: 'well', at: 1700000000000 } });
    expect(outcomes.outcomeLabel('well')).toBe('It went well');
  });

  it('takes an answer back, so it can be changed', async () => {
    await outcomes.recordOutcome('custom-sample-interview', 'not_yet');
    await outcomes.clearOutcome('custom-sample-interview');
    await outcomes.loadOutcomes();
    expect(outcomes.getOutcomes()).toEqual({});
  });

  it('is deleted with the practice history', async () => {
    await outcomes.recordOutcome('pitch-seed-round', 'mixed');
    await outcomes.deleteAllOutcomes();
    await outcomes.loadOutcomes();
    expect(outcomes.getOutcomes()).toEqual({});
  });

  it('ignores corrupt saved data instead of crashing', async () => {
    storage.set('hardtalk.outcomes.v1', JSON.stringify({ x: { outcome: 'great' } }));
    await outcomes.loadOutcomes();
    expect(outcomes.getOutcomes()).toEqual({});
  });
});
