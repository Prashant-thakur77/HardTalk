import { describe, expect, it } from 'vitest';

import { DIMENSIONS } from '../../src/grading/rubric.schema';
import { detectDistress } from '../../src/safety/rules';
import { getScenario, safetyConfig } from '../../server/src/data';
import { loadGold } from '../gold';

const gold = loadGold();

describe('evals/gold', () => {
  it('has 30 or more labelled conversations with unique ids', () => {
    expect(gold.length).toBeGreaterThanOrEqual(30);
    expect(new Set(gold.map((item) => item.id)).size).toBe(gold.length);
  });

  it('covers every scenario, each opening with its real first line', () => {
    for (const item of gold) {
      const scenario = getScenario(item.scenarioId);
      expect(scenario, item.id).toBeDefined();
      expect(item.turns[0]).toEqual({ speaker: 'persona', text: scenario!.opening_line });
    }
  });

  it('uses every score 1-4 on every dimension, so agreement is measured across the scale', () => {
    for (const dimension of DIMENSIONS) {
      expect(new Set(gold.map((item) => item.labels[dimension])), dimension).toEqual(new Set([1, 2, 3, 4]));
    }
  });

  it('contains no line that would trip the distress exit (those are never graded)', () => {
    for (const item of gold) {
      for (const turn of item.turns) expect(detectDistress(turn.text, safetyConfig), item.id).toBe(false);
    }
  });
});
