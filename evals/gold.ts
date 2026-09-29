import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { z } from 'zod';

import { turnSchema } from '../src/grading/transcript';
import { difficultySchema } from '../src/scenarios/schema';

const score = z.number().int().min(1).max(4);

/** The gold set is workplace conversations, labelled on the workplace track's rubrics. */
export const GOLD_DIMENSIONS = ['clarity', 'empathy', 'ask_made', 'boundary_held'] as const;

const goldFileSchema = z.strictObject({
  scenario_id: z.string(),
  transcripts: z.array(
    z.strictObject({
      id: z.string().regex(/^[a-z0-9-]+$/),
      difficulty: difficultySchema,
      labels: z.strictObject({ clarity: score, empathy: score, ask_made: score, boundary_held: score }),
      turns: z.array(turnSchema).min(2),
    }),
  ),
});

export type GoldItem = z.infer<typeof goldFileSchema>['transcripts'][number] & { scenarioId: string };

const GOLD_DIR = join(dirname(fileURLToPath(import.meta.url)), 'gold');

/** Every hand-labelled transcript in evals/gold/*.yaml. */
export function loadGold(): GoldItem[] {
  return readdirSync(GOLD_DIR)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .flatMap((file) => {
      const parsed = goldFileSchema.parse(YAML.parse(readFileSync(join(GOLD_DIR, file), 'utf8')));
      return parsed.transcripts.map((item) => ({ ...item, scenarioId: parsed.scenario_id }));
    });
}
