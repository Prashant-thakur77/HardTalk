import { z } from 'zod';

import type { Difficulty, Scenario } from '../scenarios/schema';

/** Shape of data/prompts/persona.yaml. */
export const personaConfigSchema = z.strictObject({ template: z.string().min(1) });
export type PersonaConfig = z.infer<typeof personaConfigSchema>;

/** Fills the persona template from scenario data. Throws on any placeholder left unfilled. */
export function buildPersonaPrompt(config: PersonaConfig, scenario: Scenario, difficulty: Difficulty): string {
  const level = scenario.difficulty_levels[difficulty];
  const values: Record<string, string> = {
    name: scenario.persona.name,
    role: scenario.persona.role.charAt(0).toLowerCase() + scenario.persona.role.slice(1),
    goal: scenario.persona.goal,
    hidden_objection: scenario.persona.hidden_objection.trim(),
    tone: scenario.persona.tone,
    context: scenario.persona.context.map((fact) => `- ${fact}`).join('\n'),
    level: difficulty,
    level_name: level.name,
    level_behaviour: level.behaviour.trim(),
    stop_condition: scenario.stop_condition.trim(),
    max_user_turns: String(scenario.max_user_turns),
  };
  const prompt = config.template.replace(/{{(\w+)}}/g, (match, key: string) => values[key] ?? match);
  const missing = prompt.match(/{{\w+}}/);
  if (missing) throw new Error(`Persona template placeholder ${missing[0]} has no value.`);
  return prompt.trim();
}
