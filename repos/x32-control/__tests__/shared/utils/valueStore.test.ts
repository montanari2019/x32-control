import { createValueStore } from '@shared/utils/valueStore';

describe('createValueStore', () => {
  it('returns the initial value and the latest set value', () => {
    const store = createValueStore(1);
    expect(store.get()).toBe(1);

    store.set(2);

    expect(store.get()).toBe(2);
  });

  it('notifies subscribers only when the value changes', () => {
    const store = createValueStore(1);
    const listener = jest.fn();
    store.subscribe(listener);

    store.set(1);
    expect(listener).not.toHaveBeenCalled();

    store.set(2);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after unsubscribe', () => {
    const store = createValueStore(1);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.set(2);

    expect(listener).not.toHaveBeenCalled();
  });
});
