import { DIMENSIONS, type Grade } from '../grading/rubric.schema';
import type { PaywallContext, PaywallReason } from './types';

/** Free tier: three graded sessions. The paywall opens on the attempt to start the fourth. */
export const FREE_GRADED_SESSIONS = 3;

const MAX_TOTAL = DIMENSIONS.length * 4;

export function shouldGateNewSession(gradedSessions: number, pro: boolean): boolean {
  return !pro && gradedSessions >= FREE_GRADED_SESSIONS;
}

function total(grade: Grade): number {
  return DIMENSIONS.reduce((sum, dimension) => sum + grade.dimensions[dimension].score, 0);
}

interface GradedAttempt {
  scenarioId: string;
  number: number;
  grade: Grade;
}

/** Paywall copy is about the conversation the user just practised, not a generic upsell. */
export function paywallContext(
  reason: PaywallReason,
  attempts: GradedAttempt[],
  titleOf: (scenarioId: string) => string,
): PaywallContext {
  const latest = attempts.at(-1);
  if (!latest) return { reason, scenarioTitle: 'your next conversation', scoreLine: null };

  const sameScenario = attempts.filter((attempt) => attempt.scenarioId === latest.scenarioId);
  const first = sameScenario[0]!;
  const scoreLine =
    first === latest
      ? `${total(latest.grade)} out of ${MAX_TOTAL}`
      : `${total(first.grade)} → ${total(latest.grade)} out of ${MAX_TOTAL}`;
  return { reason, scenarioTitle: titleOf(latest.scenarioId), scoreLine };
}
