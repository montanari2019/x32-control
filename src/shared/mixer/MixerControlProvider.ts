import { BusGroupsState } from '@features/busGroups/types/busGroups.types';
import { ChannelMeterValues } from '@features/busMix/utils/meterDecoder';
import { Channel } from '@features/busMix/types/Channel';
import { Bus } from '@features/busSelection/types/Bus';
import { ConsoleDevice } from '@features/consoleDiscovery/types/ConsoleDevice';

export interface MixerControlProvider {
  connect(consoleIp: string): Promise<void>;
  disconnect(): void;
  scanConsoles(): Promise<ConsoleDevice[]>;
  getBuses(): Promise<Bus[]>;
  getBusGroupsState(busId: number): Promise<BusGroupsState>;
  getChannels(busId: number): Promise<Channel[]>;
  setChannelFader(channelId: number, busId: number, value: number): Promise<void>;
  setChannelPan(channelId: number, busId: number, value: number): Promise<void>;
  setChannelOn(channelId: number, busId: number, isOn: boolean): Promise<void>;
  setDcaFader(dcaNumber: number, value: number): Promise<void>;
  setDcaOn(dcaNumber: number, isOn: boolean): Promise<void>;
  setBusMasterFader(busId: number, value: number): Promise<void>;
  setBusMasterOn(busId: number, isOn: boolean): Promise<void>;
  subscribeChannelLevel(
    channelId: number,
    busId: number,
    listener: (value: number) => void,
  ): () => void;
  subscribeMeter(channelId: number, listener: (values: ChannelMeterValues) => void): () => void;
  subscribeDcaFader(dcaNumber: number, listener: (value: number) => void): () => void;
  subscribeDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): () => void;
  subscribeBusMasterFader(busId: number, listener: (value: number) => void): () => void;
  subscribeBusMasterOn(busId: number, listener: (isMuted: boolean) => void): () => void;
}
