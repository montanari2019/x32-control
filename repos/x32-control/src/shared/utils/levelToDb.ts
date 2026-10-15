export const levelToDb = (level: number): number => {
  if (level <= 0) {
    return -Infinity;
  }

  if (level >= 1) {
    return 10;
  }

  return Math.round((20 * Math.log10(level) + 10) * 10) / 10;
};
