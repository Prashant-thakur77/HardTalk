import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { buildSystemPrompt, formatTranscript, graderConfigSchema } from '../prompt';
import { DIMENSIONS, rubricSchema } from '../rubric.schema';
import { isGrounded } from '../evidence';
import { scenarioSchema } from '../../scenarios/schema';

const DATA = join(__dirname, '../../../data');
const load = (path: string) => YAML.parse(readFileSync(join(DATA, path), 'utf8')) as unknown;

const config = graderConfigSchema.parse(load('prompts/grader.yaml'));
const scenario = scenarioSchema.parse(load('scenarios/pr-blocking-release.yaml'));
const rubrics = DIMENSIONS.map((dimension) => rubricSchema.parse(load(`rubrics/${dimension}.yaml`)));

describe('grader prompt', () => {
  const prompt = buildSystemPrompt(config, scenario, rubrics);

  it('includes every rubric anchor and its framework, read from data', () => {
    for (const rubric of rubrics) {
      expect(prompt).toContain(rubric.framework.name);
      for (const anchor of Object.values(rubric.anchors)) expect(prompt).toContain(anchor.trim());
    }
  });

  it('tells the grader who the persona is and what the user was trying to do', () => {
    expect(prompt).toContain(scenario.user_goal);
    expect(prompt).toContain(scenario.persona.name);
    expect(prompt).not.toContain('{{');
  });

  it('includes weak, medium and strong calibration examples', () => {
    expect(config.examples.map((example) => example.label)).toEqual(['weak', 'medium', 'strong']);
    expect(prompt).toContain('Example (weak)');
    expect(prompt).toContain('Example (strong)');
  });

  it('holds its own few-shot examples to the evidence rule', () => {
    for (const example of config.examples) {
      for (const dimension of DIMENSIONS) {
        for (const quote of example.grade.dimensions[dimension].evidence_quotes) {
          expect(isGrounded(quote, example.transcript)).toBe(true);
        }
      }
    }
  });

  it('formats the transcript with speaker labels the grader can tell apart', () => {
    const text = formatTranscript(
      [
        { speaker: 'persona', text: 'Hi.' },
        { speaker: 'user', text: 'Hello.' },
      ],
      'Sam',
    );
    expect(text).toBe('SAM (persona): Hi.\nUSER: Hello.');
  });
});
