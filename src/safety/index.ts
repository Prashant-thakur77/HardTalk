import safetyData from '@data/safety.yaml';

import { detectDistress, isStopRequest, safetyConfigSchema } from './rules';

export { checkDistressRemotely } from './remote';

export const safety = safetyConfigSchema.parse(safetyData);

/** `personaNames` lets "Sam, stop." count as a stop in Sam's scenario. */
export const isStopLine = (text: string, personaNames: string[] = []) => isStopRequest(text, safety, personaNames);
export const isDistressLine = (text: string) => detectDistress(text, safety);

/** Thrown instead of returning a grade when a conversation must not be scored. */
export class NotScoredForSafety extends Error {
  name = 'NotScoredForSafety';
}
