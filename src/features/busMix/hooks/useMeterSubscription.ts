import { useCallback, useEffect, useRef } from 'react';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { ChannelMeterValues, decodeMeterBlob } from '../utils/meterDecoder';

type MeterListener = (values: ChannelMeterValues) => void;

type ChannelSubscription = {
  client: OscClient;
  listeners: Set<MeterListener>;
  renewInterval?: ReturnType<typeof setInterval>;
  unsubscribe?: () => void;
};

const RENEW_MS = 9000;

const getBlobArg = (message: OscMessage): Uint8Array | null => {
  const [first] = message.args;
  return first instanceof Uint8Array ? first : null;
};

export const useMeterSubscription = (consoleIp: string) => {
  const subscriptionsRef = useRef(new Map<number, ChannelSubscription>());

  const startChannel = useCallback(
    async (channelId: number, entry: ChannelSubscription): Promise<void> => {
      try {
        await entry.client.connect(consoleIp);
        entry.client.startXRemoteKeepAlive();

        entry.unsubscribe = entry.client.subscribe(X32Protocol.getMeters0Path(), (message) => {
          const blob = getBlobArg(message);
          if (!blob) return;
          const values = decodeMeterBlob(blob);
          entry.listeners.forEach((listener) => listener(values));
        });

        await entry.client.send(X32Protocol.getMetersSubscribePath(), [
          X32Protocol.getMeters0Path(),
          channelId,
        ]);

        entry.renewInterval = setInterval(() => {
          entry.client
            .send(X32Protocol.getMetersRenewPath(), [X32Protocol.getMeters0Path()])
            .catch(() => undefined);
        }, RENEW_MS);
      } catch {
        // Keep silent; connection errors are handled by the main flow.
      }
    },
    [consoleIp],
  );

  const stopChannel = useCallback((channelId: number) => {
    const entry = subscriptionsRef.current.get(channelId);
    if (!entry) return;

    entry.unsubscribe?.();
    if (entry.renewInterval) {
      clearInterval(entry.renewInterval);
    }
    entry.client.disconnect();
    subscriptionsRef.current.delete(channelId);
  }, []);

  const registerMeterListener = useCallback(
    (channelId: number, listener: MeterListener): (() => void) => {
      let entry = subscriptionsRef.current.get(channelId);
      if (!entry) {
        entry = { client: new OscClient(), listeners: new Set<MeterListener>() };
        subscriptionsRef.current.set(channelId, entry);
        startChannel(channelId, entry).catch(() => undefined);
      }

      entry.listeners.add(listener);

      return () => {
        const current = subscriptionsRef.current.get(channelId);
        if (!current) return;
        current.listeners.delete(listener);
        if (current.listeners.size === 0) {
          stopChannel(channelId);
        }
      };
    },
    [startChannel, stopChannel],
  );

  useEffect(
    () => () => {
      subscriptionsRef.current.forEach((_entry, channelId) => {
        stopChannel(channelId);
      });
    },
    [stopChannel],
  );

  return { registerMeterListener };
};
