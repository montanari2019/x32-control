import { act, renderHook } from '@testing-library/react-native';
import {
  LOCAL_PROTECTION_WINDOW_MS,
  useMasterFaderSync,
} from '@features/busGroups/hooks/useMasterFaderSync';
import type { X32BusGroupsService } from '@features/busGroups/services/X32BusGroupsService';

const BUS_ID = 4;

const setup = () => {
  const setBusMasterFader = jest.fn(async () => undefined);
  const service = { setBusMasterFader } as unknown as X32BusGroupsService;
  const onValue = jest.fn();
  const onError = jest.fn();
  const hook = renderHook(() => useMasterFaderSync({ busId: BUS_ID, onError, onValue, service }));

  return { ...hook, onError, onValue, setBusMasterFader };
};

describe('useMasterFaderSync', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sends the last pending value when the hook unmounts before the trailing timer', () => {
    const { result, setBusMasterFader, unmount } = setup();

    act(() => {
      result.current.setMasterFader(0.2);
      result.current.setMasterFader(0.9);
    });
    expect(setBusMasterFader).toHaveBeenCalledTimes(1);

    unmount();

    expect(setBusMasterFader).toHaveBeenCalledTimes(2);
    expect(setBusMasterFader).toHaveBeenLastCalledWith(BUS_ID, 0.9);
  });

  it('applies a remote value immediately when nothing local is in flight', () => {
    const { onValue, result } = setup();

    act(() => {
      result.current.handleRemoteFader(0.4);
    });

    expect(onValue).toHaveBeenCalledWith(0.4);
  });

  it('defers a remote value received during the protection window and applies it afterwards', () => {
    const { onValue, result } = setup();

    act(() => {
      result.current.setMasterFader(0.9);
    });
    onValue.mockClear();

    act(() => {
      result.current.handleRemoteFader(0.3);
    });
    expect(onValue).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(LOCAL_PROTECTION_WINDOW_MS + 50);
    });

    expect(onValue).toHaveBeenCalledWith(0.3);
  });

  it('keeps protecting while the interaction is active, even after the window elapsed', () => {
    const { onValue, result } = setup();

    act(() => {
      result.current.setInteractionActive(true);
      result.current.setMasterFader(0.6);
    });
    onValue.mockClear();

    act(() => {
      jest.advanceTimersByTime(LOCAL_PROTECTION_WINDOW_MS * 3);
      result.current.handleRemoteFader(0.1);
    });
    expect(onValue).not.toHaveBeenCalled();

    act(() => {
      result.current.setInteractionActive(false);
      jest.advanceTimersByTime(LOCAL_PROTECTION_WINDOW_MS + 50);
    });

    expect(onValue).toHaveBeenCalledWith(0.1);
  });
  it('drops a deferred remote value that a later local change made stale', () => {
    const { onValue, result } = setup();

    act(() => {
      result.current.setInteractionActive(true);
      result.current.setMasterFader(0.5);
      result.current.handleRemoteFader(0.3);
      result.current.setMasterFader(0.9);
      result.current.setInteractionActive(false);
    });
    onValue.mockClear();

    act(() => {
      jest.advanceTimersByTime(LOCAL_PROTECTION_WINDOW_MS * 2);
    });

    expect(onValue).not.toHaveBeenCalled();
  });

  it('does not poll with timers while the finger is held down', () => {
    const { result } = setup();

    act(() => {
      result.current.setInteractionActive(true);
      result.current.setMasterFader(0.6);
      jest.advanceTimersByTime(LOCAL_PROTECTION_WINDOW_MS * 2);
      result.current.handleRemoteFader(0.1);
    });

    expect(jest.getTimerCount()).toBe(0);
  });
  it('restores the deferred remote value when the trailing local send fails', async () => {
    const { onError, onValue, result, setBusMasterFader } = setup();
    setBusMasterFader.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('udp down'));

    act(() => {
      result.current.setMasterFader(0.5); // sent immediately
      result.current.setMasterFader(0.8); // waits for the trailing timer
      result.current.handleRemoteFader(0.3); // arrives before that send
    });
    onValue.mockClear();

    await act(async () => {
      jest.advanceTimersByTime(60); // trailing send runs and rejects; the remote value is brought back
      await Promise.resolve();
    });
    expect(onError).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(LOCAL_PROTECTION_WINDOW_MS * 2);
    });

    expect(onValue).toHaveBeenCalledWith(0.3);
  });
});
