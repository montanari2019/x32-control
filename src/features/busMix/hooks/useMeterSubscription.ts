import { useCallback, useEffect, useMemo, useRef } from 'react';
import { ChannelMeterValues } from '../utils/meterDecoder';
import { BusMixService } from '../services/BusMixService';

type MeterListener = (values: ChannelMeterValues) => void;

export const useMeterSubscription = (consoleIp: string, enabled = true) => {
  const service = useMemo(() => new BusMixService(), []);
  const listenersRef = useRef(new Map<number, Set<MeterListener>>());
  const unsubscribersRef = useRef(new Map<number, Map<MeterListener, () => void>>());
  const isConnectedRef = useRef(false);

  const subscribeListener = useCallback(
    (channelId: number, listener: MeterListener): void => {
      if (!enabled || !isConnectedRef.current) {
        return;
      }

      const byChannel =
        unsubscribersRef.current.get(channelId) ?? new Map<MeterListener, () => void>();
      if (byChannel.has(listener)) {
        return;
      }

      byChannel.set(listener, service.subscribeMeter(channelId, listener));
      unsubscribersRef.current.set(channelId, byChannel);
    },
    [enabled, service],
  );

  const unsubscribeListener = useCallback((channelId: number, listener: MeterListener): void => {
    const byChannel = unsubscribersRef.current.get(channelId);
    const unsubscribe = byChannel?.get(listener);
    unsubscribe?.();
    byChannel?.delete(listener);
    if (byChannel?.size === 0) {
      unsubscribersRef.current.delete(channelId);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    let isActive = true;

    const start = async (): Promise<void> => {
      try {
        await service.connect(consoleIp);
        if (!isActive) {
          service.disconnect();
          return;
        }

        isConnectedRef.current = true;
        listenersRef.current.forEach((listeners, channelId) => {
          listeners.forEach((listener) => subscribeListener(channelId, listener));
        });
      } catch {
        // Keep silent; connection errors are handled by the main BusMix flow.
      }
    };

    start().catch(() => undefined);

    return () => {
      isActive = false;
      isConnectedRef.current = false;
      unsubscribersRef.current.forEach((byChannel) => {
        byChannel.forEach((unsubscribe) => unsubscribe());
      });
      unsubscribersRef.current.clear();
      listenersRef.current.clear();
      service.disconnect();
    };
  }, [consoleIp, enabled, service, subscribeListener]);

  const registerMeterListener = useCallback(
    (channelId: number, listener: MeterListener): (() => void) => {
      if (!enabled) {
        return () => undefined;
      }

      const listeners = listenersRef.current.get(channelId) ?? new Set<MeterListener>();
      listeners.add(listener);
      listenersRef.current.set(channelId, listeners);
      subscribeListener(channelId, listener);

      return () => {
        const current = listenersRef.current.get(channelId);
        if (!current) {
          return;
        }

        current.delete(listener);
        if (current.size === 0) {
          listenersRef.current.delete(channelId);
        }
        unsubscribeListener(channelId, listener);
      };
    },
    [enabled, subscribeListener, unsubscribeListener],
  );

  return { registerMeterListener };
};
