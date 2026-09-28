import { z } from 'zod';

import type { Scenario } from '../scenarios/schema';
import { gradeSchema, type Rubric } from './rubric.schema';
import { formatTranscript, turnSchema } from './transcript';

export { formatTranscript };

/** Shape of data/prompts/grader.yaml. */
export const retryCopySchema = z.strictObject({
  schema: z.string().includes('{{problem}}'),
  evidence: z.string().includes('{{problems}}'),
  missing_quote: z.string().includes('{{dimension}}'),
  bad_quote: z.string().includes('{{quotes}}'),
});
export type RetryCopy = z.infer<typeof retryCopySchema>;

export const graderConfigSchema = z.strictObject({
  instructions: z.string().min(1),
  request: z.string().includes('{{transcript}}'),
  calibration_header: z.string().min(1),
  retry: retryCopySchema,
  examples: z
    .array(
      z.strictObject({
        label: z.enum(['weak', 'medium', 'strong']),
        scenario: z.string().min(1),
        transcript: z.array(turnSchema).min(2),
        grade: gradeSchema,
      }),
    )
    .min(3),
});
export type GraderConfig = z.infer<typeof graderConfigSchema>;

function describeScenario(scenario: Scenario): string {
  const { persona } = scenario;
  return [
    `Title: ${scenario.title}`,
    `What the user is trying to do: ${scenario.user_goal}`,
    `The persona: ${persona.name}, ${persona.role}. Their goal: ${persona.goal}`,
    `The persona's hidden objection: ${persona.hidden_objection}`,
    'Facts both sides know:',
    ...persona.context.map((fact) => `- ${fact}`),
  ].join('\n');
}

function describeRubric(rubric: Rubric): string {
  return [
    `### ${rubric.id} (${rubric.name})`,
    `Question: ${rubric.question}`,
    `Framework: ${rubric.framework.name}. ${rubric.framework.applies.trim()}`,
    ...([1, 2, 3, 4] as const).map((level) => `${level}: ${rubric.anchors[level].trim()}`),
    `Evidence to quote: ${rubric.evidence}`,
  ].join('\n');
}

function describeExamples(config: GraderConfig): string {
  return config.examples
    .map((example) =>
      [
        `### Example (${example.label})`,
        `Scenario: ${example.scenario}`,
        'Transcript:',
        formatTranscript(example.transcript, 'Colleague'),
        'Grade:',
        JSON.stringify(example.grade, null, 2),
      ].join('\n'),
    )
    .join('\n\n');
}

/**
 * The grader's system prompt, assembled entirely from data/: instructions and calibration
 * examples from prompts/grader.yaml, the scenario, and the four rubrics. It is identical for
 * every attempt at a scenario, so it caches well.
 */
export function buildSystemPrompt(config: GraderConfig, scenario: Scenario, rubrics: Rubric[]): string {
  const instructions = config.instructions
    .replace('{{scenario}}', describeScenario(scenario))
    .replace('{{rubrics}}', rubrics.map(describeRubric).join('\n\n'));
  return [instructions.trim(), config.calibration_header, describeExamples(config)].join('\n\n');
}

/** The user message for one grading call: the transcript, plus retry feedback if any. */
export function buildRequest(config: GraderConfig, transcript: string, feedback?: string): string {
  const request = config.request.replace('{{transcript}}', transcript).trim();
  return feedback ? `${request}\n\n${feedback.trim()}` : request;
}
