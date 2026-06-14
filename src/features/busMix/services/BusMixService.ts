import { ConsoleAdapterFactory, IConsoleAdapter } from '@shared/console';
import { Channel } from '../types/Channel';

export class BusMixService {
  private adapter?: IConsoleAdapter;
  private connectedConsoleIp?: string;

  constructor(private readonly adapterFactory = new ConsoleAdapterFactory()) {}

  async connect(consoleIp: string): Promise<void> {
    if (this.adapter && this.connectedConsoleIp === consoleIp) {
      return;
    }

    this.adapter?.disconnect();
    this.adapter = this.adapterFactory.createAdapter({ ip: consoleIp });
    this.connectedConsoleIp = consoleIp;
    await this.adapter.connect();
    this.adapter.startHeartbeat();
  }

  disconnect(): void {
    this.adapter?.disconnect();
    this.adapter = undefined;
    this.connectedConsoleIp = undefined;
  }

  onLevel(channel: Channel, bus: number, listener: (level: number) => void): () => void {
    return this.requireAdapter().subscribeChannelLevel(channel, bus, listener);
  }

  onOn(channel: Channel, bus: number, listener: (on: boolean) => void): () => void {
    return this.requireAdapter().subscribeChannelOn(channel, bus, listener);
  }

  onPan(channel: Channel, bus: number, listener: (pan: number) => void): () => void {
    return this.requireAdapter().subscribeChannelPan(channel, bus, listener);
  }

  fetchChannelLinkMap(): Promise<Map<number, number>> {
    return this.requireAdapter().fetchChannelLinkMap();
  }

  loadChannels(bus: number): Promise<Channel[]> {
    return this.requireAdapter().getChannels(bus);
  }

  loadChannelsBulk(bus: number): Promise<Channel[]> {
    return this.requireAdapter().getChannels(bus);
  }

  loadChannelsWithFallback(bus: number): Promise<Channel[]> {
    return this.requireAdapter().getChannels(bus);
  }

  loadChannelsWithCache(consoleIp: string, bus: number): Promise<Channel[]> {
    return this.requireAdapter().loadChannelsWithCache(consoleIp, bus);
  }

  async setChannelFader(channel: Channel, bus: number, level: number): Promise<void> {
    await this.setChannelFaderInBus(channel, bus, level);
  }

  setChannelFaderInBus(channel: Channel, busId: number, rawValue: number): Promise<void> {
    return this.requireAdapter().setChannelFader(channel, busId, rawValue);
  }

  loadChannelFaders(
    bus: number,
    existingChannels?: Channel[],
  ): Promise<{ channel: Channel; level: number }[]> {
    return this.requireAdapter().loadChannelFaders(bus, existingChannels);
  }

  async setChannelOn(channel: Channel, bus: number, on: boolean): Promise<void> {
    await this.setChannelOnInBus(channel, bus, on);
  }

  setChannelOnInBus(channel: Channel, busId: number, isOn: boolean): Promise<void> {
    return this.requireAdapter().setChannelOn(channel, busId, isOn);
  }

  setChannelPan(channel: Channel, bus: number, pan: number): Promise<void> {
    return this.requireAdapter().setChannelPan(channel, bus, pan);
  }

  subscribeMeter(channelId: number, listener: Parameters<IConsoleAdapter['subscribeMeter']>[1]) {
    return this.requireAdapter().subscribeMeter(channelId, listener);
  }

  private requireAdapter(): IConsoleAdapter {
    if (!this.adapter) {
      throw new Error('Console adapter is not connected.');
    }

    return this.adapter;
  }
}
