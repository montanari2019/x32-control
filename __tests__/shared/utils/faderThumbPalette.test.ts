import {
  FADER_THUMB_NEUTRAL_PALETTE,
  getColoredFaderThumbPalette,
} from '@shared/utils/faderThumbPalette';

describe('faderThumbPalette', () => {
  it('keeps the BusMix neutral palette available as an exact fallback', () => {
    expect(getColoredFaderThumbPalette('not-a-color')).toEqual(FADER_THUMB_NEUTRAL_PALETTE);
    expect(getColoredFaderThumbPalette('#12345678')).toEqual(FADER_THUMB_NEUTRAL_PALETTE);
    expect(getColoredFaderThumbPalette('red')).toEqual(FADER_THUMB_NEUTRAL_PALETTE);
  });

  it('derives a deterministic physical thumb palette from an MCA color', () => {
    expect(getColoredFaderThumbPalette('#1D63F0')).toEqual({
      surface: '#1D63F0',
      border: '#6E9BF5',
      groove: '#467FF3',
      centerLine: '#11398B',
    });
  });

  it('normalizes supported hex colors and preserves an explicit border color', () => {
    expect(getColoredFaderThumbPalette('#d8dde5', '#e7ebf0')).toEqual({
      surface: '#D8DDE5',
      border: '#E7EBF0',
      groove: '#DFE3EA',
      centerLine: '#7D8085',
    });
  });
});
