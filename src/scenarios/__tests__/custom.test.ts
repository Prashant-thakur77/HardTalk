import { describe, expect, it, vi } from 'vitest';

vi.mock('@react-native-async-storage/async-storage', () => ({ default: {} }));

const { buildCustomScenario, customScenarioFormSchema, isCustomScenario } = await import('../custom');

const form = {
  title: 'Ask my lead for a raise',
  personaName: 'Dana',
  personaRole: 'Engineering lead',
  userGoal: 'A clear answer on a raise at the next review cycle',
  pushback: 'Budgets are frozen until next year',
};

describe('custom scenarios', () => {
  it('builds a complete, schema-valid scenario from five answers', () => {
    const scenario = buildCustomScenario(form, 1700000000000);
    expect(scenario.id).toBe('custom-ask-my-lead-for-a-raise-1700000000000');
    expect(isCustomScenario(scenario.id)).toBe(true);
    expect(scenario.persona).toMatchObject({ name: 'Dana', hidden_objection: 'Budgets are frozen until next year' });
    expect(Object.keys(scenario.difficulty_levels)).toEqual(['L1', 'L2', 'L3']);
    expect(scenario.max_user_turns).toBe(6);
  });

  it('explains what is missing instead of saving a half-empty scenario', () => {
    const result = customScenarioFormSchema.safeParse({ ...form, pushback: ' ' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe('What pushback do you expect?');
  });
});
