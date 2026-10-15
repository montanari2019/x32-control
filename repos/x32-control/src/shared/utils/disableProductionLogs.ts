const noop = (): void => undefined;

export const disableProductionLogs = (): void => {
  if (__DEV__) {
    return;
  }

  console.log = noop;
  console.debug = noop;
  console.info = noop;
  console.warn = noop;
  console.error = noop;
};
