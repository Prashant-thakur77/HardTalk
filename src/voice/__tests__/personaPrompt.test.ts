import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { scenarioSchema } from '../../scenarios/schema';
import { buildPersonaPrompt, personaConfigSchema } from '../personaPrompt';

const DATA = join(__dirname, '../../../data');
const load = (path: string) => YAML.parse(readFileSync(join(DATA, path), 'utf8')) as unknown;

const config = personaConfigSchema.parse(load('prompts/persona.yaml'));
const scenario = scenarioSchema.parse(load('scenarios/pr-blocking-release.yaml'));

describe('buildPersonaPrompt', () => {
  it('fills every placeholder from the scenario and chosen level', () => {
    const prompt = buildPersonaPrompt(config, scenario, 'L2');
    expect(prompt).not.toMatch(/{{\w+}}/);
    expect(prompt).toContain('You are Sam, senior engineer on your team.');
    expect(prompt).toContain(scenario.persona.hidden_objection.trim());
    expect(prompt).toContain(scenario.difficulty_levels.L2.behaviour.trim());
    expect(prompt).not.toContain(scenario.difficulty_levels.L3.behaviour.trim());
  });

  it('always carries the guardrails and the stop word', () => {
    for (const level of ['L1', 'L2', 'L3'] as const) {
      const prompt = buildPersonaPrompt(config, scenario, level);
      expect(prompt).toMatch(/Never insult,\s+threaten,\s+use slurs/);
      expect(prompt).toContain('"stop" or "pause"');
      expect(prompt).toContain(`spoken ${scenario.max_user_turns} times`);
    }
  });

  it('refuses to ship a prompt with an unknown placeholder', () => {
    expect(() => buildPersonaPrompt({ template: 'Hi {{nickname}}' }, scenario, 'L1')).toThrow(/nickname/);
  });
});
