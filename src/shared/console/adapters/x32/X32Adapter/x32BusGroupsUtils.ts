import type { McaAssignedChannel } from '@features/busGroups/types/busGroups.types';

export const isChannelInDca = (dcaBitmask: number, dcaIndex: number): boolean => {
  const divisor = 2 ** (dcaIndex - 1);
  return Math.floor(dcaBitmask / divisor) % 2 === 1;
};

export const buildAssignedChannelsFromIds = (channelIds: number[]): McaAssignedChannel[] =>
  channelIds.map((channelId) => ({
    channelId,
    channelName: `CH ${channelId.toString().padStart(2, '0')}`,
    channelLabel: `CH ${channelId.toString().padStart(2, '0')}`,
    channelType: 'channel',
  }));

