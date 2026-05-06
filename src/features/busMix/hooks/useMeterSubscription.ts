import { isMockConsoleIp, mockMixerProvider } from '@shared/mixer/mock/mockMixerProvider';
import { useCallback, useEffect, useRef } from 'react';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { ChannelMeterValues, decodeMeter1BlobForChannel } from '../utils/meterDecoder';

type MeterListener = (values: ChannelMeterValues) => void;

// Poll at ~20fps. The X32 responds immediately to each /meters/1 request.
const POLL_INTERVAL_MS = 50;

const getBlobArg = (message: OscMessage): Uint8Array | null => {
  const [first] = message.args;
  return first instanceof Uint8Array ? first : null;
};

export const useMeterSubscription = (consoleIp: string) => {
  const isMock = isMockConsoleIp(consoleIp);
  const clientRef = useRef<OscClient | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeOscRef = useRef<(() => void) | null>(null);
  const listenersRef = useRef(new Map<number, Set<MeterListener>>());

  useEffect(() => {
    if (isMock) {
      return undefined;
    }

    const client = new OscClient();
    clientRef.current = client;

    const start = async (): Promise<void> => {
      try {
        await client.connect(consoleIp);
        client.startXRemoteKeepAlive();

        // Listen for /meters/1 responses
        unsubscribeOscRef.current = client.subscribe(
          X32Protocol.getMeters1Path(),
          (message) => {
            const blob = getBlobArg(message);
            if (!blob) {
              return;
            }

            listenersRef.current.forEach((listeners, channelId) => {
              if (listeners.size === 0) return;
              const values = decodeMeter1BlobForChannel(blob, channelId);
              listeners.forEach((listener) => listener(values));
            });
          },
        );

        // Poll: send /meters/1 (no args) at fixed interval.
        // The X32 responds immediately with a blob containing all channel levels.
        // This avoids the 10-second subscription timeout and renewal complexity.
        pollIntervalRef.current = setInterval(() => {
          if (listenersRef.current.size === 0) return;
          client.send(X32Protocol.getMeters1Path(), []).catch(() => undefined);
        }, POLL_INTERVAL_MS);
      } catch {
        // Keep silent; connection errors handled by main flow.
      }
    };

    start().catch(() => undefined);

    return () => {
      unsubscribeOscRef.current?.();
      unsubscribeOscRef.current = null;

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      client.disconnect();
      clientRef.current = null;
      listenersRef.current.clear();
    };
  }, [consoleIp, isMock]);

  const registerMeterListener = useCallback(
    (channelId: number, listener: MeterListener): (() => void) => {
      if (isMock) {
        return mockMixerProvider.subscribeMeter(channelId, listener);
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
    [isMock],
  );

  return { registerMeterListener };
};
