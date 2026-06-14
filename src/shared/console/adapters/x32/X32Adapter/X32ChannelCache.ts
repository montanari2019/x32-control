import type { Channel } from '@features/busMix/types/Channel';
import type { CachedChannelStructure } from '@features/busMix/services/ChannelStructureCache';
import { channelStructureCache } from '@features/busMix/services/ChannelStructureCache';
import { x32RawToDb } from '@shared/utils/faderDb';
import { getX32SourceDefinition, X32SourceDefinition } from '../X32SourceDefinitions';
import { X32NodeClient } from './X32NodeClient';
import {
  parseNodeFloat01,
  parseNodeInt,
  sanitizeNodeValue,
  two,
} from './x32OscValueUtils';

export class X32ChannelCache {
  constructor(private readonly nodeClient: X32NodeClient) {}

  load(consoleIp: string): Promise<CachedChannelStructure[] | null> {
    return channelStructureCache.load(consoleIp);
  }

  createChannelFromNodeValues(
    source: X32SourceDefinition,
    sourceNumber: number,
    bus: number,
    config: string[],
    mix: string[],
  ): Channel {
    const number = source.absoluteOffset + sourceNumber;
    const label = `${source.labelPrefix} ${sourceNumber.toString().padStart(2, '0')}`;
    const levelOffset = source.mixBusOffsetBase + (bus - 1) * 3;
    const onOffset = levelOffset + 1;
    const panOffset = levelOffset + 2;

    if (mix.length <= panOffset) {
      throw new Error(`/node mix response too short for ${source.nodePrefix}/${two(sourceNumber)}`);
    }

    const level = parseNodeFloat01(mix[levelOffset]);
    const pan = parseNodeFloat01(mix[panOffset], 0.5);

    return {
      id: `${source.idPrefix}-${sourceNumber}`,
      kind: source.kind,
      number,
      sourceNumber,
      label,
      name: sanitizeNodeValue(config[0] ?? '') || label,
      color: parseNodeInt(config[2], 0),
      backgroundOpacity: source.backgroundOpacity,
      meterChannelId: number,
      faderRaw: level,
      faderDb: x32RawToDb(level),
      localFaderRaw: level,
      remoteFaderRaw: level,
      isDirty: false,
      lastLocalChangeAt: 0,
      meterDbfs: -60,
      visualMeterDbfs: -60,
      level,
      signalLevel: 0,
      pan,
      on: parseNodeInt(mix[onOffset], 1) > 0,
    };
  }

  async loadDynamicChannelsFromCachedStructure(
    cachedStructure: CachedChannelStructure[],
    bus: number,
  ): Promise<Channel[]> {
    const mixes = await Promise.all(
      cachedStructure.map((channel) =>
        this.nodeClient.requestNodeValues(
          `${getX32SourceDefinition(channel.kind).nodePrefix}/${two(channel.sourceNumber)}/mix`,
        ),
      ),
    );

    return cachedStructure.map((channel, index) => {
      const source = getX32SourceDefinition(channel.kind);
      const mix = mixes[index];
      const levelOffset = source.mixBusOffsetBase + (bus - 1) * 3;
      const onOffset = levelOffset + 1;
      const panOffset = levelOffset + 2;

      if (mix.length <= panOffset) {
        throw new Error(`/node mix response too short for ${channel.id}`);
      }

      const level = parseNodeFloat01(mix[levelOffset]);
      const pan = parseNodeFloat01(mix[panOffset], 0.5);

      return {
        ...channel,
        meterChannelId: channel.number,
        faderRaw: level,
        faderDb: x32RawToDb(level),
        localFaderRaw: level,
        remoteFaderRaw: level,
        isDirty: false,
        lastLocalChangeAt: 0,
        meterDbfs: -60,
        visualMeterDbfs: -60,
        level,
        signalLevel: 0,
        pan,
        on: parseNodeInt(mix[onOffset], 1) > 0,
      };
    });
  }

  saveChannelStructure(consoleIp: string, channels: Channel[]): void {
    const cachedStructure: CachedChannelStructure[] = channels.map((channel) => ({
      id: channel.id,
      kind: channel.kind,
      number: channel.number,
      sourceNumber: channel.sourceNumber,
      label: channel.label,
      name: channel.name,
      color: typeof channel.color === 'number' ? channel.color : 0,
      backgroundOpacity: channel.backgroundOpacity,
      meterChannelId: channel.meterChannelId,
    }));

    channelStructureCache.save(consoleIp, cachedStructure).catch(() => undefined);
  }
}
