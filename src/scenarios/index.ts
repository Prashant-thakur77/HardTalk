import debateAiInExams from '@data/scenarios/debate-ai-in-exams.yaml';
import declineExtraProject from '@data/scenarios/decline-extra-project.yaml';
import interviewFirstRole from '@data/scenarios/interview-first-role.yaml';
import interviewInternship from '@data/scenarios/interview-internship.yaml';
import midSprintScopeChange from '@data/scenarios/mid-sprint-scope-change.yaml';
import pitchSeedRound from '@data/scenarios/pitch-seed-round.yaml';
import prBlockingRelease from '@data/scenarios/pr-blocking-release.yaml';
import { useSyncExternalStore } from 'react';

import { getCustomScenarios, isCustomScenario, subscribeCustomScenarios } from './custom';
import { scenarioSchema, type Scenario } from './schema';

/** The built-in conversations, grouped by track. Custom scenarios (Pro) are stored on the device. */
export const scenarios: Scenario[] = [
  prBlockingRelease,
  declineExtraProject,
  midSprintScopeChange,
  pitchSeedRound,
  interviewFirstRole,
  interviewInternship,
  debateAiInExams,
].map((raw) => scenarioSchema.parse(raw));

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((scenario) => scenario.id === id) ?? getCustomScenarios().find((s) => s.id === id);
}

export function useCustomScenarios(): Scenario[] {
  return useSyncExternalStore(subscribeCustomScenarios, getCustomScenarios, getCustomScenarios);
}

/** How the server is told which scenario: built-ins by id, custom scenarios in full. */
export function scenarioRef(id: string): { scenarioId: string } | { scenario: Scenario } {
  const scenario = getScenario(id);
  return scenario && isCustomScenario(id) ? { scenario } : { scenarioId: id };
}
