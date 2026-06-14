import { getMockProviderForIp, mockMixerProvider } from '@shared/mixer/mock/mockMixerProvider';
import { IConsoleAdapter } from '../../IConsoleAdapter';
import { ConsoleEndpoint } from '../../ConsoleEndpoint';
import {
  ConsoleBus,
  ConsoleBusGroupsState,
  ConsoleChannel,
  ConsoleChannelRef,
  ConsoleMeterValues,
  Unsubscribe,
} from '../../types';

export class DemoConsoleAdapter implements IConsoleAdapter {
  readonly kind = 'demo' as const;
  private readonly provider;

  constructor(readonly endpoint: ConsoleEndpoint) {
    this.provider = getMockProviderForIp(endpoint.ip) ?? mockMixerProvider;
  }

  connect(): Promise<void> {
    return this.provider.connect(this.endpoint.ip);
  }

  disconnect(): void {
    this.provider.disconnect();
  }

  startHeartbeat(): void {}

  stopHeartbeat(): void {}

  getBuses(): Promise<ConsoleBus[]> {
    return this.provider.getBuses();
  }

  getBusGroupsState(busId: number): Promise<ConsoleBusGroupsState> {
    return this.provider.getBusGroupsState(busId);
  }

  getChannels(busId: number): Promise<ConsoleChannel[]> {
    return this.provider.getChannels(busId);
  }

  loadChannelsWithCache(_consoleIp: string, busId: number): Promise<ConsoleChannel[]> {
    return this.getChannels(busId);
  }

  async fetchChannelLinkMap(): Promise<Map<number, number>> {
    return new Map();
  }

  async loadChannelFaders(
    busId: number,
    existingChannels?: ConsoleChannel[],
  ): Promise<{ channel: ConsoleChannel; level: number }[]> {
    const channels = existingChannels && existingChannels.length > 0
      ? existingChannels
      : await this.getChannels(busId);
    return channels.map((channel) => ({ channel, level: channel.faderRaw }));
  }

  setChannelFader(channel: ConsoleChannelRef, busId: number, value: number): Promise<void> {
    return this.provider.setChannelFader(channel.number, busId, value);
  }

  setChannelOn(channel: ConsoleChannelRef, busId: number, isOn: boolean): Promise<void> {
    return this.provider.setChannelOn(channel.number, busId, isOn);
  }

  setChannelPan(channel: ConsoleChannelRef, busId: number, value: number): Promise<void> {
    return this.provider.setChannelPan(channel.number, busId, value);
  }

  setDcaFader(dcaNumber: number, value: number): Promise<void> {
    return this.provider.setDcaFader(dcaNumber, value);
  }

  setDcaOn(dcaNumber: number, isOn: boolean): Promise<void> {
    return this.provider.setDcaOn(dcaNumber, isOn);
  }

  setBusMasterFader(busId: number, value: number): Promise<void> {
    return this.provider.setBusMasterFader(busId, value);
  }

  setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    return this.provider.setBusMasterOn(busId, isOn);
  }

  subscribeChannelLevel(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe {
    return this.provider.subscribeChannelLevel(channel.number, busId, listener);
  }

  subscribeChannelOn(
    _channel: ConsoleChannelRef,
    _busId: number,
    _listener: (value: boolean) => void,
  ): Unsubscribe {
    return () => undefined;
  }

  subscribeChannelPan(
    _channel: ConsoleChannelRef,
    _busId: number,
    _listener: (value: number) => void,
  ): Unsubscribe {
    return () => undefined;
  }

  subscribeMeter(channelId: number, listener: (values: ConsoleMeterValues) => void): Unsubscribe {
    return this.provider.subscribeMeter(channelId, listener);
  }

  subscribeBusMasterMeter(busId: number, listener: (dbfs: number) => void): Unsubscribe {
    return this.provider.subscribeBusMasterMeter(busId, listener);
  }

  subscribeDcaFader(dcaNumber: number, listener: (value: number) => void): Unsubscribe {
    return this.provider.subscribeDcaFader(dcaNumber, listener);
  }

  subscribeDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): Unsubscribe {
    return this.provider.subscribeDcaOn(dcaNumber, listener);
  }

  subscribeBusMasterFader(busId: number, listener: (value: number) => void): Unsubscribe {
    return this.provider.subscribeBusMasterFader(busId, listener);
  }

  subscribeBusMasterOn(busId: number, listener: (isMuted: boolean) => void): Unsubscribe {
    return this.provider.subscribeBusMasterOn(busId, listener);
  }
}
