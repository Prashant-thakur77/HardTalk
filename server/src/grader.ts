import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { GradingError, type GradeModel } from '../../src/grading/grade';
import { buildSystemPrompt, formatTranscript } from '../../src/grading/prompt';
import { gradeSchema } from '../../src/grading/rubric.schema';
import type { Scenario } from '../../src/scenarios/schema';
import { graderConfig, rubrics } from './data';

export interface ClaudeGraderOptions {
  client: Anthropic;
  model: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Claude grades; the persona runs on a different model family inside ElevenLabs, so the
 * grader never marks its own roleplay. Output is constrained to the grade schema, and the
 * system prompt (instructions, rubrics, calibration examples) is cached per scenario.
 */
export function claudeGradeModel(options: ClaudeGraderOptions, scenario: Scenario): GradeModel {
  const system = buildSystemPrompt(graderConfig, scenario, rubrics);

  return async ({ turns, feedback }) => {
    const transcript = formatTranscript(turns, scenario.persona.name);
    const request = [`Grade this conversation.\n\n<transcript>\n${transcript}\n</transcript>`, feedback]
      .filter(Boolean)
      .join('\n\n');

    const response = await options.client.beta.messages.parse({
      model: options.model,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: request }],
      output_config: { effort: options.effort, format: betaZodOutputFormat(gradeSchema) },
    });

    if (response.stop_reason === 'refusal') {
      throw new GradingError('The grader declined to grade this conversation.');
    }
    return response.parsed_output;
  };
}
