import { useSyncExternalStore } from 'react';
import type { ValueStore } from '@shared/utils/valueStore';

export const useValueStore = <T>(store: ValueStore<T>): T =>
  useSyncExternalStore(store.subscribe, store.get, store.get);
