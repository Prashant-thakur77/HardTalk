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
  const attempts = [attempt('a', 1, 2), attempt('b', 1, 1), attempt('a', 2, 4)];

  it('at the session limit, names the scenario being started and how its score moved', () => {
    expect(paywallContext('session_limit', attempts, titles, 'a')).toEqual({
      reason: 'session_limit',
      scenarioTitle: 'Blocked PR',
      scoreLine: '5 → 7 out of 16',
    });
  });

  it('names the scenario being started even if another one was practised last', () => {
    expect(paywallContext('session_limit', attempts, titles, 'b')).toEqual({
      reason: 'session_limit',
      scenarioTitle: 'Extra project',
      scoreLine: '4 out of 16',
    });
  });

  it('for "Create your own", uses the latest scenario practised', () => {
    expect(paywallContext('custom_scenario', attempts, titles).scenarioTitle).toBe('Blocked PR');
  });

  it('has no scenario to name on a fresh install', () => {
    expect(paywallContext('custom_scenario', [], titles)).toEqual({
      reason: 'custom_scenario',
      scenarioTitle: null,
      scoreLine: null,
    });
  });
});
