import { GradingError, type GradeModel } from '../../src/grading/grade';
import { buildRequest, buildSystemPrompt, formatTranscript } from '../../src/grading/prompt';
import { trackGradeSchema } from '../../src/grading/rubric.schema';
import type { Scenario } from '../../src/scenarios/schema';
import { getTrack, graderConfig, rubricsFor } from './data';
import { claudeJsonModel, type ClaudeModelOptions, type JsonModel, type JsonRequest } from './models';

export interface ClaudeGraderOptions extends ClaudeModelOptions {
  effort: JsonRequest['effort'];
}

/**
 * Grades one scenario's transcripts. The persona runs on a different model family inside
 * ElevenLabs, so the grader never marks its own roleplay. The system prompt (instructions,
 * rubrics, calibration examples) is identical for every attempt at a scenario.
 */
export function gradeModel(model: JsonModel, effort: JsonRequest['effort'], scenario: Scenario): GradeModel {
  const track = getTrack(scenario.track);
  const system = buildSystemPrompt(graderConfig, track, scenario, rubricsFor(track));
  // The shape the output is constrained to: this track's four dimensions. Validation happens
  // in gradeTranscript, so a malformed answer reaches the one retry.
  const schema = trackGradeSchema(track.rubrics);

  return async ({ turns, feedback }) => {
    const transcript = formatTranscript(turns, scenario.persona.name);
    const reply = await model({
      system,
      user: buildRequest(graderConfig, transcript, feedback),
      schema,
      maxTokens: 8000,
      effort,
    });
    if (reply.refused) throw new GradingError('The grader declined to grade this conversation.');
    try {
      return JSON.parse(reply.text) as unknown;
    } catch {
      return reply.text;
    }
  };
}

export const claudeGradeModel = (options: ClaudeGraderOptions, scenario: Scenario) =>
  gradeModel(claudeJsonModel(options), options.effort, scenario);
