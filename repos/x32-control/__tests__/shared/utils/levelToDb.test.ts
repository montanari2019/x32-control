import { levelToDb } from '../../../src/shared/utils/levelToDb';

describe('levelToDb', () => {
  it('maps silence to negative infinity', () => {
    expect(levelToDb(0)).toBe(-Infinity);
  });

  it('maps unity to +10 dB for X32 style normalized faders', () => {
    expect(levelToDb(1)).toBe(10);
  });

  it('converts normalized gain logarithmically', () => {
    expect(levelToDb(0.5)).toBeCloseTo(4, 1);
  });
});
