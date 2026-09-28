import { describe, expect, it } from 'vitest';

import { FREE_GRADED_SESSIONS, paywallContext, shouldGateNewSession } from '../gates';

const attempt = (scenarioId: string, number: number, total: number) => ({
  scenarioId,
  number,
  grade: {
    dimensions: {
      clarity: { score: total, evidence_quotes: [], rationale: 'r', better_line: 'b' },
      empathy: { score: 1, evidence_quotes: [], rationale: 'r', better_line: 'b' },
      ask_made: { score: 1, evidence_quotes: [], rationale: 'r', better_line: 'b' },
      boundary_held: { score: 1, evidence_quotes: [], rationale: 'r', better_line: 'b' },
    },
    ask_made: false,
    ask_text: null,
    boundary_held: false,
    safety_flag: false,
  },
});

const titles = (id: string) => ({ a: 'Blocked PR', b: 'Extra project' })[id] ?? id;

describe('shouldGateNewSession', () => {
  it('lets a free user start sessions 1 to 3 and gates the 4th', () => {
    expect(FREE_GRADED_SESSIONS).toBe(3);
    expect([0, 1, 2, 3, 4].map((graded) => shouldGateNewSession(graded, false))).toEqual([
      false,
      false,
      false,
      true,
      true,
    ]);
  });

  it('never gates a pro user', () => {
    expect(shouldGateNewSession(50, true)).toBe(false);
  });
});

describe('paywallContext', () => {
  it('names the scenario just practised and how its score moved', () => {
    const attempts = [attempt('a', 1, 2), attempt('b', 1, 1), attempt('a', 2, 4)];
    expect(paywallContext('session_limit', attempts, titles)).toEqual({
      reason: 'session_limit',
      scenarioTitle: 'Blocked PR',
      scoreLine: '5 → 7 out of 16',
    });
  });

  it('gives the latest score when a scenario was tried once', () => {
    expect(paywallContext('custom_scenario', [attempt('b', 1, 2)], titles)).toEqual({
      reason: 'custom_scenario',
      scenarioTitle: 'Extra project',
      scoreLine: '5 out of 16',
    });
  });

  it('falls back to neutral copy before any graded session', () => {
    expect(paywallContext('custom_scenario', [], titles)).toEqual({
      reason: 'custom_scenario',
      scenarioTitle: 'your next conversation',
      scoreLine: null,
    });
  });
});
