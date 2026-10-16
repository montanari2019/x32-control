import { useCallback, useEffect, useRef } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { clamp } from '@shared/utils/clamp';
import { X32BusGroupsService } from '../services/X32BusGroupsService';

export const LOCAL_PROTECTION_WINDOW_MS = 250;
const MASTER_FADER_SEND_INTERVAL_MS = 40;
const MIN_DEFERRED_WAIT_MS = 10;

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
  const sendSeqRef = useRef(0);
  const pendingValueRef = useRef<number | null>(null);
  const sendTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInteractingRef = useRef(false);
  const deferredRemoteRef = useRef<number | null>(null);
  const deferredTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    onValueRef.current = onValue;
    onErrorRef.current = onError;
  }, [onError, onValue]);

  const isProtected = useCallback(
    (): boolean =>
      isInteractingRef.current ||
      pendingValueRef.current != null ||
      Date.now() - lastLocalChangeAtRef.current < LOCAL_PROTECTION_WINDOW_MS,
    [],
  );

  const scheduleDeferredRemote = useCallback((): void => {
    // While the finger is down the deferred value waits for the release (setInteractionActive).
    if (deferredTimerRef.current || isInteractingRef.current) {
      return;
    }

    const remaining = LOCAL_PROTECTION_WINDOW_MS - (Date.now() - lastLocalChangeAtRef.current);
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
    }, Math.max(remaining, MIN_DEFERRED_WAIT_MS));
  }, [isProtected]);

  const sendNow = useCallback(
    (value: number): void => {
      lastSentAtRef.current = Date.now();
      sendSeqRef.current += 1;
      const seq = sendSeqRef.current;
      // The console keeps our last write, so any remote value received before it is stale.
      const superseded = deferredRemoteRef.current;
      deferredRemoteRef.current = null;
      service.setBusMasterFader(busId, value).catch((error) => {
        // The write failed, so the console still holds the remote value: bring it back.
        // Only the latest write decides what the console holds; an older failure restores nothing.
        if (seq === sendSeqRef.current && superseded != null && deferredRemoteRef.current == null) {
          deferredRemoteRef.current = superseded;
          scheduleDeferredRemote();
        }
        onErrorRef.current(getErrorMessage(error));
      });
    },
    [busId, scheduleDeferredRemote, service],
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

  const setMasterFader = useCallback(
    (value: number): void => {
      const nextValue = clamp(value);
      const now = Date.now();
      lastLocalChangeAtRef.current = now;
      deferredRemoteRef.current = null;
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

  const setInteractionActive = useCallback(
    (active: boolean): void => {
      isInteractingRef.current = active;
      if (!active) {
        // Protection counts from the release, not from the last move.
        lastLocalChangeAtRef.current = Date.now();
        if (deferredRemoteRef.current != null) {
          scheduleDeferredRemote();
        }
      }
    },
    [scheduleDeferredRemote],
  );

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
