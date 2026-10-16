import { useSyncExternalStore } from 'react';

export type ValueStore<T> = {
  get: () => T;
  set: (next: T) => void;
  subscribe: (listener: () => void) => () => void;
};

export const createValueStore = <T>(initial: T): ValueStore<T> => {
  let value = initial;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (next) => {
      if (Object.is(next, value)) {
        return;
      }

      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

export const useValueStore = <T>(store: ValueStore<T>): T =>
  useSyncExternalStore(store.subscribe, store.get, store.get);
