export const debounce = <TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  waitMs: number,
): ((...args: TArgs) => void) => {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: TArgs): void => {
    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => callback(...args), waitMs);
  };
};
