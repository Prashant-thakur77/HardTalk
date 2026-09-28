import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { z } from 'zod';

import { graderConfigSchema } from '../../src/grading/prompt';
import { DIMENSIONS, rubricSchema } from '../../src/grading/rubric.schema';
import { safetyConfigSchema } from '../../src/safety/rules';
import { scenarioSchema, type Scenario } from '../../src/scenarios/schema';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '../../data');

function load(path: string): unknown {
  return YAML.parse(readFileSync(join(DATA, path), 'utf8'));
}

/** The same YAML the app bundles, validated with the same schemas. */
export const graderConfig = graderConfigSchema.parse(load('prompts/grader.yaml'));

export const safetyConfig = safetyConfigSchema.parse(load('safety.yaml'));

export const safetyClassifierConfig = z
  .strictObject({ instructions: z.string().min(1), request: z.string().includes('{{line}}') })
  .parse(load('prompts/safety-classifier.yaml'));

export const rubrics = DIMENSIONS.map((dimension) => rubricSchema.parse(load(`rubrics/${dimension}.yaml`)));

const SCENARIO_IDS = ['pr-blocking-release', 'decline-extra-project', 'mid-sprint-scope-change'];
const scenarios = new Map<string, Scenario>(
  SCENARIO_IDS.map((id) => [id, scenarioSchema.parse(load(`scenarios/${id}.yaml`))]),
);

export function getScenario(id: string): Scenario | undefined {
  return scenarios.get(id);
}
