import { config } from '@/config';
import { getRecording } from '@/mock/recordings';
import { NotScoredForSafety, isDistressLine } from '@/safety';
import { scenarioRef } from '@/scenarios';

import { downgradeUngrounded } from './evidence';
import { gradeSchema, type Grade } from './rubric.schema';
import type { Turn } from './transcript';

export interface GradeRequest {
  scenarioId: string;
  attempt: number;
  turns: Turn[];
  /**
   * On a practice built as a topic, the user answered "It's the topic" for every line the
   * distress rules flagged, so the rules alone do not stop it being scored.
   */
  topicConfirmed?: boolean;
}

/**
 * Live: the server grades with Claude and enforces evidence. Mock: the recorded grade for
 * this attempt, held to the same evidence rule against the transcript actually shown.
 */
export async function gradeConversation(request: GradeRequest): Promise<Grade> {
  if (config.mock) {
    if (!request.topicConfirmed && request.turns.some((turn) => turn.speaker === 'user' && isDistressLine(turn.text))) {
      throw new NotScoredForSafety();
    }
    return downgradeUngrounded(getRecording(request.scenarioId, request.attempt).grade, request.turns);
  }

  const response = await fetch(`${config.serverUrl}/grade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      ...scenarioRef(request.scenarioId),
      turns: request.turns,
      ...(request.topicConfirmed ? { topicConfirmed: true } : {}),
    }),
  });
  const body = (await response.json()) as { grade?: unknown; error?: string; safety?: boolean };
  if (body.safety) throw new NotScoredForSafety();
  if (!response.ok) throw new Error(body.error ?? `Grading failed (${response.status}).`);
  return gradeSchema.parse(body.grade);
}
