export const clamp = (value: number, min = 0, max = 1): number => {
  if (Number.isNaN(value)) {
    return min;
  }

  return Math.min(max, Math.max(min, value));
};
