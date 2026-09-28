/**
 * Grader calibration against the hand-labelled gold set.
 *
 *   pnpm eval               the Claude grader, 3 runs per transcript (needs ANTHROPIC_API_KEY)
 *   pnpm eval --runs 1      one run, about a third of the cost
 *   pnpm eval --baseline    an "always 2" rater, no key needed: the floor any grader must beat
 *
 * Prints a markdown table for EVALS.md and writes the raw scores to evals/results/.
 */
import Anthropic from '@anthropic-ai/sdk';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gradeTranscript } from '../src/grading/grade';
import { DIMENSIONS, type Dimension } from '../src/grading/rubric.schema';
import { getScenario, graderConfig } from '../server/src/data';
import { claudeGradeModel } from '../server/src/grader';
import { loadGold, type GoldItem } from './gold';
import { exactAgreement, quadraticKappa, stability, withinOne } from './metrics';

type Scores = Record<Dimension, number>;
interface RunResult {
  id: string;
  scores: Scores;
  modelCalls: number;
  downgraded: Dimension[];
  ms: number;
}

const args = process.argv.slice(2);
const baseline = args.includes('--baseline');
const runs = baseline ? 1 : Number(args[args.indexOf('--runs') + 1] ?? 3) || 3;
const model = process.env.GRADER_MODEL ?? 'claude-opus-5';
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

async function gradeOnce(item: GoldItem, client: Anthropic): Promise<RunResult> {
  const started = Date.now();
  const scenario = getScenario(item.scenarioId)!;
  const result = await gradeTranscript({
    turns: item.turns,
    callModel: claudeGradeModel({ client, model, effort }, scenario),
    retryCopy: graderConfig.retry,
  });
  const scores = Object.fromEntries(
    DIMENSIONS.map((dimension) => [dimension, result.grade.dimensions[dimension].score]),
  ) as Scores;
  return { id: item.id, scores, modelCalls: result.modelCalls, downgraded: result.downgraded, ms: Date.now() - started };
}

async function main() {
  const gold = loadGold();
  let allRuns: RunResult[][];

  if (baseline) {
    allRuns = [gold.map((item) => ({ id: item.id, scores: { clarity: 2, empathy: 2, ask_made: 2, boundary_held: 2 }, modelCalls: 0, downgraded: [], ms: 0 }))];
  } else {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('pnpm eval needs ANTHROPIC_API_KEY (in server/.env or the environment). Try --baseline without one.');
      process.exit(1);
    }
    const client = new Anthropic();
    allRuns = [];
    for (let run = 1; run <= runs; run += 1) {
      console.error(`run ${run}/${runs}: grading ${gold.length} transcripts with ${model} (${effort})…`);
      allRuns.push(await pool(gold, (item) => gradeOnce(item, client)));
    }
  }

  const label = baseline ? 'baseline: always 2' : `${model}, effort ${effort}, ${runs} run${runs > 1 ? 's' : ''}`;
  const lines = [
    `### ${label}`,
    '',
    `${gold.length} gold transcripts. Kappa is quadratic-weighted Cohen's kappa against the gold labels (run 1${runs > 1 ? '; the range across runs in brackets' : ''}).`,
    '',
    '| Dimension | Kappa | Exact | Within 1 |' + (runs > 1 ? ' Identical across runs | Mean SD |' : ''),
    '| --- | --- | --- | --- |' + (runs > 1 ? ' --- | --- |' : ''),
  ];
  for (const dimension of DIMENSIONS) {
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

  const out = join(dirname(fileURLToPath(import.meta.url)), 'results');
  mkdirSync(out, { recursive: true });
  const file = join(out, `${baseline ? 'baseline' : model}-${new Date().toISOString().slice(0, 10)}.json`);
  writeFileSync(file, JSON.stringify({ label, gold: gold.map((item) => ({ id: item.id, labels: item.labels })), runs: allRuns }, null, 2));
  console.log(lines.join('\n'));
  console.error(`\nraw scores: ${file}`);
}

const pct = (value: number) => `${Math.round(value * 100)}%`;
const fixed = (value: number) => (Math.abs(value) < 0.005 ? 0 : value).toFixed(2);

void main();
