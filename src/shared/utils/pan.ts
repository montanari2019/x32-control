import { clamp } from './clamp';

export const clampPan = (value: number): number => clamp(Math.round(value), -100, 100);

export const formatPanLabel = (value: number): string => {
  const clamped = clampPan(value);
  if (clamped === 0) {
    return 'C';
  }

  return clamped < 0 ? `L${Math.abs(clamped)}` : `R${clamped}`;
};
