import { X32ChannelColor } from '@shared/x32/channelColor';

export type Channel = {
  id: string;
  number: number;
  label: string;
  name: string;
  color?: X32ChannelColor | number;
  level: number;
  signalLevel: number;
  pan: number;
  on: boolean;
};
