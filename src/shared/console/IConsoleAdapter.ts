import type { ConsoleEndpoint } from './ConsoleEndpoint';
import type { ConsoleAdapterKind } from './ConsoleAdapterKind';
import type {
  ConsoleBus,
  ConsoleBusGroupsState,
  ConsoleChannel,
  ConsoleChannelRef,
  ConsoleMeterValues,
  Unsubscribe,
} from './types';

export interface IConsoleAdapter {
  readonly kind: ConsoleAdapterKind;
  readonly endpoint: ConsoleEndpoint;

  connect(): Promise<void>;
  disconnect(): void;
  startHeartbeat(): void;
  stopHeartbeat(): void;

  getBuses(): Promise<ConsoleBus[]>;
  getBusGroupsState(busId: number): Promise<ConsoleBusGroupsState>;
  getChannels(busId: number): Promise<ConsoleChannel[]>;
  loadChannelsWithCache(consoleIp: string, busId: number): Promise<ConsoleChannel[]>;
  fetchChannelLinkMap(): Promise<Map<number, number>>;
  loadChannelFaders(
    busId: number,
    existingChannels?: ConsoleChannel[],
  ): Promise<{ channel: ConsoleChannel; level: number }[]>;

  setChannelFader(channel: ConsoleChannelRef, busId: number, value: number): Promise<void>;
  setChannelOn(channel: ConsoleChannelRef, busId: number, isOn: boolean): Promise<void>;
  setChannelPan(channel: ConsoleChannelRef, busId: number, value: number): Promise<void>;
  setDcaFader(dcaNumber: number, value: number): Promise<void>;
  setDcaOn(dcaNumber: number, isOn: boolean): Promise<void>;
  setBusMasterFader(busId: number, value: number): Promise<void>;
  setBusMasterOn(busId: number, isOn: boolean): Promise<void>;

  subscribeChannelLevel(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe;
  subscribeChannelOn(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: boolean) => void,
  ): Unsubscribe;
  subscribeChannelPan(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): Unsubscribe;
  subscribeMeter(channelId: number, listener: (values: ConsoleMeterValues) => void): Unsubscribe;
  subscribeBusMasterMeter(busId: number, listener: (dbfs: number) => void): Unsubscribe;
  subscribeDcaFader(dcaNumber: number, listener: (value: number) => void): Unsubscribe;
  subscribeDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): Unsubscribe;
  subscribeBusMasterFader(busId: number, listener: (value: number) => void): Unsubscribe;
  subscribeBusMasterOn(busId: number, listener: (isMuted: boolean) => void): Unsubscribe;
}
