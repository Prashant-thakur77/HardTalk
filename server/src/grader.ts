import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { GradingError, type GradeModel } from '../../src/grading/grade';
import { buildRequest, buildSystemPrompt, formatTranscript } from '../../src/grading/prompt';
import { gradeSchema } from '../../src/grading/rubric.schema';
import type { Scenario } from '../../src/scenarios/schema';
import { graderConfig, rubrics } from './data';

export interface ClaudeGraderOptions {
  client: Pick<Anthropic, 'beta'>;
  model: string;
  effort: 'low' | 'medium' | 'high';
}

// The JSON schema the API constrains output to. Validation happens in gradeTranscript, not in
// the SDK, so a malformed answer reaches the one retry instead of throwing here.
const { type, schema } = betaZodOutputFormat(gradeSchema);
const OUTPUT_FORMAT = { type, schema };

/**
 * Claude grades; the persona runs on a different model family inside ElevenLabs, so the
 * grader never marks its own roleplay. The system prompt (instructions, rubrics, calibration
 * examples) is identical for every attempt at a scenario and is cached.
 */
export function claudeGradeModel(options: ClaudeGraderOptions, scenario: Scenario): GradeModel {
  const system = buildSystemPrompt(graderConfig, scenario, rubrics);

  return async ({ turns, feedback }) => {
    const transcript = formatTranscript(turns, scenario.persona.name);
    const response = await options.client.beta.messages.create({
      model: options.model,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildRequest(graderConfig, transcript, feedback) }],
      output_config: { effort: options.effort, format: OUTPUT_FORMAT },
    });

    if (response.stop_reason === 'refusal') {
      throw new GradingError('The grader declined to grade this conversation.');
    }
    const text = response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
    try {
      return JSON.parse(text) as unknown;
    } catch {
      return text;
    }
  };
}
