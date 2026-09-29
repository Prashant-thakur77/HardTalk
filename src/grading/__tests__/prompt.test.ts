import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { describe, expect, it } from 'vitest';

import { buildSystemPrompt, formatTranscript, graderConfigSchema } from '../prompt';
import { rubricSchema, scoredDimensions } from '../rubric.schema';
import { isGrounded } from '../evidence';
import { scenarioSchema } from '../../scenarios/schema';
import { trackSchema } from '../../tracks/schema';

const DATA = join(__dirname, '../../../data');
const load = (path: string) => YAML.parse(readFileSync(join(DATA, path), 'utf8')) as unknown;

const config = graderConfigSchema.parse(load('prompts/grader.yaml'));
const scenario = scenarioSchema.parse(load('scenarios/pr-blocking-release.yaml'));
const track = trackSchema.parse(load('tracks/workplace.yaml'));
const rubrics = track.rubrics.map((dimension) => rubricSchema.parse(load(`rubrics/${dimension}.yaml`)));

describe('grader prompt', () => {
  const prompt = buildSystemPrompt(config, track, scenario, rubrics);

  it('includes every rubric anchor and its framework, read from data', () => {
    for (const rubric of rubrics) {
      expect(prompt).toContain(rubric.framework.name);
      for (const anchor of Object.values(rubric.anchors)) expect(prompt).toContain(anchor.trim());
    }
  });

  it('tells the grader who the persona is and what the user was trying to do', () => {
    expect(prompt).toContain(scenario.user_goal);
    expect(prompt).toContain(scenario.persona.name);
    expect(prompt).not.toContain('{{');
  });

  it("says what kind of practice it is, and which line of the user's to pull out", () => {
    expect(prompt).toContain(track.practising);
    expect(prompt).toContain(`key_line: ${track.key_line.instruction}`);
  });

  it('names everyone on a panel, so the grader never quotes a panelist as the user', () => {
    const pitch = scenarioSchema.parse(load('scenarios/pitch-seed-round.yaml'));
    const pitchTrack = trackSchema.parse(load('tracks/pitch.yaml'));
    const pitchRubrics = pitchTrack.rubrics.map((dimension) => rubricSchema.parse(load(`rubrics/${dimension}.yaml`)));
    const pitchPrompt = buildSystemPrompt(config, pitchTrack, pitch, pitchRubrics);
    for (const member of pitch.panel) expect(pitchPrompt).toContain(`Also in the room (persona): ${member.name}`);
    expect(pitchPrompt).toContain(pitchTrack.practising);
    expect(pitchPrompt).not.toContain('### clarity');
  });

  it('includes weak, medium and strong calibration examples', () => {
    expect(config.examples.map((example) => example.label)).toEqual(['weak', 'medium', 'strong']);
    expect(prompt).toContain('Example (weak)');
    expect(prompt).toContain('Example (strong)');
  });

  it('holds its own few-shot examples to the evidence rule', () => {
    for (const example of config.examples) {
      for (const [, result] of scoredDimensions(example.grade)) {
        for (const quote of result.evidence_quotes) {
          expect(isGrounded(quote, example.transcript)).toBe(true);
        }
      }
    }
  });

  it('formats the transcript with speaker labels the grader can tell apart', () => {
    const text = formatTranscript(
      [
        { speaker: 'persona', text: 'Hi.' },
        { speaker: 'user', text: 'Hello.' },
      ],
      'Sam',
    );
    expect(text).toBe('SAM (persona): Hi.\nUSER: Hello.');
  });

  it('labels a panelist by name, not as the lead persona', () => {
    const text = formatTranscript(
      [
        { speaker: 'persona', text: 'Who pays?' },
        { speaker: 'persona', name: 'Leo', text: 'I like the traction.' },
      ],
      'Maya',
    );
    expect(text).toBe('MAYA (persona): Who pays?\nLEO (persona): I like the traction.');
  });
});
