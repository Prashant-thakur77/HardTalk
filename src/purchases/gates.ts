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

/**
 * What the paywall talks about. At the session limit: the scenario the user is trying to
 * start, and how their score has moved on it. At "Create your own": their latest scenario.
 */
export function paywallContext(
  reason: PaywallReason,
  attempts: GradedAttempt[],
  titleOf: (scenarioId: string) => string,
  startingScenarioId?: string,
): PaywallContext {
  const scenarioId = startingScenarioId ?? attempts.at(-1)?.scenarioId;
  if (!scenarioId) return { reason, scenarioTitle: null, scoreLine: null };

  const tries = attempts.filter((attempt) => attempt.scenarioId === scenarioId);
  const first = tries[0];
  const latest = tries.at(-1);
  let scoreLine: string | null = null;
  if (first && latest) {
    scoreLine =
      first === latest
        ? `${total(latest.grade)} out of ${MAX_TOTAL}`
        : `${total(first.grade)} → ${total(latest.grade)} out of ${MAX_TOTAL}`;
  }
  return { reason, scenarioTitle: titleOf(scenarioId), scoreLine };
}
