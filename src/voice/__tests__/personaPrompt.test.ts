import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { scenarioSchema } from '../../scenarios/schema';
import { trackSchema } from '../../tracks/schema';
import { buildPersonaPrompt, isPersonaStopLine, personaConfigSchema, splitPanelReply } from '../personaPrompt';

const DATA = join(__dirname, '../../../data');
const load = (path: string) => YAML.parse(readFileSync(join(DATA, path), 'utf8')) as unknown;

const config = personaConfigSchema.parse(load('prompts/persona.yaml'));
const scenario = scenarioSchema.parse(load('scenarios/pr-blocking-release.yaml'));
const workplace = trackSchema.parse(load('tracks/workplace.yaml'));

describe('buildPersonaPrompt', () => {
  it('fills every placeholder from the scenario and chosen level', () => {
    const prompt = buildPersonaPrompt(config, workplace, scenario, 'L2');
    expect(prompt).not.toMatch(/{{\w+}}/);
    expect(prompt).toContain('You are Sam, senior engineer on your team.');
    expect(prompt).toContain(scenario.persona.hidden_objection.trim());
    expect(prompt).toContain(scenario.difficulty_levels.L2.behaviour.trim());
    expect(prompt).not.toContain(scenario.difficulty_levels.L3.behaviour.trim());
    expect(prompt).toContain(`You are in ${workplace.setting}.`);
  });

  it('seats the panel: each member with their view, and the tag that gives them their own voice', () => {
    const pitch = scenarioSchema.parse(load('scenarios/pitch-seed-round.yaml'));
    const prompt = buildPersonaPrompt(config, trackSchema.parse(load('tracks/pitch.yaml')), pitch, 'L2');
    expect(prompt).not.toMatch(/{{\w+}}/);
    for (const member of pitch.panel) {
      expect(prompt).toContain(member.view.trim());
      expect(prompt).toContain(`<${member.name}>`);
    }
    expect(prompt).toContain('Maya leads and speaks without a tag.');
  });

  it('leaves the panel section out of a one-to-one conversation', () => {
    expect(buildPersonaPrompt(config, workplace, scenario, 'L1')).not.toContain('Other people in the room');
  });

  it('always carries the guardrails and the stop word', () => {
    for (const level of ['L1', 'L2', 'L3'] as const) {
      const prompt = buildPersonaPrompt(config, workplace, scenario, level);
      expect(prompt).toMatch(/Never insult,\s+threaten,\s+use slurs/);
      expect(prompt).toContain('just say "stop"');
      expect(prompt).toContain(`say exactly "${config.stop_phrase}"`);
      expect(prompt).toContain(`spoken ${scenario.max_user_turns} times`);
    }
  });

  it('refuses to ship a prompt with an unknown placeholder', () => {
    expect(() => buildPersonaPrompt({ ...config, template: 'Hi {{nickname}}' }, workplace, scenario, 'L1')).toThrow(/nickname/);
  });

  it("finds the persona's out-of-character stop line anywhere in its reply", () => {
    for (const line of [
      "Let's pause the practice here.",
      'lets pause the practice here',
      "Okay. Let's pause the practice here.",
      "Let's pause the practice here. Take care of yourself.",
      "Of course. Let's pause the practice here, okay?",
    ]) {
      expect(isPersonaStopLine(config, line), line).toBe(true);
    }
  });

  it('does not mistake an in-character wrap-up for the stop line', () => {
    expect(isPersonaStopLine(config, "Okay, let's stop here, 4pm it is.")).toBe(false);
    expect(isPersonaStopLine(config, "Fine. Let's pause the migration until Friday.")).toBe(false);
  });
});

describe('splitPanelReply', () => {
  const panel = ['Leo'];

  it('keeps an untagged reply as the lead persona speaking', () => {
    expect(splitPanelReply('Who pays for this?', panel)).toEqual([{ text: 'Who pays for this?' }]);
  });

  it('splits a reply into the lead and a tagged panelist, in order', () => {
    expect(splitPanelReply('Fair. <Leo>I like the traction, though.</Leo> Now, retention?', panel)).toEqual([
      { text: 'Fair.' },
      { name: 'Leo', text: 'I like the traction, though.' },
      { text: 'Now, retention?' },
    ]);
  });

  it('never shows markup, even for a tag naming someone not on the panel', () => {
    expect(splitPanelReply('<Zed>Hello there.</Zed>', panel)).toEqual([{ text: 'Hello there.' }]);
    expect(splitPanelReply('Half a tag <Leo>left open', panel)).toEqual([{ text: 'Half a tag left open' }]);
  });
});
