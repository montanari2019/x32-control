import { useCallback, useEffect, useRef } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { clamp } from '@shared/utils/clamp';
import { X32BusGroupsService } from '../services/X32BusGroupsService';

export const LOCAL_PROTECTION_WINDOW_MS = 250;
const MASTER_FADER_SEND_INTERVAL_MS = 40;

type UseMasterFaderSyncParams = {
  busId: number;
  onError: (message: string) => void;
  onValue: (value: number) => void;
  service: X32BusGroupsService;
};

type MasterFaderSync = {
  handleRemoteFader: (value: number) => void;
  setInteractionActive: (active: boolean) => void;
  setMasterFader: (value: number) => void;
};

/**
 * Bus master fader sync: coalesces OSC sends while dragging (the trailing send always carries the
 * last value, also on unmount) and keeps remote values from overwriting the local one during and
 * right after an interaction, applying the last deferred remote value once protection ends.
 */
export const useMasterFaderSync = ({
  busId,
  onError,
  onValue,
  service,
}: UseMasterFaderSyncParams): MasterFaderSync => {
  const onValueRef = useRef(onValue);
  const onErrorRef = useRef(onError);
  const lastLocalChangeAtRef = useRef(0);
  const lastSentAtRef = useRef(0);
  const pendingValueRef = useRef<number | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);
  const deferredRemoteRef = useRef<number | null>(null);
  const deferredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onValueRef.current = onValue;
    onErrorRef.current = onError;
  }, [onError, onValue]);

  const sendNow = useCallback(
    (value: number): void => {
      lastSentAtRef.current = Date.now();
      service.setBusMasterFader(busId, value).catch((error) => {
        onErrorRef.current(getErrorMessage(error));
      });
    },
    [busId, service],
  );

  const flushPending = useCallback((): void => {
    if (sendTimerRef.current) {
      clearTimeout(sendTimerRef.current);
      sendTimerRef.current = null;
    }

    const pending = pendingValueRef.current;
    pendingValueRef.current = null;
    if (pending != null) {
      sendNow(pending);
    }
  }, [sendNow]);

  const isProtected = useCallback(
    (): boolean =>
      isInteractingRef.current ||
      pendingValueRef.current != null ||
      Date.now() - lastLocalChangeAtRef.current < LOCAL_PROTECTION_WINDOW_MS,
    [],
  );

  const scheduleDeferredRemote = useCallback((): void => {
    if (deferredTimerRef.current) {
      return;
    }

    const wait = Math.max(
      LOCAL_PROTECTION_WINDOW_MS - (Date.now() - lastLocalChangeAtRef.current),
      0,
    );
    deferredTimerRef.current = setTimeout(() => {
      deferredTimerRef.current = null;
      if (isProtected()) {
        scheduleDeferredRemote();
        return;
      }

      const deferred = deferredRemoteRef.current;
      deferredRemoteRef.current = null;
      if (deferred != null) {
        onValueRef.current(deferred);
      }
    }, wait + 1);
  }, [isProtected]);

  const setMasterFader = useCallback(
    (value: number): void => {
      const nextValue = clamp(value);
      const now = Date.now();
      lastLocalChangeAtRef.current = now;
      onValueRef.current(nextValue);

      pendingValueRef.current = nextValue;
      const elapsed = now - lastSentAtRef.current;
      if (elapsed >= MASTER_FADER_SEND_INTERVAL_MS && !sendTimerRef.current) {
        flushPending();
        return;
      }

      if (!sendTimerRef.current) {
        sendTimerRef.current = setTimeout(flushPending, MASTER_FADER_SEND_INTERVAL_MS - elapsed);
      }
    },
    [flushPending],
  );

  const handleRemoteFader = useCallback(
    (value: number): void => {
      if (!isProtected()) {
        onValueRef.current(value);
        return;
      }

      deferredRemoteRef.current = value;
      scheduleDeferredRemote();
    },
    [isProtected, scheduleDeferredRemote],
  );

  const setInteractionActive = useCallback((active: boolean): void => {
    isInteractingRef.current = active;
    if (!active) {
      // Protection counts from the release, not from the last move.
      lastLocalChangeAtRef.current = Date.now();
    }
  }, []);

  useEffect(
    () => () => {
      flushPending();
      if (deferredTimerRef.current) {
        clearTimeout(deferredTimerRef.current);
        deferredTimerRef.current = null;
      }
    },
    [flushPending],
  );

  return { handleRemoteFader, setInteractionActive, setMasterFader };
};
