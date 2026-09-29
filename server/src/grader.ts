import type Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';

import { GradingError, type GradeModel } from '../../src/grading/grade';
import { buildRequest, buildSystemPrompt, formatTranscript } from '../../src/grading/prompt';
import { trackGradeSchema } from '../../src/grading/rubric.schema';
import type { Scenario } from '../../src/scenarios/schema';
import { getTrack, graderConfig, rubricsFor } from './data';

export interface ClaudeGraderOptions {
  client: Pick<Anthropic, 'beta'>;
  model: string;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Claude grades; the persona runs on a different model family inside ElevenLabs, so the
 * grader never marks its own roleplay. The system prompt (instructions, rubrics, calibration
 * examples) is identical for every attempt at a scenario and is cached.
 */
export function claudeGradeModel(options: ClaudeGraderOptions, scenario: Scenario): GradeModel {
  const track = getTrack(scenario.track);
  const system = buildSystemPrompt(graderConfig, track, scenario, rubricsFor(track));
  // The JSON schema the API constrains output to: this track's four dimensions. Validation
  // happens in gradeTranscript, not in the SDK, so a malformed answer reaches the one retry.
  const { type, schema } = betaZodOutputFormat(trackGradeSchema(track.rubrics));

  return async ({ turns, feedback }) => {
    const transcript = formatTranscript(turns, scenario.persona.name);
    const response = await options.client.beta.messages.create({
      model: options.model,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: buildRequest(graderConfig, transcript, feedback) }],
      output_config: { effort: options.effort, format: { type, schema } },
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
