import { act, renderHook } from '@testing-library/react-native';
import { useValueStore } from '@shared/hooks/useValueStore';
import { createValueStore } from '@shared/utils/valueStore';

describe('useValueStore', () => {
  it('re-renders with the new value when the store changes', () => {
    const store = createValueStore(-60);
    const { result } = renderHook(() => useValueStore(store));
    expect(result.current).toBe(-60);

    act(() => {
      store.set(-12);
    });

    expect(result.current).toBe(-12);
  });
});
