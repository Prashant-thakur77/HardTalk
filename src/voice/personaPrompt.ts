import { z } from 'zod';

import type { Difficulty, Scenario } from '../scenarios/schema';
import type { Track } from '../tracks/schema';

/** Shape of data/prompts/persona.yaml. */
export const personaConfigSchema = z.strictObject({
  stop_phrase: z.string().min(1),
  template: z.string().includes('{{setting}}').includes('{{panel}}'),
  panel: z.string().includes('{{members}}'),
  panel_member: z.string().includes('{{member_name}}'),
});
export type PersonaConfig = z.infer<typeof personaConfigSchema>;

function fill(template: string, values: Record<string, string>): string {
  const filled = template.replace(/{{(\w+)}}/g, (match, key: string) => values[key] ?? match);
  const missing = filled.match(/{{\w+}}/);
  if (missing) throw new Error(`Persona template placeholder ${missing[0]} has no value.`);
  return filled;
}

const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1);

/** The panel section: empty for a one-to-one conversation. */
function describePanel(config: PersonaConfig, scenario: Scenario): string {
  const [first] = scenario.panel;
  if (!first) return '';
  const members = scenario.panel
    .map((member) =>
      fill(config.panel_member, {
        member_name: member.name,
        member_role: lowerFirst(member.role),
        member_tone: member.tone,
        member_view: member.view.trim(),
      }),
    )
    .join('\n');
  return fill(config.panel, { members, name: scenario.persona.name, example: first.name }).trimEnd();
}

/** Fills the persona template from scenario and track data. Throws on any placeholder left unfilled. */
export function buildPersonaPrompt(
  config: PersonaConfig,
  track: Track,
  scenario: Scenario,
  difficulty: Difficulty,
): string {
  const level = scenario.difficulty_levels[difficulty];
  const prompt = fill(config.template, {
    name: scenario.persona.name,
    role: lowerFirst(scenario.persona.role),
    setting: track.setting.trim(),
    goal: scenario.persona.goal,
    hidden_objection: scenario.persona.hidden_objection.trim(),
    tone: scenario.persona.tone,
    context: scenario.persona.context.map((fact) => `- ${fact}`).join('\n'),
    level: difficulty,
    level_name: level.name,
    level_behaviour: level.behaviour.trim(),
    panel: describePanel(config, scenario),
    stop_condition: scenario.stop_condition.trim(),
    max_user_turns: String(scenario.max_user_turns),
    stop_phrase: config.stop_phrase,
  });
  return prompt.trim();
}

/**
 * True when the persona's reply contains its stop line anywhere, ignoring case and punctuation.
 * The line is deliberately out of character, so no in-character reply contains it, while
 * "Okay. Let's pause the practice here." still counts.
 */
export function isPersonaStopLine(config: PersonaConfig, text: string): boolean {
  const simplify = (value: string) => value.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  return simplify(text).includes(simplify(config.stop_phrase));
}

export interface SpokenLine {
  /** The panelist who spoke, or undefined for the lead persona. */
  name?: string;
  text: string;
}

/**
 * Splits one persona reply into who said what. Panelists' words arrive wrapped in a tag with
 * their name (<Leo>…</Leo>); untagged words are the lead persona's. Tags naming anyone who is
 * not on the panel are dropped, so captions never show markup.
 */
export function splitPanelReply(text: string, panelNames: string[]): SpokenLine[] {
  const lines: SpokenLine[] = [];
  const push = (words: string, name?: string) => {
    const clean = words.replace(/<\/?[A-Za-z][\w-]*>/g, '').replace(/\s+/g, ' ').trim();
    if (clean) lines.push(name ? { name, text: clean } : { text: clean });
  };
  const tag = /<([A-Z][a-z]+)>([\s\S]*?)<\/\1>/g;
  let at = 0;
  for (const match of text.matchAll(tag)) {
    push(text.slice(at, match.index));
    const [, name = '', words = ''] = match;
    push(words, panelNames.includes(name) ? name : undefined);
    at = match.index + match[0].length;
  }
  push(text.slice(at));
  return lines;
}
