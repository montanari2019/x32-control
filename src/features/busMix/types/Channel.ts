import { X32ChannelColor } from '@shared/x32/channelColor';
import { X32FaderDb } from '@shared/utils/faderDb';

export type ChannelKind = 'channel' | 'aux' | 'fxReturn';

export type Channel = {
  id: string;
  kind: ChannelKind;
  number: number;
  sourceNumber: number;
  label: string;
  name: string;
  color?: X32ChannelColor | number;
  backgroundOpacity: number;
  meterChannelId?: number;
  faderRaw: number;
  faderDb: X32FaderDb;
  localFaderRaw: number;
  remoteFaderRaw: number;
  isDirty: boolean;
  lastLocalChangeAt: number;
  meterDbfs: number;
  visualMeterDbfs: number;
  level: number;
  signalLevel: number;
  pan: number;
  on: boolean;
};
