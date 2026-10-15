import { clamp } from '../../../src/shared/utils/clamp';

describe('clamp', () => {
  it('keeps values inside range', () => {
    expect(clamp(0.5)).toBe(0.5);
    expect(clamp(-1)).toBe(0);
    expect(clamp(2)).toBe(1);
  });

  it('uses the minimum for NaN', () => {
    expect(clamp(Number.NaN, -4, 4)).toBe(-4);
  });
});
