import { describe, expect, it } from 'vitest';

import { scoredDimensions, totalScore } from '@/grading/rubric.schema';
import { userText } from '@/grading/transcript';
import { getRecording } from '@/mock/recordings';
import { isDistressLine, isStopLine } from '@/safety';
import { scenarios } from '@/scenarios';
import { getTrack } from '@/tracks';

describe('mock recordings', () => {
  for (const scenario of scenarios) {
    const panel = scenario.panel.map((member) => member.name);

    for (const attempt of [1, 2]) {
      const recording = getRecording(scenario.id, attempt);

      it(`${scenario.id} attempt ${attempt}: is graded on exactly its track's rubrics, in order`, () => {
        expect(scoredDimensions(recording.grade).map(([dimension]) => dimension)).toEqual(
          getTrack(scenario.track).rubrics,
        );
      });

      it(`${scenario.id} attempt ${attempt}: every evidence quote and the key line are verbatim user speech`, () => {
        const said = userText(recording.turns);
        for (const [, result] of scoredDimensions(recording.grade)) {
          for (const quote of result.evidence_quotes) expect(said).toContain(quote);
        }
        if (recording.grade.key_line) expect(said).toContain(recording.grade.key_line);
      });

      it(`${scenario.id} attempt ${attempt}: opens with the scenario's opening line`, () => {
        expect(recording.turns[0]).toEqual({ speaker: 'persona', text: scenario.opening_line });
      });

      it(`${scenario.id} attempt ${attempt}: only panel members are named, and every one of them speaks`, () => {
        const named = recording.turns.flatMap((turn) => (turn.name ? [turn.name] : []));
        for (const name of named) expect(panel).toContain(name);
        expect(new Set(named)).toEqual(new Set(panel));
      });

      it(`${scenario.id} attempt ${attempt}: no user line trips the stop word or the distress exit`, () => {
        for (const turn of recording.turns.filter((t) => t.speaker === 'user')) {
          expect(isDistressLine(turn.text), turn.text).toBe(false);
          expect(isStopLine(turn.text, [scenario.persona.name, ...panel]), turn.text).toBe(false);
        }
      });
    }

    it(`${scenario.id}: the retry scores higher than the first try`, () => {
      expect(totalScore(getRecording(scenario.id, 2).grade)).toBeGreaterThan(totalScore(getRecording(scenario.id, 1).grade));
    });
  }
});
