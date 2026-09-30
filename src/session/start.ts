import { router } from 'expo-router';

import { getAttempts, getGradedSessionsUsed, type SessionMode } from '@/attempts/store';
import { presentPaywall } from '@/purchases';
import { isPro } from '@/purchases/entitlement';
import { paywallContext, shouldGateNewSession } from '@/purchases/gates';
import { getScenario } from '@/scenarios';
import type { Difficulty } from '@/scenarios/schema';
import type { TrackId } from '@/tracks/schema';

const titleOf = (id: string) => getScenario(id)?.title ?? 'this conversation';

/**
 * Every new session starts here, from "Start conversation" and from "Retry". Free users get
 * three graded sessions; the fourth start opens the paywall about the scenario being started.
 */
export async function startSession(
  scenarioId: string,
  difficulty: Difficulty,
  mode: SessionMode,
  navigation: 'push' | 'replace',
): Promise<void> {
  if (shouldGateNewSession(getGradedSessionsUsed(), isPro())) {
    await presentPaywall(paywallContext('session_limit', getAttempts(), titleOf, scenarioId));
    if (!isPro()) return;
  }
  router[navigation]({ pathname: '/session/[id]', params: { id: scenarioId, difficulty, mode } });
}

/** "Create your own scenario" is Pro. Free users see the paywall first; nothing else opens it. */
/** Opens the custom scenario form on the track the user was browsing, after the paywall if needed. */
export async function openCustomScenario(track: TrackId): Promise<void> {
  if (!isPro()) {
    await presentPaywall(paywallContext('custom_scenario', getAttempts(), titleOf));
    if (!isPro()) return;
  }
  router.push({ pathname: '/custom/new', params: { track } });
}
