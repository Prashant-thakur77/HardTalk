import { describe, expect, it } from 'vitest';

import { DIMENSIONS } from '@/grading/rubric.schema';
import { userText } from '@/grading/transcript';
import { getRecording } from '@/mock/recordings';
import { scenarios } from '@/scenarios';

describe('mock recordings', () => {
  for (const scenario of scenarios) {
    for (const attempt of [1, 2]) {
      const recording = getRecording(scenario.id, attempt);

      it(`${scenario.id} attempt ${attempt}: every evidence quote is verbatim user speech`, () => {
        const said = userText(recording.turns);
        for (const dimension of DIMENSIONS) {
          for (const quote of recording.grade.dimensions[dimension].evidence_quotes) {
            expect(said).toContain(quote);
          }
        }
      });

      it(`${scenario.id} attempt ${attempt}: opens with the scenario's opening line`, () => {
        expect(recording.turns[0]).toEqual({ speaker: 'persona', text: scenario.opening_line });
      });
    }

    it(`${scenario.id}: the retry scores higher than the first try`, () => {
      const sum = (attempt: number) =>
        DIMENSIONS.reduce((total, d) => total + getRecording(scenario.id, attempt).grade.dimensions[d].score, 0);
      expect(sum(2)).toBeGreaterThan(sum(1));
    });
  }
});
