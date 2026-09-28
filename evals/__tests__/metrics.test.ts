import { describe, expect, it } from 'vitest';

import { exactAgreement, quadraticKappa, stability, withinOne } from '../metrics';

describe('quadraticKappa', () => {
  // Reference values from sklearn.metrics.cohen_kappa_score(a, b, weights='quadratic').
  it.each([
    [[1, 2, 3, 4, 4, 2, 1, 3], [1, 2, 3, 3, 4, 1, 2, 4], 0.8],
    [[2, 2, 3, 1, 4, 4, 1, 2, 3, 3], [2, 3, 3, 1, 4, 3, 2, 2, 4, 3], 0.7894736842105263],
    [[1, 2, 3, 4], [4, 3, 2, 1], -1],
  ])('matches sklearn on %j vs %j', (a, b, expected) => {
    expect(quadraticKappa(a, b)).toBeCloseTo(expected, 10);
  });

  it('is 1 for identical ratings, including a constant rater that agrees', () => {
    expect(quadraticKappa([1, 3, 4], [1, 3, 4])).toBe(1);
    expect(quadraticKappa([2, 2, 2], [2, 2, 2])).toBe(1);
  });

  it('is 0 for a constant rater against varied truth (the "always 2" baseline)', () => {
    expect(quadraticKappa([1, 2, 3, 4, 2, 3], [2, 2, 2, 2, 2, 2])).toBe(0);
  });
});

describe('agreement and stability', () => {
  it('counts exact and within-one agreement', () => {
    expect(exactAgreement([1, 2, 3, 4], [1, 2, 4, 1])).toBe(0.5);
    expect(withinOne([1, 2, 3, 4], [1, 2, 4, 1])).toBe(0.75);
  });

  it('measures how often repeated runs give the same score', () => {
    const result = stability([
      [1, 2, 3, 4],
      [1, 2, 3, 3],
      [1, 2, 3, 4],
    ]);
    expect(result.identical).toBe(0.75);
    expect(result.meanStdDev).toBeCloseTo(Math.sqrt(2 / 9) / 4, 10);
  });
});
