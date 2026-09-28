import { config } from '@/config';
import { getRecording } from '@/mock/recordings';

import { downgradeUngrounded } from './evidence';
import { gradeSchema, type Grade } from './rubric.schema';
import type { Turn } from './transcript';

export interface GradeRequest {
  scenarioId: string;
  attempt: number;
  turns: Turn[];
}

/**
 * Live: the server grades with Claude and enforces evidence. Mock: the recorded grade for
 * this attempt, held to the same evidence rule against the transcript actually shown.
 */
export async function gradeConversation(request: GradeRequest): Promise<Grade> {
  if (config.mock) return downgradeUngrounded(getRecording(request.scenarioId, request.attempt).grade, request.turns);

  const response = await fetch(`${config.serverUrl}/grade`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ scenarioId: request.scenarioId, turns: request.turns }),
  });
  const body = (await response.json()) as { grade?: unknown; error?: string };
  if (!response.ok) throw new Error(body.error ?? `Grading failed (${response.status}).`);
  return gradeSchema.parse(body.grade);
}
