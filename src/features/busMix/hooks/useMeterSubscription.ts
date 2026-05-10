import { getMockProviderForIp, isMockConsoleIp } from '@shared/mixer/mock/mockMixerProvider';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { acquireSharedOscClient } from '@shared/osc/SharedOscClient';
import type { SharedOscClientLease } from '@shared/osc/SharedOscClient';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { ChannelMeterValues, decodeMeter1BlobForChannel } from '../utils/meterDecoder';

type MeterListener = (values: ChannelMeterValues) => void;

// Poll around 12.5fps. Perceptually equivalent to 15fps for VU meters, 17% less UDP traffic.
const POLL_INTERVAL_MS = 80;

const getBlobArg = (message: OscMessage): Uint8Array | null => {
  const [first] = message.args;
  return first instanceof Uint8Array ? first : null;
};

export const useMeterSubscription = (consoleIp: string, enabled = true) => {
  const isMock = isMockConsoleIp(consoleIp);
  const mockProvider = useMemo(() => getMockProviderForIp(consoleIp), [consoleIp]);
  const clientRef = useRef<OscClient | null>(null);
  const clientLeaseRef = useRef<SharedOscClientLease | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeOscRef = useRef<(() => void) | null>(null);
  const listenersRef = useRef(new Map<number, Set<MeterListener>>());
  const isPollingRef = useRef(false);
  const isPolling13Ref = useRef(false);
  const pollInterval13Ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeOsc13Ref = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || isMock) {
      return undefined;
    }

    let isActive = true;
    const listeners = listenersRef.current;

    const start = async (): Promise<void> => {
      try {
        const lease = await acquireSharedOscClient(consoleIp);
        if (!isActive) {
          lease.release();
          return;
        }

        clientLeaseRef.current = lease;
        const client = lease.client;
        clientRef.current = client;
        client.startXRemoteKeepAlive();

        // Listen for /meters/1 responses
        unsubscribeOscRef.current = client.subscribe(X32Protocol.getMeters1Path(), (message) => {
          const blob = getBlobArg(message);
          if (!blob) {
            return;
          }

          listenersRef.current.forEach((listeners, channelId) => {
            if (listeners.size === 0) return;
            const values = decodeMeter1BlobForChannel(blob, channelId);
            listeners.forEach((listener) => listener(values));
          });
        });

        // Poll: send /meters/1 (no args) at fixed interval.
        // The X32 responds immediately with a blob containing all channel levels.
        // This avoids the 10-second subscription timeout and renewal complexity.
        pollIntervalRef.current = setInterval(() => {
          if (listenersRef.current.size === 0) return;
          if (isPollingRef.current) return;

          isPollingRef.current = true;
          client
            .sendRaw(X32Protocol.getMeters1Path())
            .catch(() => undefined)
            .finally(() => {
              isPollingRef.current = false;
            });
        }, POLL_INTERVAL_MS);

        // Listen for /meters/13 responses (AUX 01-08 + FX Return 01-08, channelIds 33-48)
        unsubscribeOsc13Ref.current = client.subscribe(X32Protocol.getMeters13Path(), (message) => {
          const blob = getBlobArg(message);
          if (!blob) {
            return;
          }

          listenersRef.current.forEach((listeners, channelId) => {
            if (channelId < 33 || channelId > 48) return;
            if (listeners.size === 0) return;
            const values = decodeMeter1BlobForChannel(blob, channelId);
            listeners.forEach((listener) => listener(values));
          });
        });

        // Poll /meters/13 only while AUX/FX Return listeners are active.
        pollInterval13Ref.current = setInterval(() => {
          const hasAuxFxListeners = [...listenersRef.current.keys()].some(
            (channelId) => channelId >= 33 && channelId <= 48,
          );
          if (!hasAuxFxListeners) return;
          if (isPolling13Ref.current) return;

          isPolling13Ref.current = true;
          client
            .sendRaw(X32Protocol.getMeters13Path())
            .catch(() => undefined)
            .finally(() => {
              isPolling13Ref.current = false;
            });
        }, POLL_INTERVAL_MS);
      } catch {
        // Keep silent; connection errors handled by main flow.
      }
    };

    start().catch(() => undefined);

    return () => {
      isActive = false;
      unsubscribeOscRef.current?.();
      unsubscribeOscRef.current = null;

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      unsubscribeOsc13Ref.current?.();
      unsubscribeOsc13Ref.current = null;

      if (pollInterval13Ref.current) {
        clearInterval(pollInterval13Ref.current);
        pollInterval13Ref.current = null;
      }

      isPollingRef.current = false;
      isPolling13Ref.current = false;
      clientRef.current?.stopXRemoteKeepAlive();
      clientLeaseRef.current?.release();
      clientLeaseRef.current = null;
      clientRef.current = null;
      listeners.clear();
    };
  }, [consoleIp, enabled, isMock]);

  const registerMeterListener = useCallback(
    (channelId: number, listener: MeterListener): (() => void) => {
      if (isMock) {
        return mockProvider.subscribeMeter(channelId, listener);
      }

      if (!enabled) {
        return () => undefined;
      }

      const listeners = listenersRef.current.get(channelId) ?? new Set<MeterListener>();
      listeners.add(listener);
      listenersRef.current.set(channelId, listeners);

      return () => {
        const current = listenersRef.current.get(channelId);
        if (!current) return;
        current.delete(listener);
        if (current.size === 0) {
          listenersRef.current.delete(channelId);
        }
      };
    },
    [enabled, isMock, mockProvider],
  );

  return { registerMeterListener };
};
