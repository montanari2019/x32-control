import type { BusGroupsState } from '@features/busGroups/types/busGroups.types';
import type { Channel } from '@features/busMix/types/Channel';
import type { ChannelMeterValues } from '@features/busMix/utils/meterDecoder';
import type { Bus } from '@features/busSelection/types/Bus';
import type { ConsoleAdapterFactoryOptions } from '../../../ConsoleAdapterFactory';
import type { ConsoleEndpoint } from '../../../ConsoleEndpoint';
import type { IConsoleAdapter } from '../../../IConsoleAdapter';
import type { ConsoleChannelRef, Unsubscribe } from '../../../types';
import { X32AdapterContext } from './X32AdapterContext';
import { X32BusAdapter } from './X32BusAdapter';
import { X32BusGroupsAdapter } from './X32BusGroupsAdapter';
import { X32BusMixAdapter } from './X32BusMixAdapter';
import { X32ConnectionLifecycle } from './X32ConnectionLifecycle';
import { X32MeterSubscriptions } from './X32MeterSubscriptions';
import { X32NodeClient } from './X32NodeClient';

export class X32Adapter implements IConsoleAdapter {
  readonly kind = 'x32' as const;
  private readonly context: X32AdapterContext;
  private readonly nodeClient: X32NodeClient;
  private readonly meters: X32MeterSubscriptions;
  private readonly lifecycle: X32ConnectionLifecycle;
  private readonly buses: X32BusAdapter;
  private readonly busMix: X32BusMixAdapter;
  private readonly busGroups: X32BusGroupsAdapter;

  constructor(
    readonly endpoint: ConsoleEndpoint,
    options: ConsoleAdapterFactoryOptions = {},
  ) {
    this.context = new X32AdapterContext(endpoint, options);
    this.nodeClient = new X32NodeClient(this.context);
    this.meters = new X32MeterSubscriptions(this.context);
    this.lifecycle = new X32ConnectionLifecycle(
      this.context,
      () => this.meters.clear(),
      () => this.nodeClient.reset(),
    );
    this.buses = new X32BusAdapter(this.context);
    this.busMix = new X32BusMixAdapter(this.context, this.nodeClient);
    this.busGroups = new X32BusGroupsAdapter(this.context);
  }

  connect(): Promise<void> {
    return this.lifecycle.connect();
  }

  disconnect(): void {
    this.lifecycle.disconnect();
  }

  startHeartbeat(): void {
    this.lifecycle.startHeartbeat();
  }

  stopHeartbeat(): void {
    this.lifecycle.stopHeartbeat();
  }

  getBuses(): Promise<Bus[]> {
    return this.buses.getBuses();
  }

  getBusGroupsState(busId: number): Promise<BusGroupsState> {
    return this.busGroups.getBusGroupsState(busId);
  }

  getChannels(busId: number): Promise<Channel[]> {
    return this.busMix.getChannels(busId);
  }

  loadChannelsWithCache(consoleIp: string, busId: number): Promise<Channel[]> {
    return this.busMix.loadChannelsWithCache(consoleIp, busId);
  }

  fetchChannelLinkMap(): Promise<Map<number, number>> {
    return this.busMix.fetchChannelLinkMap();
  }

  loadChannelFaders(
    busId: number,
    existingChannels?: Channel[],
  ): Promise<{ channel: Channel; level: number }[]> {
    return this.busMix.loadChannelFaders(busId, existingChannels);
  }

  setChannelFader(channel: ConsoleChannelRef, busId: number, value: number): Promise<void> {
    return this.busMix.setChannelFader(channel, busId, value);
  }

  setChannelOn(channel: ConsoleChannelRef, busId: number, isOn: boolean): Promise<void> {
    return this.busMix.setChannelOn(channel, busId, isOn);
  }

  setChannelPan(channel: ConsoleChannelRef, busId: number, value: number): Promise<void> {
    return this.busMix.setChannelPan(channel, busId, value);
  }

  setDcaFader(dcaNumber: number, value: number): Promise<void> {
    return this.busGroups.setDcaFader(dcaNumber, value);
  }

  setDcaOn(dcaNumber: number, isOn: boolean): Promise<void> {
    return this.busGroups.setDcaOn(dcaNumber, isOn);
  }

  setBusMasterFader(busId: number, value: number): Promise<void> {
    return this.busGroups.setBusMasterFader(busId, value);
  }

  setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    return this.busGroups.setBusMasterOn(busId, isOn);
  }

  subscribeChannelLevel(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe {
    return this.busMix.subscribeChannelLevel(channel, busId, listener);
  }

  subscribeChannelOn(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: boolean) => void,
  ): Unsubscribe {
    return this.busMix.subscribeChannelOn(channel, busId, listener);
  }

  subscribeChannelPan(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe {
    return this.busMix.subscribeChannelPan(channel, busId, listener);
  }

  subscribeMeter(channelId: number, listener: (values: ChannelMeterValues) => void): Unsubscribe {
    return this.meters.subscribeMeter(channelId, listener);
  }

  subscribeBusMasterMeter(busId: number, listener: (dbfs: number) => void): Unsubscribe {
    return this.meters.subscribeBusMasterMeter(busId, listener);
  }

  subscribeDcaFader(dcaNumber: number, listener: (value: number) => void): Unsubscribe {
    return this.busGroups.subscribeDcaFader(dcaNumber, listener);
  }

  subscribeDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): Unsubscribe {
    return this.busGroups.subscribeDcaOn(dcaNumber, listener);
  }

  subscribeBusMasterFader(busId: number, listener: (value: number) => void): Unsubscribe {
    return this.busGroups.subscribeBusMasterFader(busId, listener);
  }

  subscribeBusMasterOn(busId: number, listener: (isMuted: boolean) => void): Unsubscribe {
    return this.busGroups.subscribeBusMasterOn(busId, listener);
  }
}

