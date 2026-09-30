import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { z } from 'zod';

import { graderConfigSchema } from '../../src/grading/prompt';
import { rubricSchema, type Rubric } from '../../src/grading/rubric.schema';
import { safetyConfigSchema } from '../../src/safety/rules';
import { scenarioSchema, type Scenario } from '../../src/scenarios/schema';
import { TRACK_IDS, trackSchema, type Track, type TrackId } from '../../src/tracks/schema';

const DATA = join(dirname(fileURLToPath(import.meta.url)), '../../data');

function load(path: string): unknown {
  return YAML.parse(readFileSync(join(DATA, path), 'utf8'));
}

/** The same YAML the app bundles, validated with the same schemas. */
export const graderConfig = graderConfigSchema.parse(load('prompts/grader.yaml'));

export const safetyConfig = safetyConfigSchema.parse(load('safety.yaml'));

export const drafterConfig = z
  .strictObject({ instructions: z.string().includes('{{practising}}'), request: z.string().includes('{{source}}') })
  .parse(load('prompts/drafter.yaml'));

export const safetyClassifierConfig = z
  .strictObject({ instructions: z.string().min(1), request: z.string().includes('{{line}}') })
  .parse(load('prompts/safety-classifier.yaml'));

const tracks = new Map<TrackId, Track>(TRACK_IDS.map((id) => [id, trackSchema.parse(load(`tracks/${id}.yaml`))]));

export function getTrack(id: TrackId): Track {
  return tracks.get(id)!;
}

/** The four rubrics a track grades on, in its display order. */
export function rubricsFor(track: Track): Rubric[] {
  return track.rubrics.map((dimension) => rubricSchema.parse(load(`rubrics/${dimension}.yaml`)));
}

const scenarios = new Map<string, Scenario>(
  readdirSync(join(DATA, 'scenarios'))
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => scenarioSchema.parse(load(`scenarios/${file}`)))
    .map((scenario) => [scenario.id, scenario]),
);

export function getScenario(id: string): Scenario | undefined {
  return scenarios.get(id);
}
