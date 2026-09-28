import prBlockingRelease from '@data/scenarios/pr-blocking-release.yaml';
import declineExtraProject from '@data/scenarios/decline-extra-project.yaml';
import midSprintScopeChange from '@data/scenarios/mid-sprint-scope-change.yaml';

import { scenarioSchema, type Scenario } from './schema';

export const scenarios: Scenario[] = [prBlockingRelease, declineExtraProject, midSprintScopeChange].map(
  (raw) => scenarioSchema.parse(raw),
);

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id);
}
