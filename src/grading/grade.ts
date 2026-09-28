import { prettifyError } from 'zod';

import { downgradeUngrounded, findUngrounded, type Ungrounded } from './evidence';
import { DIMENSIONS, gradeSchema, type Dimension, type Grade } from './rubric.schema';
import type { Turn } from './transcript';

export interface GradeModelRequest {
  turns: Turn[];
  /** Set on the single retry: what was wrong with the previous answer. */
  feedback?: string;
}

/** One call to the grader model. Returns its raw JSON; validation happens here, not there. */
export type GradeModel = (request: GradeModelRequest) => Promise<unknown>;

export interface GradeResult {
  grade: Grade;
  modelCalls: 1 | 2;
  /** Dimensions lowered to 1 because their evidence was not in the transcript. */
  downgraded: Dimension[];
}

export class GradingError extends Error {
  name = 'GradingError';
}

type Attempt = { grade: Grade; problem?: never } | { grade?: never; problem: string };

async function attempt(callModel: GradeModel, turns: Turn[], feedback?: string): Promise<Attempt> {
  const parsed = gradeSchema.safeParse(await callModel({ turns, feedback }));
  if (parsed.success) return { grade: parsed.data };
  return { problem: `Your previous answer did not match the required schema:\n${prettifyError(parsed.error)}` };
}

function evidenceFeedback(ungrounded: Ungrounded[]): string {
  const lines = ungrounded.map(({ dimension, quotes }) =>
    quotes.length === 0
      ? `- ${dimension}: scored above 1 with no evidence quote.`
      : `- ${dimension}: ${quotes.map((quote) => JSON.stringify(quote)).join(', ')} is not in any USER turn.`,
  );
  return [
    'Some evidence quotes are not verbatim user speech:',
    ...lines,
    'Copy each quote character for character from a single USER turn. If there is no real evidence for a score above 1, score that dimension 1.',
  ].join('\n');
}

/**
 * Grades a transcript and guarantees every score above 1 is grounded in the user's words:
 * one re-request with specific feedback, then anything still ungrounded is downgraded to 1.
 */
export async function gradeTranscript({
  turns,
  callModel,
}: {
  turns: Turn[];
  callModel: GradeModel;
}): Promise<GradeResult> {
  if (!turns.some((turn) => turn.speaker === 'user' && turn.text.trim())) {
    throw new GradingError('There is nothing to grade: the user did not speak.');
  }

  const first = await attempt(callModel, turns);
  let feedback: string;
  if (first.grade) {
    const ungrounded = findUngrounded(first.grade, turns);
    if (ungrounded.length === 0) return { grade: first.grade, modelCalls: 1, downgraded: [] };
    feedback = evidenceFeedback(ungrounded);
  } else {
    feedback = first.problem;
  }

  const retry = await attempt(callModel, turns, feedback);
  const candidate = retry.grade ?? first.grade;
  if (!candidate) throw new GradingError('The grader returned output that did not match the schema twice.');

  const grade = downgradeUngrounded(candidate, turns);
  const downgraded = DIMENSIONS.filter(
    (dimension) => grade.dimensions[dimension].score < candidate.dimensions[dimension].score,
  );
  return { grade, modelCalls: 2, downgraded };
}
