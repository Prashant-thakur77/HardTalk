import { describe, expect, it } from 'vitest';

import { draftSamples, sampleFor } from '@/scenarios/drafting';
import { scenarioFromDraft } from '@/scenarios/draft';
import { peopleIn } from '@/scenarios/people';
import { scenarios } from '@/scenarios';
import { getTrack } from '@/tracks';
import { TRACK_IDS } from '@/tracks/schema';

describe('drafted scenarios', () => {
  it('has one mock sample per track, in track order', () => {
    expect(draftSamples.map((sample) => sample.track)).toEqual([...TRACK_IDS]);
  });

  for (const sample of draftSamples) {
    it(`${sample.track}: the sample draft becomes a valid custom scenario with a full panel`, () => {
      const scenario = scenarioFromDraft(sample.draft, sample.track, 1700000000000);
      expect(scenario.id).toMatch(/^custom-.+-1700000000000$/);
      expect(scenario.track).toBe(sample.track);
      expect(scenario.max_user_turns).toBe(6);
      const people = peopleIn(scenario, 'L2');
      expect(people).toHaveLength(3);
      expect(new Set(people.map((person) => person.pitch)).size).toBeGreaterThan(1);
      expect(scenario.panel.map((member) => member.stance)).toEqual(expect.arrayContaining(['agrees', 'questions']));
    });

    it(`${sample.track}: the sample's context is taken from the pasted text`, () => {
      const words = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
      const pasted = words(sample.source);
      for (const fact of sample.draft.persona.context) {
        const factWords = [...words(fact)].filter((word) => word.length > 4);
        const shared = factWords.filter((word) => pasted.has(word)).length;
        expect(shared / Math.max(1, factWords.length), fact).toBeGreaterThan(0.3);
      }
    });
  }

  it('judges each sample panel only on its own track, and covers all four skills between them', () => {
    for (const sample of draftSamples) {
      const rubrics = getTrack(sample.track).rubrics;
      const cared = [sample.draft.persona, ...sample.draft.panel].flatMap((person) => person.cares_about);
      for (const id of cared) expect(rubrics, sample.track).toContain(id);
      expect(new Set(cared).size, sample.track).toBe(rubrics.length);
    }
  });

  it("never reuses a built-in persona's name", () => {
    const builtIn = new Set(scenarios.flatMap((scenario) => [scenario.persona.name, ...scenario.panel.map((m) => m.name)]));
    for (const sample of draftSamples) {
      for (const name of [sample.draft.persona.name, ...sample.draft.panel.map((member) => member.name)]) {
        expect(builtIn.has(name), name).toBe(false);
      }
    }
  });

  it('finds the sample for a track', () => {
    expect(sampleFor('pitch').track).toBe('pitch');
  });
});
