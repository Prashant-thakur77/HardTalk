import safetyData from '@data/safety.yaml';

import { detectDistress, isStopRequest, safetyConfigSchema } from './rules';

export const safety = safetyConfigSchema.parse(safetyData);

export const isStopLine = (text: string) => isStopRequest(text, safety);
export const isDistressLine = (text: string) => detectDistress(text, safety);

/** Thrown instead of returning a grade when a conversation must not be scored. */
export class NotScoredForSafety extends Error {
  name = 'NotScoredForSafety';
}
