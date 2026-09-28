import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { DIMENSIONS, rubricSchema } from '@/grading/rubric.schema';
import { rubrics } from '@/grading/rubrics';
import { scenarios } from '@/scenarios';
import { scenarioSchema } from '@/scenarios/schema';

const DATA = join(__dirname, '../../../data');

function yamlFiles(dir: string) {
  return readdirSync(join(DATA, dir))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => ({
      id: basename(file, '.yaml'),
      data: YAML.parse(readFileSync(join(DATA, dir, file), 'utf8')) as unknown,
    }));
}

describe('data/scenarios', () => {
  const files = yamlFiles('scenarios');

  it('ships exactly the three frozen scenarios', () => {
    expect(files.map((file) => file.id).sort()).toEqual([
      'decline-extra-project',
      'mid-sprint-scope-change',
      'pr-blocking-release',
    ]);
  });

  for (const file of files) {
    it(`${file.id}.yaml matches the scenario schema and its filename`, () => {
      const scenario = scenarioSchema.parse(file.data);
      expect(scenario.id).toBe(file.id);
    });
  }

  it('level summaries shown to the user never give away the hidden objection', () => {
    const pairs = (text: string) => {
      const words = text.toLowerCase().match(/[a-z']+/g) ?? [];
      return new Set(words.slice(1).map((word, i) => `${words[i]} ${word}`));
    };
    for (const file of files) {
      const scenario = scenarioSchema.parse(file.data);
      const secret = pairs(scenario.persona.hidden_objection);
      for (const level of Object.values(scenario.difficulty_levels)) {
        const shared = [...pairs(level.summary)].filter((pair) => secret.has(pair));
        expect(shared, `${file.id}: ${level.summary}`).toEqual([]);
      }
    }
  });

  it('every file on disk is registered with the app loader', () => {
    expect(scenarios.map((scenario) => scenario.id).sort()).toEqual(files.map((file) => file.id).sort());
  });
});

describe('data/rubrics', () => {
  const files = yamlFiles('rubrics');

  it('has one rubric per scored dimension', () => {
    expect(files.map((file) => file.id).sort()).toEqual([...DIMENSIONS].sort());
  });

  for (const file of files) {
    it(`${file.id}.yaml matches the rubric schema and its filename`, () => {
      const rubric = rubricSchema.parse(file.data);
      expect(rubric.id).toBe(file.id);
    });

    it(`${file.id}.yaml cites a named framework with a source`, () => {
      const rubric = rubricSchema.parse(file.data);
      expect(rubric.framework.name).toMatch(/SBI|Nonviolent Communication|NVC|Crucial Conversations/);
      expect(rubric.framework.source.length).toBeGreaterThan(20);
    });
  }

  it('every rubric is registered with the app loader', () => {
    expect(Object.keys(rubrics).sort()).toEqual([...DIMENSIONS].sort());
  });
});

describe('schemas reject malformed data', () => {
  it('rejects a scenario missing a difficulty level', () => {
    const [first] = yamlFiles('scenarios');
    const broken = structuredClone(first!.data) as { difficulty_levels: Record<string, unknown> };
    delete broken.difficulty_levels.L3;
    expect(scenarioSchema.safeParse(broken).success).toBe(false);
  });

  it('rejects a rubric with an unknown field (typos do not pass silently)', () => {
    const [first] = yamlFiles('rubrics');
    const broken = { ...(first!.data as object), anchor: 'typo' };
    expect(rubricSchema.safeParse(broken).success).toBe(false);
  });
});
