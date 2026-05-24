import {
  clampPanPercent,
  formatPanLabel,
  formatSignedPanValue,
  percentToX32Pan,
  x32PanToPercent,
} from '../../../src/shared/x32/pan';

describe('x32 pan conversion', () => {
  it('converts normalized X32 pan to signed UI percent', () => {
    expect(x32PanToPercent(0)).toBe(-100);
    expect(x32PanToPercent(0.5)).toBe(0);
    expect(x32PanToPercent(1)).toBe(100);
  });

  it('converts signed UI percent to normalized X32 pan', () => {
    expect(percentToX32Pan(-100)).toBe(0);
    expect(percentToX32Pan(0)).toBe(0.5);
    expect(percentToX32Pan(100)).toBe(1);
  });

  it('clamps pan values before converting to X32 pan', () => {
    expect(percentToX32Pan(-180)).toBe(0);
    expect(percentToX32Pan(180)).toBe(1);
    expect(percentToX32Pan(Number.NaN)).toBe(0);
  });

  it('clamps and rounds signed UI percent values', () => {
    expect(clampPanPercent(-100.4)).toBe(-100);
    expect(clampPanPercent(37.4)).toBe(37);
    expect(clampPanPercent(37.5)).toBe(38);
    expect(clampPanPercent(120)).toBe(100);
  });

  it('formats signed pan values for the BusMix modal', () => {
    expect(formatSignedPanValue(-100)).toBe('-100');
    expect(formatSignedPanValue(0)).toBe('0');
    expect(formatSignedPanValue(100)).toBe('+100');
    expect(formatSignedPanValue(37)).toBe('+37');
    expect(formatSignedPanValue(-37)).toBe('-37');
  });

  it('keeps the legacy directional pan label available for existing consumers', () => {
    expect(formatPanLabel(-100)).toBe('L 100');
    expect(formatPanLabel(0)).toBe('C');
    expect(formatPanLabel(100)).toBe('R 100');
  });
});
