import { clamp } from '@shared/utils/clamp';

export const clampPanPercent = (value: number): number => clamp(Math.round(value), -100, 100);

export const x32PanToPercent = (value: number): number =>
  Math.round((clamp(value, 0, 1) - 0.5) * 200);

export const percentToX32Pan = (value: number): number => {
  const clamped = clampPanPercent(value);
  return (clamped + 100) / 200;
};

export const formatSignedPanValue = (value: number): string => {
  const clamped = clampPanPercent(value);
  return clamped > 0 ? `+${clamped}` : `${clamped}`;
};

export const formatPanLabel = (value: number): string => {
  if (value === 0) return 'C';
  return value < 0 ? `L ${Math.abs(value)}` : `R ${value}`;
};
