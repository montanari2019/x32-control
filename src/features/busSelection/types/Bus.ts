import { X32ChannelColor } from '@shared/x32/channelColor';

export type Bus = {
  number: number;
  label: string;
  name: string;
  color?: X32ChannelColor | number;
  linkedBusNumber?: number;
  isStereoLinked?: boolean;
  rawNames?: {
    left?: string;
    right?: string;
  };
};
