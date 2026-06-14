import { clamp } from '@shared/utils/clamp';
import { clampPanPercent } from '@shared/x32/pan';

export const PAN_SLIDER_MIN = -100;
export const PAN_SLIDER_MAX = 100;
export const PAN_SLIDER_RANGE = PAN_SLIDER_MAX - PAN_SLIDER_MIN;

export const panPercentToSliderRatio = (value: number): number =>
  (clampPanPercent(value) - PAN_SLIDER_MIN) / PAN_SLIDER_RANGE;

export const sliderRatioToPanPercent = (ratio: number): number =>
  clampPanPercent(PAN_SLIDER_MIN + clamp(ratio, 0, 1) * PAN_SLIDER_RANGE);

export const sliderPositionToPanPercent = (positionX: number, width: number): number => {
  if (!Number.isFinite(width) || width <= 0) {
    return 0;
  }

  return sliderRatioToPanPercent(positionX / width);
};
