import type { Channel } from '@features/busMix/types/Channel';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { clamp } from '@shared/utils/clamp';
import { x32RawToDb } from '@shared/utils/faderDb';
import { X32AdapterContext } from './X32AdapterContext';
import {
  EXPECTED_CHANNEL_COUNT,
  REQUEST_RETRIES,
} from './X32AdapterConstants';
import { X32NodeClient } from './X32NodeClient';
import {
  getX32SourceDefinition,
  X32_SOURCE_DEFINITIONS,
} from '../X32SourceDefinitions';
import { X32ChannelCache } from './X32ChannelCache';
import {
  asNumber,
  asString,
  two,
} from './x32OscValueUtils';
import type { ConsoleChannelRef } from '../../../types';

const CHANNEL_LINK_MAP_CACHE = new Map<string, Map<number, number>>();

export class X32BusMixAdapter {
  private readonly channelCache: X32ChannelCache;

  constructor(
    private readonly context: X32AdapterContext,
    private readonly nodeClient: X32NodeClient,
  ) {
    this.channelCache = new X32ChannelCache(nodeClient);
  }

  async getChannels(busId: number): Promise<Channel[]> {
    return this.loadChannelsWithFallback(busId);
  }

  async loadChannels(busId: number): Promise<Channel[]> {
    const groups = await Promise.all(
      X32_SOURCE_DEFINITIONS.map((source) =>
        Promise.all(
          Array.from({ length: source.count }, async (_, index) => {
            const sourceNumber = index + 1;
            const number = source.absoluteOffset + sourceNumber;
            const label = `${source.labelPrefix} ${sourceNumber.toString().padStart(2, '0')}`;
            const [name, color, level, on, pan] = await Promise.all([
              this.safeRequestString(source.getNamePath(sourceNumber), label),
              this.safeRequestColor(source.getColorPath(sourceNumber)),
              this.safeRequestLevel(source.getLevelPath(sourceNumber, busId)),
              this.safeRequestOn(source.getOnPath(sourceNumber, busId)),
              this.safeRequestPan(source.getPanPath(sourceNumber, busId)),
            ]);

            return {
              id: `${source.idPrefix}-${sourceNumber}`,
              kind: source.kind,
              number,
              sourceNumber,
              label,
              name,
              color,
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
              on,
            };
          }),
        ),
      ),
    );

    return groups.flat();
  }

  async loadChannelsBulk(busId: number): Promise<Channel[]> {
    const groups = await Promise.all(
      X32_SOURCE_DEFINITIONS.map(async (source) => {
        const [configs, mixes] = await Promise.all([
          Promise.all(
            Array.from({ length: source.count }, (_, index) =>
              this.nodeClient.requestNodeValues(`${source.nodePrefix}/${two(index + 1)}/config`),
            ),
          ),
          Promise.all(
            Array.from({ length: source.count }, (_, index) =>
              this.nodeClient.requestNodeValues(`${source.nodePrefix}/${two(index + 1)}/mix`),
            ),
          ),
        ]);

        return configs.map((config, index) =>
          this.channelCache.createChannelFromNodeValues(
            source,
            index + 1,
            busId,
            config,
            mixes[index],
          ),
        );
      }),
    );

    return groups.flat();
  }

  async loadChannelsWithFallback(busId: number): Promise<Channel[]> {
    try {
      const channels = await this.loadChannelsBulk(busId);
      if (channels.length === EXPECTED_CHANNEL_COUNT) {
        return channels;
      }
    } catch {
      // Firmware without /node support falls back to the original per-path loader.
    }

    return this.loadChannels(busId);
  }

  async loadChannelsWithCache(consoleIp: string, busId: number): Promise<Channel[]> {
    const cachedStructure = await this.channelCache.load(consoleIp);
    if (cachedStructure?.length === EXPECTED_CHANNEL_COUNT) {
      try {
        return await this.channelCache.loadDynamicChannelsFromCachedStructure(
          cachedStructure,
          busId,
        );
      } catch {
        const channels = await this.loadChannelsWithFallback(busId);
        this.channelCache.saveChannelStructure(consoleIp, channels);
        return channels;
      }
    }

    const channels = await this.loadChannelsWithFallback(busId);
    this.channelCache.saveChannelStructure(consoleIp, channels);
    return channels;
  }

  async fetchChannelLinkMap(): Promise<Map<number, number>> {
    const cacheKey = this.context.connectedConsoleIp ?? this.context.endpoint.ip;
    const cachedMap = cacheKey ? CHANNEL_LINK_MAP_CACHE.get(cacheKey) : undefined;
    if (cachedMap) {
      return new Map(cachedMap);
    }

    const pairs = Array.from({ length: 16 }, (_, i) => ({
      left: i * 2 + 1,
      right: i * 2 + 2,
    }));

    const results = await Promise.allSettled(
      pairs.map(async ({ left, right }) => {
        const message = await this.nodeClient.requestMessage(
          X32Protocol.getChannelLinkPath(left, right),
          800,
          REQUEST_RETRIES,
        );
        return { left, right, linked: asNumber(message, 0) > 0 };
      }),
    );

    const map = new Map<number, number>();
    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.linked) {
        map.set(result.value.left, result.value.right);
        map.set(result.value.right, result.value.left);
      }
    }

    if (cacheKey) {
      CHANNEL_LINK_MAP_CACHE.set(cacheKey, new Map(map));
    }

    return map;
  }

  async loadChannelFaders(
    busId: number,
    existingChannels?: Channel[],
  ): Promise<{ channel: Channel; level: number }[]> {
    const channels =
      existingChannels && existingChannels.length > 0
        ? existingChannels
        : await this.loadChannels(busId);

    return Promise.all(
      channels.map(async (channel) => {
        const source = getX32SourceDefinition(channel.kind);
        const level = await this.safeRequestLevel(source.getLevelPath(channel.sourceNumber, busId));
        return { channel, level };
      }),
    );
  }

  async setChannelFader(channel: ConsoleChannelRef, busId: number, value: number): Promise<void> {
    const source = getX32SourceDefinition(channel.kind);
    await this.context.client.send(source.getLevelPath(channel.sourceNumber, busId), [
      { type: 'f', value: clamp(value) },
    ]);
  }

  async setChannelOn(channel: ConsoleChannelRef, busId: number, isOn: boolean): Promise<void> {
    const source = getX32SourceDefinition(channel.kind);
    await this.context.client.send(source.getOnPath(channel.sourceNumber, busId), [
      isOn ? 1 : 0,
    ]);
  }

  async setChannelPan(channel: ConsoleChannelRef, busId: number, pan: number): Promise<void> {
    const source = getX32SourceDefinition(channel.kind);
    await this.context.client.send(source.getPanPath(channel.sourceNumber, busId), [
      { type: 'f', value: clamp(pan, 0, 1) },
    ]);
  }

  subscribeChannelLevel(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): () => void {
    const source = getX32SourceDefinition(channel.kind);
    return this.context.client.subscribe(source.getLevelPath(channel.sourceNumber, busId), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  subscribeChannelOn(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: boolean) => void,
  ): () => void {
    const source = getX32SourceDefinition(channel.kind);
    return this.context.client.subscribe(source.getOnPath(channel.sourceNumber, busId), (message) => {
      listener(asNumber(message, 1) > 0);
    });
  }

  subscribeChannelPan(
    channel: ConsoleChannelRef,
    busId: number,
    listener: (value: number) => void,
  ): () => void {
    const source = getX32SourceDefinition(channel.kind);
    return this.context.client.subscribe(source.getPanPath(channel.sourceNumber, busId), (message) => {
      listener(clamp(asNumber(message, 0.5), 0, 1));
    });
  }

  private async safeRequestString(path: string, fallback: string): Promise<string> {
    try {
      return asString(await this.nodeClient.requestMessage(path), fallback);
    } catch {
      return fallback;
    }
  }

  private async safeRequestColor(path: string): Promise<number> {
    try {
      return asNumber(await this.nodeClient.requestMessage(path), 0);
    } catch {
      return 0;
    }
  }

  private async safeRequestLevel(path: string): Promise<number> {
    try {
      return clamp(asNumber(await this.nodeClient.requestMessage(path), 0));
    } catch {
      return 0;
    }
  }

  private async safeRequestOn(path: string): Promise<boolean> {
    try {
      return asNumber(await this.nodeClient.requestMessage(path), 1) > 0;
    } catch {
      return true;
    }
  }

  private async safeRequestPan(path: string): Promise<number> {
    try {
      return clamp(asNumber(await this.nodeClient.requestMessage(path), 0.5), 0, 1);
    } catch {
      return 0.5;
    }
  }
}
