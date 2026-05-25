import { getMockProviderForIp, isMockConsoleIp } from '@shared/mixer/mock/mockMixerProvider';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { acquireSharedOscClient } from '@shared/osc/SharedOscClient';
import type { SharedOscClientLease } from '@shared/osc/SharedOscClient';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { ChannelMeterValues } from '../utils/meterDecoder';
import {
  dispatchMeterStreamBlob,
  getMeterStreamForChannelId,
  isAuxFxMeterId,
  isInputChannelMeterId,
} from '../utils/meterStreamRouting';

type MeterListener = (values: ChannelMeterValues) => void;

const METER_RENEW_INTERVAL_MS = 8000;
const METER_REQUEST_THROTTLE_MS = 1000;

const getBlobArg = (message: OscMessage): Uint8Array | null => {
  const [first] = message.args;
  return first instanceof Uint8Array ? first : null;
};

export const useMeterSubscription = (consoleIp: string, enabled = true) => {
  const isMock = isMockConsoleIp(consoleIp);
  const mockProvider = useMemo(
    () => (isMock ? getMockProviderForIp(consoleIp) : null),
    [consoleIp, isMock],
  );
  const clientRef = useRef<OscClient | null>(null);
  const clientLeaseRef = useRef<SharedOscClientLease | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeOscRef = useRef<(() => void) | null>(null);
  const listenersRef = useRef(new Map<number, Set<MeterListener>>());
  const isPollingRef = useRef(false);
  const isPolling13Ref = useRef(false);
  const pollInterval13Ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubscribeOsc13Ref = useRef<(() => void) | null>(null);
  const lastMeters1RequestAtRef = useRef(0);
  const lastMeters13RequestAtRef = useRef(0);

  const requestMeterStream = useCallback((meterPath: string): void => {
    const client = clientRef.current;
    if (!client) {
      return;
    }

    const lastRequestAtRef =
      meterPath === X32Protocol.getMeters13Path()
        ? lastMeters13RequestAtRef
        : lastMeters1RequestAtRef;
    const now = Date.now();
    if (now - lastRequestAtRef.current < METER_REQUEST_THROTTLE_MS) {
      return;
    }

    lastRequestAtRef.current = now;
    client.send(X32Protocol.getMetersSubscribePath(), [meterPath]).catch(() => undefined);
  }, []);

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

        const requestActiveMeterStreams = (): void => {
          const activeChannelIds = [...listenersRef.current.keys()];
          if (activeChannelIds.some(isInputChannelMeterId)) {
            requestMeterStream(X32Protocol.getMeters1Path());
          }
          if (activeChannelIds.some(isAuxFxMeterId)) {
            requestMeterStream(X32Protocol.getMeters13Path());
          }
        };

        // Listen for /meters/1 responses
        unsubscribeOscRef.current = client.subscribe(X32Protocol.getMeters1Path(), (message) => {
          const blob = getBlobArg(message);
          if (!blob) {
            return;
          }

          dispatchMeterStreamBlob('meters1', blob, listenersRef.current);
        });

        // Meter requests are sent to /meters with the requested meter id as a string.
        // The X32 streams responses for about 10s, so renew before that timeout.
        pollIntervalRef.current = setInterval(() => {
          const hasChannelListeners = [...listenersRef.current.keys()].some(isInputChannelMeterId);
          if (!hasChannelListeners) return;
          if (isPollingRef.current) return;

          isPollingRef.current = true;
          requestMeterStream(X32Protocol.getMeters1Path());
          isPollingRef.current = false;
        }, METER_RENEW_INTERVAL_MS);

        // Listen for /meters/13 responses (AUX 01-08 + FX Return 01-08, channelIds 33-48)
        unsubscribeOsc13Ref.current = client.subscribe(X32Protocol.getMeters13Path(), (message) => {
          const blob = getBlobArg(message);
          if (!blob) {
            return;
          }

          dispatchMeterStreamBlob('meters13', blob, listenersRef.current);
        });

        // Poll /meters/13 only while AUX/FX Return listeners are active.
        pollInterval13Ref.current = setInterval(() => {
          const hasAuxFxListeners = [...listenersRef.current.keys()].some(isAuxFxMeterId);
          if (!hasAuxFxListeners) return;
          if (isPolling13Ref.current) return;

          isPolling13Ref.current = true;
          requestMeterStream(X32Protocol.getMeters13Path());
          isPolling13Ref.current = false;
        }, METER_RENEW_INTERVAL_MS);

        requestActiveMeterStreams();
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
      lastMeters1RequestAtRef.current = 0;
      lastMeters13RequestAtRef.current = 0;
      clientRef.current?.stopXRemoteKeepAlive();
      clientLeaseRef.current?.release();
      clientLeaseRef.current = null;
      clientRef.current = null;
      listeners.clear();
    };
  }, [consoleIp, enabled, isMock, requestMeterStream]);

  const registerMeterListener = useCallback(
    (channelId: number, listener: MeterListener): (() => void) => {
      if (isMock && mockProvider) {
        return mockProvider.subscribeMeter(channelId, listener);
      }

      if (!enabled) {
        return () => undefined;
      }

      const listeners = listenersRef.current.get(channelId) ?? new Set<MeterListener>();
      listeners.add(listener);
      listenersRef.current.set(channelId, listeners);

      const meterStream = getMeterStreamForChannelId(channelId);
      if (meterStream === 'meters1') {
        requestMeterStream(X32Protocol.getMeters1Path());
      }
      if (meterStream === 'meters13') {
        requestMeterStream(X32Protocol.getMeters13Path());
      }

      return () => {
        const current = listenersRef.current.get(channelId);
        if (!current) return;
        current.delete(listener);
        if (current.size === 0) {
          listenersRef.current.delete(channelId);
        }
      };
    },
    [enabled, isMock, mockProvider, requestMeterStream],
  );

  return { registerMeterListener };
};
