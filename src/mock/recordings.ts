import prBlockingRelease from '@data/mock/pr-blocking-release.yaml';
import declineExtraProject from '@data/mock/decline-extra-project.yaml';
import midSprintScopeChange from '@data/mock/mid-sprint-scope-change.yaml';
import { z } from 'zod';

import { gradeSchema } from '@/grading/rubric.schema';

const turnSchema = z.object({
  speaker: z.enum(['user', 'persona']),
  text: z.string().min(1),
});

const recordingSchema = z.object({
  end_reason: z.enum(['stop_condition', 'turn_limit']),
  turns: z.array(turnSchema).min(2),
  grade: gradeSchema,
});
export type Recording = z.infer<typeof recordingSchema>;

const recordingFileSchema = z.object({
  scenario_id: z.string(),
  attempts: z.array(recordingSchema).min(2),
});

const files = [prBlockingRelease, declineExtraProject, midSprintScopeChange].map((raw) =>
  recordingFileSchema.parse(raw),
);

/**
 * Mock mode replays a typical first try on attempt 1 and the improved retry on every
 * attempt after, so the retry delta is visible without a microphone.
 */
export function getRecording(scenarioId: string, attempt: number): Recording {
  const file = files.find((candidate) => candidate.scenario_id === scenarioId);
  if (!file) throw new Error(`No mock recording for scenario "${scenarioId}"`);
  const index = Math.min(attempt, file.attempts.length) - 1;
  return file.attempts[Math.max(index, 0)]!;
}
