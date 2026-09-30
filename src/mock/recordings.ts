import debateAiInExams from '@data/mock/debate-ai-in-exams.yaml';
import declineExtraProject from '@data/mock/decline-extra-project.yaml';
import interviewFirstRole from '@data/mock/interview-first-role.yaml';
import interviewInternship from '@data/mock/interview-internship.yaml';
import midSprintScopeChange from '@data/mock/mid-sprint-scope-change.yaml';
import pitchSeedRound from '@data/mock/pitch-seed-round.yaml';
import prBlockingRelease from '@data/mock/pr-blocking-release.yaml';
import sampleDebate from '@data/mock/sample-debate.yaml';
import sampleInterview from '@data/mock/sample-interview.yaml';
import samplePitch from '@data/mock/sample-pitch.yaml';
import sampleWorkplace from '@data/mock/sample-workplace.yaml';
import { z } from 'zod';

import { gradeSchema } from '@/grading/rubric.schema';
import { turnSchema } from '@/grading/transcript';

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

const files = [
  prBlockingRelease,
  declineExtraProject,
  midSprintScopeChange,
  pitchSeedRound,
  interviewFirstRole,
  interviewInternship,
  debateAiInExams,
  sampleWorkplace,
  samplePitch,
  sampleInterview,
  sampleDebate,
].map((raw) => recordingFileSchema.parse(raw));

/** A typed line as the recording compares it: inner runs of spaces count as one. */
export const plainLine = (text: string) => text.trim().replace(/\s+/g, ' ');

/**
 * Mock mode's grade was recorded for the recorded user lines. If a typed conversation says
 * anything else, that grade says nothing about it, so it is not shown or counted.
 */
export function matchesRecording(scenarioId: string, attempt: number, turns: { speaker: string; text: string }[]): boolean {
  const recorded = getRecording(scenarioId, attempt).turns.filter((turn) => turn.speaker === 'user');
  const said = turns.filter((turn) => turn.speaker === 'user');
  return said.length === recorded.length && said.every((turn, index) => plainLine(turn.text) === plainLine(recorded[index]!.text));
}

/** Whether mock mode can replay this scenario: every built-in, and the drafted samples. */
export const hasRecording = (scenarioId: string) => files.some((file) => file.scenario_id === scenarioId);

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
