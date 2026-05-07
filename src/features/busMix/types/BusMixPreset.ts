import { ChannelKind } from './Channel';

export type BusMixPresetChannel = {
  channelId: number;
  channelName?: string;
  channelLabel?: string;
  kind: ChannelKind;
  sourceNumber: number;
  raw: number;
  db: number | null;
};

export type BusMixPreset = {
  id: string;
  name: string;
  consoleId: string;
  busId: number;
  createdAt: string;
  updatedAt: string;
  channels: BusMixPresetChannel[];
};
