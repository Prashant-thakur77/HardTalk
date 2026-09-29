import { MAX_TOTAL, totalScore, type Grade } from '../grading/rubric.schema';
import type { PaywallContext, PaywallReason } from './types';

/** Free tier: three graded sessions. The paywall opens on the attempt to start the fourth. */
export const FREE_GRADED_SESSIONS = 3;

export function shouldGateNewSession(gradedSessions: number, pro: boolean): boolean {
  return !pro && gradedSessions >= FREE_GRADED_SESSIONS;
}

interface GradedAttempt {
  scenarioId: string;
  difficulty: string;
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

  // Like the scorecard, only compare attempts made at the same difficulty.
  const latest = attempts.filter((attempt) => attempt.scenarioId === scenarioId).at(-1);
  const first = attempts.find(
    (attempt) => attempt.scenarioId === scenarioId && attempt.difficulty === latest?.difficulty,
  );
  let scoreLine: string | null = null;
  if (first && latest) {
    scoreLine =
      first === latest
        ? `${totalScore(latest.grade)} out of ${MAX_TOTAL}`
        : `${totalScore(first.grade)} → ${totalScore(latest.grade)} out of ${MAX_TOTAL}`;
  }
  return { reason, scenarioTitle: titleOf(scenarioId), scoreLine };
}
