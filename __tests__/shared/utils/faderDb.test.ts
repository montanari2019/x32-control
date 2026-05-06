import { formatDbLabel, x32DbToRaw, x32RawToDb } from '../../../src/shared/utils/faderDb';

describe('x32 fader db conversion', () => {
  it('maps raw OSC values to the X32 fader dB curve', () => {
    expect(x32RawToDb(0)).toBe('-inf');
    expect(x32RawToDb(0.25)).toBeCloseTo(-30);
    expect(x32RawToDb(0.5)).toBeCloseTo(-10);
    expect(x32RawToDb(0.75)).toBeCloseTo(0);
    expect(x32RawToDb(1)).toBeCloseTo(10);
  });

  it('maps known near-unity values accurately', () => {
    // These values come from real X32 hardware observations
    expect(x32RawToDb(0.725)).toBeCloseTo(-1, 0);
    expect(x32RawToDb(0.70)).toBeCloseTo(-2, 0);
  });

  it('maps fader dB values back to normalized OSC values', () => {
    expect(x32DbToRaw('-inf')).toBe(0);
    expect(x32DbToRaw(-30)).toBeCloseTo(0.25);
    expect(x32DbToRaw(-10)).toBeCloseTo(0.5);
    expect(x32DbToRaw(0)).toBeCloseTo(0.75);
    expect(x32DbToRaw(10)).toBeCloseTo(1);
  });

  it('formats unity, positive gain, and negative infinity labels', () => {
    expect(formatDbLabel(0)).toBe('0');
    expect(formatDbLabel(5)).toBe('+5');
    expect(formatDbLabel('-inf')).toBe('-\u221e');
  });
});
