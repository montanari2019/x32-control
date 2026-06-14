import type { ChannelMeterValues } from '@features/busMix/utils/meterDecoder';
import { decodeMeter2BlobForBusMaster } from '@features/busMix/utils/meterDecoder';
import {
  dispatchMeterStreamBlob,
  getMeterStreamForChannelId,
  isAuxFxMeterId,
  isInputChannelMeterId,
} from '@features/busMix/utils/meterStreamRouting';
import { X32Protocol } from '@shared/osc/X32Protocol';
import type { Unsubscribe } from '../../../types';
import {
  BUS_MASTER_METER_RENEW_INTERVAL_MS,
  METER_RENEW_INTERVAL_MS,
  METER_REQUEST_THROTTLE_MS,
} from './X32AdapterConstants';
import { X32AdapterContext } from './X32AdapterContext';
import { getBlobArg } from './x32OscValueUtils';

type MeterStream = 'meters1' | 'meters13';
type MeterListener = (values: ChannelMeterValues) => void;

export class X32MeterSubscriptions {
  private readonly meterListeners = new Map<number, Set<MeterListener>>();
  private meterIntervals = new Map<MeterStream, ReturnType<typeof setInterval>>();
  private meterUnsubscribers = new Map<MeterStream, Unsubscribe>();
  private lastMeterRequestAt = new Map<MeterStream, number>();

  constructor(private readonly context: X32AdapterContext) {}

  subscribeMeter(channelId: number, listener: (values: ChannelMeterValues) => void): Unsubscribe {
    const listeners = this.meterListeners.get(channelId) ?? new Set<MeterListener>();
    listeners.add(listener);
    this.meterListeners.set(channelId, listeners);

    const meterStream = getMeterStreamForChannelId(channelId);
    if (meterStream) {
      this.ensureMeterStream(meterStream);
      this.requestMeterStream(meterStream);
    }

    return () => {
      const current = this.meterListeners.get(channelId);
      if (!current) {
        return;
      }

      current.delete(listener);
      if (current.size === 0) {
        this.meterListeners.delete(channelId);
      }
    };
  }

  subscribeBusMasterMeter(busId: number, listener: (dbfs: number) => void): Unsubscribe {
    let isActive = true;
    const requestMeterStream = (): void => {
      if (!isActive) {
        return;
      }

      this.context.client
        .send(X32Protocol.getMetersSubscribePath(), [X32Protocol.getMeters2Path()])
        .catch(() => undefined);
    };
    const unsubscribe = this.context.client.subscribe(X32Protocol.getMeters2Path(), (message) => {
      const blob = getBlobArg(message);
      if (!blob) {
        return;
      }

      listener(decodeMeter2BlobForBusMaster(blob, busId).preFadeDbfs);
    });
    const interval = setInterval(requestMeterStream, BUS_MASTER_METER_RENEW_INTERVAL_MS);

    requestMeterStream();

    return () => {
      if (!isActive) {
        return;
      }

      isActive = false;
      clearInterval(interval);
      unsubscribe();
    };
  }

  clear(): void {
    this.meterUnsubscribers.forEach((unsubscribe) => unsubscribe());
    this.meterUnsubscribers.clear();
    this.meterIntervals.forEach((interval) => clearInterval(interval));
    this.meterIntervals.clear();
    this.lastMeterRequestAt.clear();
    this.meterListeners.clear();
  }

  private ensureMeterStream(meterStream: MeterStream): void {
    if (this.meterUnsubscribers.has(meterStream)) {
      return;
    }

    const meterPath =
      meterStream === 'meters13' ? X32Protocol.getMeters13Path() : X32Protocol.getMeters1Path();
    const unsubscribe = this.context.client.subscribe(meterPath, (message) => {
      const blob = getBlobArg(message);
      if (!blob) {
        return;
      }

      dispatchMeterStreamBlob(meterStream, blob, this.meterListeners);
    });
    const interval = setInterval(() => {
      const activeChannelIds = [...this.meterListeners.keys()];
      const hasListeners =
        meterStream === 'meters13'
          ? activeChannelIds.some(isAuxFxMeterId)
          : activeChannelIds.some(isInputChannelMeterId);
      if (hasListeners) {
        this.requestMeterStream(meterStream);
      }
    }, METER_RENEW_INTERVAL_MS);

    this.meterUnsubscribers.set(meterStream, unsubscribe);
    this.meterIntervals.set(meterStream, interval);
  }

  private requestMeterStream(meterStream: MeterStream): void {
    const now = Date.now();
    const lastRequestAt = this.lastMeterRequestAt.get(meterStream) ?? 0;
    if (now - lastRequestAt < METER_REQUEST_THROTTLE_MS) {
      return;
    }

    this.lastMeterRequestAt.set(meterStream, now);
    const meterPath =
      meterStream === 'meters13' ? X32Protocol.getMeters13Path() : X32Protocol.getMeters1Path();
    this.context.client
      .send(X32Protocol.getMetersSubscribePath(), [meterPath])
      .catch(() => undefined);
  }
}

