import { x32RawToDb } from '@shared/utils/faderDb';
import { Channel } from '../types/Channel';

type LinkedUpdateOptions = {
  linkMap: Map<number, number>;
};

type LocalLevelUpdateOptions = LinkedUpdateOptions & {
  markDirty: boolean;
  now: number;
};

type RemoteLevelUpdateOptions = LinkedUpdateOptions & {
  localProtectionWindowMs: number;
  now: number;
  pendingLocalChangeAt?: Map<number, number>;
};

export const getLinkedPeerNumber = (
  channelNumber: number,
  linkMap: Map<number, number>,
): number | undefined => linkMap.get(channelNumber);

const isTargetOrLinkedPeer = (
  channelNumber: number,
  targetNumber: number,
  linkedPeerNumber: number | undefined,
): boolean => channelNumber === targetNumber || channelNumber === linkedPeerNumber;

export const applyLinkedLocalLevelUpdate = (
  channels: Channel[],
  channelNumber: number,
  level: number,
  options: LocalLevelUpdateOptions,
): Channel[] => {
  const linkedPeerNumber = getLinkedPeerNumber(channelNumber, options.linkMap);
  const faderDb = x32RawToDb(level);

  return channels.map((channel) => {
    if (!isTargetOrLinkedPeer(channel.number, channelNumber, linkedPeerNumber)) {
      return channel;
    }

    return {
      ...channel,
      faderRaw: level,
      faderDb,
      localFaderRaw: level,
      level,
      isDirty: options.markDirty,
      lastLocalChangeAt: options.now,
    };
  });
};

export const applyLinkedRemoteLevelUpdate = (
  channels: Channel[],
  channelNumber: number,
  level: number,
  options: RemoteLevelUpdateOptions,
): Channel[] => {
  const linkedPeerNumber = getLinkedPeerNumber(channelNumber, options.linkMap);
  const faderDb = x32RawToDb(level);

  return channels.map((channel) => {
    if (!isTargetOrLinkedPeer(channel.number, channelNumber, linkedPeerNumber)) {
      return channel;
    }

    const lastLocalChangeAt = Math.max(
      channel.lastLocalChangeAt,
      options.pendingLocalChangeAt?.get(channel.number) ?? 0,
    );
    const recentlyChanged = options.now - lastLocalChangeAt < options.localProtectionWindowMs;

    if (recentlyChanged) {
      return {
        ...channel,
        faderRaw: channel.localFaderRaw,
        remoteFaderRaw: level,
      };
    }

    return {
      ...channel,
      faderRaw: level,
      faderDb,
      localFaderRaw: level,
      remoteFaderRaw: level,
      level,
      isDirty: false,
    };
  });
};

export const applyLinkedOnUpdate = (
  channels: Channel[],
  channelNumber: number,
  on: boolean,
  options: LinkedUpdateOptions,
): Channel[] => {
  const linkedPeerNumber = getLinkedPeerNumber(channelNumber, options.linkMap);

  return channels.map((channel) =>
    isTargetOrLinkedPeer(channel.number, channelNumber, linkedPeerNumber)
      ? { ...channel, on }
      : channel,
  );
};

export const applyPanUpdate = (
  channels: Channel[],
  channelNumber: number,
  pan: number,
): Channel[] =>
  channels.map((channel) => (channel.number === channelNumber ? { ...channel, pan } : channel));
