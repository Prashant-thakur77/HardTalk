import { describe, expect, it } from 'vitest';

import { skillKey, stepStates } from '../skillSteps';

describe('stepStates', () => {
  it('draws a score on its own as scored steps', () => {
    expect(stepStates(3)).toEqual(['scored', 'scored', 'scored', 'empty']);
  });

  it('draws a gain as kept steps, then gained ones', () => {
    expect(stepStates(4, 2)).toEqual(['kept', 'kept', 'gained', 'gained']);
  });

  it('draws an unchanged skill as all kept, never as a gain', () => {
    expect(stepStates(3, 3)).toEqual(['kept', 'kept', 'kept', 'empty']);
  });

  it('draws a drop as kept steps, then lost ones', () => {
    expect(stepStates(1, 4)).toEqual(['kept', 'lost', 'lost', 'lost']);
  });
});

describe('skillKey', () => {
  it('reads as a sentence for both comparisons', () => {
    expect(skillKey('last time')).toBe('Grey steps you had last time, coloured steps are new, dashed steps were lost.');
    expect(skillKey('on your first try')).toMatch(/^Grey steps you had on your first try,/);
  });
});
