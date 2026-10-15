import {
  panPercentToSliderRatio,
  sliderPositionToPanPercent,
  sliderRatioToPanPercent,
} from '../../../../src/features/busMix/utils/panSlider';

describe('pan modal slider mapping', () => {
  it('maps signed pan values to deterministic slider ratios', () => {
    expect(panPercentToSliderRatio(-100)).toBe(0);
    expect(panPercentToSliderRatio(0)).toBe(0.5);
    expect(panPercentToSliderRatio(100)).toBe(1);
  });

  it('maps slider ratios to signed pan values', () => {
    expect(sliderRatioToPanPercent(0)).toBe(-100);
    expect(sliderRatioToPanPercent(0.5)).toBe(0);
    expect(sliderRatioToPanPercent(1)).toBe(100);
  });

  it('clamps out-of-range ratios and positions', () => {
    expect(sliderRatioToPanPercent(-0.5)).toBe(-100);
    expect(sliderRatioToPanPercent(1.5)).toBe(100);
    expect(sliderPositionToPanPercent(-50, 200)).toBe(-100);
    expect(sliderPositionToPanPercent(250, 200)).toBe(100);
  });

  it('converts measured positions into rounded signed pan values', () => {
    expect(sliderPositionToPanPercent(0, 200)).toBe(-100);
    expect(sliderPositionToPanPercent(100, 200)).toBe(0);
    expect(sliderPositionToPanPercent(200, 200)).toBe(100);
    expect(sliderPositionToPanPercent(137, 200)).toBe(37);
  });

  it('falls back to center while layout width is unavailable', () => {
    expect(sliderPositionToPanPercent(120, 0)).toBe(0);
  });
});
