import customDefaults from '@data/custom-scenario.yaml';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { z } from 'zod';

import { getTrack } from '../tracks';
import { trackIdSchema } from '../tracks/schema';
import { customScenarioId, isCustomScenario } from './ids';
import { scenarioFieldsSchema, scenarioSchema, type Scenario } from './schema';

const defaultsSchema = scenarioFieldsSchema
  .pick({ difficulty_levels: true, stop_condition: true, max_user_turns: true })
  .extend({ persona: scenarioFieldsSchema.shape.persona.pick({ goal: true, tone: true }) });
const defaults = defaultsSchema.parse(customDefaults);

export const customScenarioFormSchema = z.object({
  track: trackIdSchema,
  title: z.string().trim().min(3, 'Say what the conversation is about.'),
  personaName: z.string().trim().min(1, 'Who are you talking to?'),
  personaRole: z.string().trim().min(1, 'What is their role?'),
  userGoal: z.string().trim().min(3, 'What do you need from them?'),
  pushback: z.string().trim().min(3, 'What pushback do you expect?'),
});
export type CustomScenarioForm = z.infer<typeof customScenarioFormSchema>;

export function buildCustomScenario(form: CustomScenarioForm, now = Date.now()): Scenario {
  return scenarioSchema.parse({
    id: customScenarioId(form.title, now),
    track: form.track,
    title: form.title,
    summary: `${form.personaName} is likely to push back: ${form.pushback}`,
    user_goal: form.userGoal,
    persona: {
      name: form.personaName,
      role: form.personaRole,
      goal: defaults.persona.goal,
      hidden_objection: form.pushback,
      tone: defaults.persona.tone,
      context: [`The user needs this from ${form.personaName}: ${form.userGoal}`],
    },
    difficulty_levels: defaults.difficulty_levels,
    opening_line: getTrack(form.track).custom_opening_line,
    stop_condition: defaults.stop_condition,
    max_user_turns: defaults.max_user_turns,
  });
}

export { isCustomScenario };

const STORAGE_KEY = 'hardtalk.custom-scenarios.v1';
let customScenarios: Scenario[] = [];
const listeners = new Set<() => void>();

function publish(next: Scenario[]) {
  customScenarios = next;
  listeners.forEach((listener) => listener());
}

export async function loadCustomScenarios(): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = z.array(scenarioSchema).safeParse(raw ? JSON.parse(raw) : []);
  publish(parsed.success ? parsed.data : []);
}

export async function saveCustomScenario(scenario: Scenario): Promise<void> {
  publish([...customScenarios, scenario]);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(customScenarios));
}

export function getCustomScenarios(): Scenario[] {
  return customScenarios;
}

export function subscribeCustomScenarios(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
