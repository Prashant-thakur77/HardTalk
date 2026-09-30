/**
 * Grader calibration against the hand-labelled gold set.
 *
 *   pnpm eval               the configured grader, 3 runs per transcript (server/.env: Claude, or any
 *                           OpenAI-compatible model such as Gemini or a local Ollama model)
 *   pnpm eval --runs 1      one run, about a third of the cost
 *   pnpm eval --baseline    an "always 2" rater, no key needed: the floor any grader must beat
 *
 * Prints a markdown table for EVALS.md and writes the raw scores to evals/results/.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gradeTranscript } from '../src/grading/grade';
import { trackGradeSchema, type Dimension } from '../src/grading/rubric.schema';
import { getScenario, getTrack, graderConfig } from '../server/src/data';
import { gradeModel } from '../server/src/grader';
import type { JsonModel } from '../server/src/models';
import { modelsFromEnv } from '../server/src/providers';
import { GOLD_DIMENSIONS, loadGold, type GoldItem } from './gold';
import { exactAgreement, quadraticKappa, stability, withinOne } from './metrics';

type Scores = Record<(typeof GOLD_DIMENSIONS)[number], number>;
interface RunResult {
  id: string;
  scores: Scores;
  modelCalls: number;
  downgraded: Dimension[];
  ms: number;
}
/** A grading that failed (network, refusal, bad key). Recorded, not fatal. */
interface RunFailure {
  id: string;
  error: string;
}
type Outcome = RunResult | RunFailure;
const failed = (outcome: Outcome): outcome is RunFailure => 'error' in outcome;

const args = process.argv.slice(2);
const baseline = args.includes('--baseline');
const runs = baseline ? 1 : Number(args[args.indexOf('--runs') + 1] ?? 3) || 3;
const models = baseline ? null : modelsFromEnv();
const model = models?.graderId ?? 'baseline';
const effort = (process.env.GRADER_EFFORT ?? 'medium') as 'low' | 'medium' | 'high';
const CONCURRENCY = 4;

async function pool<T, R>(items: T[], work: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await work(items[index]!);
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return results;
}

async function gradeOnce(item: GoldItem, grader: JsonModel): Promise<Outcome> {
  try {
    return await gradeOrThrow(item, grader);
  } catch (error) {
    return { id: item.id, error: error instanceof Error ? error.message : String(error) };
  }
}

async function gradeOrThrow(item: GoldItem, grader: JsonModel): Promise<RunResult> {
  const started = Date.now();
  const scenario = getScenario(item.scenarioId)!;
  const result = await gradeTranscript({
    turns: item.turns,
    callModel: gradeModel(grader, effort, scenario),
    schema: trackGradeSchema(getTrack(scenario.track).rubrics),
    retryCopy: graderConfig.retry,
  });
  const scores = Object.fromEntries(
    GOLD_DIMENSIONS.map((dimension) => [dimension, result.grade.dimensions[dimension]!.score]),
  ) as Scores;
  return { id: item.id, scores, modelCalls: result.modelCalls, downgraded: result.downgraded, ms: Date.now() - started };
}

const RESULTS_DIR = join(dirname(fileURLToPath(import.meta.url)), 'results');
// The baseline is deterministic and committed as baseline.json. Model runs cost money, so each
// gets its own timestamped file that a later run can never overwrite (git-ignored; add with -f).
const resultsFile = join(
  RESULTS_DIR,
  baseline ? 'baseline.json' : `${model.replace(/[^a-z0-9.-]+/gi, '-')}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
);

/** Rewritten after every run of this invocation, so a paid run survives a later failure. */
function save(label: string, gold: GoldItem[], runs: Outcome[][]) {
  mkdirSync(RESULTS_DIR, { recursive: true });
  writeFileSync(
    resultsFile,
    JSON.stringify({ label, gold: gold.map((item) => ({ id: item.id, labels: item.labels })), runs }, null, 2),
  );
}

async function main() {
  const allGold = loadGold();
  let outcomes: Outcome[][];
  const label = baseline ? 'baseline: always 2' : `${models?.name}, effort ${effort}, ${runs} run${runs > 1 ? 's' : ''}`;

  if (baseline) {
    outcomes = [
      allGold.map((item) => ({
        id: item.id,
        scores: { clarity: 2, empathy: 2, ask_made: 2, boundary_held: 2 },
        modelCalls: 0,
        downgraded: [],
        ms: 0,
      })),
    ];
  } else {
    if (!models) {
      console.error('pnpm eval needs a grader in server/.env: ANTHROPIC_API_KEY, or MODEL_BASE_URL and GRADER_MODEL. Try --baseline without one.');
      process.exit(1);
    }
    const grader = models.grader;
    outcomes = [];
    for (let run = 1; run <= runs; run += 1) {
      console.error(`run ${run}/${runs}: grading ${allGold.length} transcripts with ${models.name} (${effort})…`);
      const results = await pool(allGold, (item) => gradeOnce(item, grader));
      results.filter(failed).forEach((failure) => console.error(`  ${failure.id} failed: ${failure.error}`));
      outcomes.push(results);
      save(label, allGold, outcomes);
    }
  }

  // Score only transcripts that graded successfully in every run, and say how many were dropped.
  const okIds = new Set(
    allGold.map((item) => item.id).filter((id) => outcomes.every((run) => run.some((o) => o.id === id && !failed(o)))),
  );
  const gold = allGold.filter((item) => okIds.has(item.id));
  const allRuns = outcomes.map((run) => run.filter((o): o is RunResult => !failed(o) && okIds.has(o.id)));
  if (gold.length === 0) {
    console.error(`Every grading failed; nothing to score. Raw results: ${resultsFile}`);
    process.exit(1);
  }

  const lines = [
    `### ${label}`,
    '',
    `${gold.length} gold transcripts${gold.length < allGold.length ? ` (${allGold.length - gold.length} excluded after a failed grading)` : ''}. Kappa is quadratic-weighted Cohen's kappa against the gold labels (run 1${runs > 1 ? '; the range across runs in brackets' : ''}).`,
    '',
    '| Dimension | Kappa | Exact | Within 1 |' + (runs > 1 ? ' Identical across runs | Mean SD |' : ''),
    '| --- | --- | --- | --- |' + (runs > 1 ? ' --- | --- |' : ''),
  ];
  for (const dimension of GOLD_DIMENSIONS) {
    const truth = gold.map((item) => item.labels[dimension]);
    const perRun = allRuns.map((run) => run.map((result) => result.scores[dimension]));
    const kappas = perRun.map((scores) => quadraticKappa(truth, scores));
    const kappa = fixed(kappas[0]!) + (runs > 1 ? ` (${fixed(Math.min(...kappas))}–${fixed(Math.max(...kappas))})` : '');
    const row = `| ${dimension} | ${kappa} | ${pct(exactAgreement(truth, perRun[0]!))} | ${pct(withinOne(truth, perRun[0]!))} |`;
    if (runs > 1) {
      const { identical, meanStdDev } = stability(perRun);
      lines.push(`${row} ${pct(identical)} | ${meanStdDev.toFixed(2)} |`);
    } else {
      lines.push(row);
    }
  }
  if (!baseline) {
    const flat = allRuns.flat();
    const retried = flat.filter((result) => result.modelCalls > 1).length;
    const downgrades = flat.reduce((sum, result) => sum + result.downgraded.length, 0);
    const medianMs = flat.map((result) => result.ms).sort((x, y) => x - y)[Math.floor(flat.length / 2)]!;
    lines.push(
      '',
      `Evidence gate: ${retried} of ${flat.length} gradings needed the one retry; ${downgrades} dimension scores were lowered to 1 for ungrounded quotes. Median time per grading ${(medianMs / 1000).toFixed(1)} s.`,
    );
  }

  save(label, allGold, outcomes);
  console.log(lines.join('\n'));
  console.error(`\nraw scores: ${resultsFile}`);
}

const pct = (value: number) => `${Math.round(value * 100)}%`;
const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);

void main();
