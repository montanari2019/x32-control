import { MixerControlProvider } from '@shared/mixer/MixerControlProvider';
import {
  getMockProviderForIp,
  isMockConsoleIp,
  mockMixerProvider,
} from '@shared/mixer/mock/mockMixerProvider';
import { clamp } from '@shared/utils/clamp';
import { x32RawToDb } from '@shared/utils/faderDb';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { acquireSharedOscClient } from '@shared/osc/SharedOscClient';
import type { SharedOscClientLease } from '@shared/osc/SharedOscClient';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { Channel, ChannelKind } from '../types/Channel';
import { CachedChannelStructure, channelStructureCache } from './ChannelStructureCache';

const REQUEST_TIMEOUT_MS = 600;
const REQUEST_RETRIES = 1;
const CHANNEL_LINK_MAP_CACHE = new Map<string, Map<number, number>>();
const EXPECTED_CHANNEL_COUNT = 48;

const two = (value: number): string => value.toString().padStart(2, '0');

const asString = (message: OscMessage, fallback: string): string => {
  const value = message.args[0];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const asNumber = (message: OscMessage, fallback: number): number => {
  const value = message.args[0];
  return typeof value === 'number' ? value : fallback;
};

const sanitizeNodeValue = (value: string): string => value.replace(/^"|"$/g, '').trim();

const splitNodeValueString = (value: string): string[] => {
  const values: string[] = [];
  let current = '';
  let isQuoted = false;

  for (const char of value.trim()) {
    if (char === '"') {
      isQuoted = !isQuoted;
      continue;
    }

    if (/\s/.test(char) && !isQuoted) {
      if (current.length > 0) {
        values.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    values.push(current);
  }

  return values;
};

const oscArgToNodeValue = (value: OscMessage['args'][number]): string | undefined => {
  if (typeof value === 'string') {
    return sanitizeNodeValue(value);
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }

  return undefined;
};

const normalizeNodePath = (value: string): string => value.replace(/^\//, '');

const parseNodeResponseValues = (message: OscMessage, nodePath: string): string[] => {
  if (message.args.length === 0) {
    return [];
  }

  const firstValue = oscArgToNodeValue(message.args[0]);
  const hasNodeEcho =
    firstValue !== undefined &&
    normalizeNodePath(firstValue) === normalizeNodePath(nodePath) &&
    message.args.length > 1;
  const valueArgs = hasNodeEcho ? message.args.slice(1) : message.args;

  if (valueArgs.length === 1 && typeof valueArgs[0] === 'string') {
    return splitNodeValueString(valueArgs[0]);
  }

  return valueArgs.map(oscArgToNodeValue).filter((value): value is string => value !== undefined);
};

const parseNodeFloat01 = (value: string | undefined, fallback = 0): number => {
  const parsed = Number.parseFloat(value ?? '');
  return Number.isFinite(parsed) ? clamp(parsed, 0, 1) : fallback;
};

const parseNodeInt = (value: string | undefined, fallback = 0): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

type NodeResponseMode = 'echo' | 'noEcho';

type SourceDefinition = {
  kind: ChannelKind;
  count: number;
  labelPrefix: string;
  idPrefix: string;
  absoluteOffset: number;
  backgroundOpacity: number;
  nodePrefix: string;
  mixBusOffsetBase: number;
  getNamePath: (sourceNumber: number) => string;
  getColorPath: (sourceNumber: number) => string;
  getLevelPath: (sourceNumber: number, bus: number) => string;
  getOnPath: (sourceNumber: number, bus: number) => string;
  getPanPath: (sourceNumber: number, bus: number) => string;
};

const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    kind: 'channel',
    count: 32,
    labelPrefix: 'CH',
    idPrefix: 'ch',
    absoluteOffset: 0,
    backgroundOpacity: 0.2,
    nodePrefix: 'ch',
    mixBusOffsetBase: 4,
    getNamePath: X32Protocol.getChannelNamePath,
    getColorPath: X32Protocol.getChannelColorPath,
    getLevelPath: X32Protocol.getBusSendLevelPath,
    getOnPath: X32Protocol.getBusSendOnPath,
    getPanPath: X32Protocol.getBusSendPanPath,
  },
  {
    kind: 'aux',
    count: 8,
    labelPrefix: 'AUX',
    idPrefix: 'aux',
    absoluteOffset: 32,
    backgroundOpacity: 0.2,
    nodePrefix: 'auxin',
    mixBusOffsetBase: 3,
    getNamePath: X32Protocol.getAuxInNamePath,
    getColorPath: X32Protocol.getAuxInColorPath,
    getLevelPath: X32Protocol.getAuxInBusSendLevelPath,
    getOnPath: X32Protocol.getAuxInBusSendOnPath,
    getPanPath: X32Protocol.getAuxInBusSendPanPath,
  },
  {
    kind: 'fxReturn',
    count: 8,
    labelPrefix: 'FX',
    idPrefix: 'fxrtn',
    absoluteOffset: 40,
    backgroundOpacity: 0.4,
    nodePrefix: 'fxrtn',
    mixBusOffsetBase: 3,
    getNamePath: X32Protocol.getFxReturnNamePath,
    getColorPath: X32Protocol.getFxReturnColorPath,
    getLevelPath: X32Protocol.getFxReturnBusSendLevelPath,
    getOnPath: X32Protocol.getFxReturnBusSendOnPath,
    getPanPath: X32Protocol.getFxReturnBusSendPanPath,
  },
];

export class BusMixService {
  private client: OscClient;
  private connectedConsoleIp?: string;
  private sharedLease?: SharedOscClientLease;
  private useMockProvider = false;
  private mockProvider: MixerControlProvider = mockMixerProvider;
  private nodeRequestChain: Promise<void> = Promise.resolve();
  private nodeResponseMode?: NodeResponseMode;
  private nodeResponseModePromise?: Promise<NodeResponseMode>;

  constructor(client = new OscClient()) {
    this.client = client;
  }

  async connect(consoleIp: string): Promise<void> {
    if (this.useMockProvider) {
      this.mockProvider.disconnect();
    }

    this.useMockProvider = isMockConsoleIp(consoleIp);
    if (this.useMockProvider) {
      this.client.stopXRemoteKeepAlive();
      this.sharedLease?.release();
      this.sharedLease = undefined;
      this.connectedConsoleIp = undefined;
      this.mockProvider = getMockProviderForIp(consoleIp);
      await this.mockProvider.connect(consoleIp);
      return;
    }

    if (this.sharedLease && this.connectedConsoleIp === consoleIp) {
      return;
    }

    this.sharedLease?.release();
    this.sharedLease = undefined;
    this.connectedConsoleIp = undefined;
    this.sharedLease = await acquireSharedOscClient(consoleIp);
    this.connectedConsoleIp = consoleIp;
    this.client = this.sharedLease.client;
    this.client.startXRemoteKeepAlive();
  }

  disconnect(): void {
    if (this.useMockProvider) {
      this.mockProvider.disconnect();
      this.useMockProvider = false;
      this.connectedConsoleIp = undefined;
      return;
    }

    this.client.stopXRemoteKeepAlive();
    this.sharedLease?.release();
    this.sharedLease = undefined;
    this.connectedConsoleIp = undefined;
  }

  onLevel(channel: Channel, bus: number, listener: (level: number) => void): () => void {
    if (this.useMockProvider) {
      return this.mockProvider.subscribeChannelLevel(channel.number, bus, listener);
    }

    const source = this.getSourceDefinition(channel.kind);
    return this.client.subscribe(source.getLevelPath(channel.sourceNumber, bus), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  onOn(channel: Channel, bus: number, listener: (on: boolean) => void): () => void {
    if (this.useMockProvider) {
      return () => {};
    }

    const source = this.getSourceDefinition(channel.kind);
    return this.client.subscribe(source.getOnPath(channel.sourceNumber, bus), (message) => {
      listener(asNumber(message, 1) > 0);
    });
  }

  async fetchChannelLinkMap(): Promise<Map<number, number>> {
    if (this.useMockProvider) {
      return new Map();
    }

    const cacheKey = this.connectedConsoleIp;
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
        const message = await this.requestMessage(
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

  async loadChannels(bus: number): Promise<Channel[]> {
    if (this.useMockProvider) {
      return this.mockProvider.getChannels(bus);
    }

    const groups = await Promise.all(
      SOURCE_DEFINITIONS.map((source) =>
        Promise.all(
          Array.from({ length: source.count }, async (_, index) => {
            const sourceNumber = index + 1;
            const number = source.absoluteOffset + sourceNumber;
            const label = `${source.labelPrefix} ${sourceNumber.toString().padStart(2, '0')}`;
            const [name, color, level, on, pan] = await Promise.all([
              this.safeRequestString(source.getNamePath(sourceNumber), label),
              this.safeRequestColor(source.getColorPath(sourceNumber)),
              this.safeRequestLevel(source.getLevelPath(sourceNumber, bus)),
              this.safeRequestOn(source.getOnPath(sourceNumber, bus)),
              this.safeRequestPan(source.getPanPath(sourceNumber, bus)),
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

  async loadChannelsBulk(bus: number): Promise<Channel[]> {
    if (this.useMockProvider) {
      return this.mockProvider.getChannels(bus);
    }

    const groups = await Promise.all(
      SOURCE_DEFINITIONS.map(async (source) => {
        const [configs, mixes] = await Promise.all([
          Promise.all(
            Array.from({ length: source.count }, (_, index) =>
              this.requestNodeValues(`${source.nodePrefix}/${two(index + 1)}/config`),
            ),
          ),
          Promise.all(
            Array.from({ length: source.count }, (_, index) =>
              this.requestNodeValues(`${source.nodePrefix}/${two(index + 1)}/mix`),
            ),
          ),
        ]);

        return configs.map((config, index) =>
          this.createChannelFromNodeValues(source, index + 1, bus, config, mixes[index]),
        );
      }),
    );

    return groups.flat();
  }

  async loadChannelsWithFallback(bus: number): Promise<Channel[]> {
    try {
      const channels = await this.loadChannelsBulk(bus);
      if (channels.length === EXPECTED_CHANNEL_COUNT) {
        return channels;
      }
    } catch {
      // Firmware without /node support falls back to the original per-path loader.
    }

    return this.loadChannels(bus);
  }

  async loadChannelsWithCache(consoleIp: string, bus: number): Promise<Channel[]> {
    if (this.useMockProvider) {
      return this.loadChannelsWithFallback(bus);
    }

    const cachedStructure = await channelStructureCache.load(consoleIp);
    if (cachedStructure?.length === EXPECTED_CHANNEL_COUNT) {
      try {
        return await this.loadDynamicChannelsFromCachedStructure(cachedStructure, bus);
      } catch {
        const channels = await this.loadChannelsWithFallback(bus);
        this.saveChannelStructure(consoleIp, channels);
        return channels;
      }
    }

    const channels = await this.loadChannelsWithFallback(bus);
    this.saveChannelStructure(consoleIp, channels);
    return channels;
  }

  async setChannelFader(channel: Channel, bus: number, level: number): Promise<void> {
    await this.setChannelFaderInBus(channel, bus, level);
  }

  async setChannelFaderInBus(channel: Channel, busId: number, rawValue: number): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setChannelFader(channel.number, busId, rawValue);
      return;
    }

    await this.client.send(this.getLevelPath(channel, busId), [
      { type: 'f', value: clamp(rawValue) },
    ]);
  }

  async loadChannelFaders(
    bus: number,
    existingChannels?: Channel[],
  ): Promise<{ channel: Channel; level: number }[]> {
    if (this.useMockProvider) {
      const channels = await this.mockProvider.getChannels(bus);
      return channels.map((channel) => ({ channel, level: channel.faderRaw }));
    }

    const channels =
      existingChannels && existingChannels.length > 0
        ? existingChannels
        : await this.loadChannels(bus);

    return Promise.all(
      channels.map(async (channel) => {
        const source = this.getSourceDefinition(channel.kind);
        const level = await this.safeRequestLevel(source.getLevelPath(channel.sourceNumber, bus));
        return { channel, level };
      }),
    );
  }

  async setChannelOn(channel: Channel, bus: number, on: boolean): Promise<void> {
    await this.setChannelOnInBus(channel, bus, on);
  }

  async setChannelOnInBus(channel: Channel, busId: number, isOn: boolean): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setChannelOn(channel.number, busId, isOn);
      return;
    }

    await this.client.send(this.getOnPath(channel, busId), [isOn ? 1 : 0]);
  }

  async setChannelPan(channel: Channel, bus: number, pan: number): Promise<void> {
    if (this.useMockProvider) {
      await this.mockProvider.setChannelPan(channel.number, bus, pan);
      return;
    }

    const source = this.getSourceDefinition(channel.kind);
    await this.client.send(source.getPanPath(channel.sourceNumber, bus), [
      { type: 'f', value: clamp(pan, 0, 1) },
    ]);
  }

  private createChannelFromNodeValues(
    source: SourceDefinition,
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

  private async loadDynamicChannelsFromCachedStructure(
    cachedStructure: CachedChannelStructure[],
    bus: number,
  ): Promise<Channel[]> {
    const mixes = await Promise.all(
      cachedStructure.map((channel) =>
        this.requestNodeValues(
          `${this.getSourceDefinition(channel.kind).nodePrefix}/${two(channel.sourceNumber)}/mix`,
        ),
      ),
    );

    return cachedStructure.map((channel, index) => {
      const source = this.getSourceDefinition(channel.kind);
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

  private saveChannelStructure(consoleIp: string, channels: Channel[]): void {
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

  private getSourceDefinition(kind: ChannelKind): SourceDefinition {
    const source = SOURCE_DEFINITIONS.find((item) => item.kind === kind);
    if (!source) {
      throw new Error(`Unsupported bus mix source: ${kind}`);
    }

    return source;
  }

  private getLevelPath(channel: Channel, busId: number): string {
    return this.getSourceDefinition(channel.kind).getLevelPath(channel.sourceNumber, busId);
  }

  private getOnPath(channel: Channel, busId: number): string {
    return this.getSourceDefinition(channel.kind).getOnPath(channel.sourceNumber, busId);
  }

  private async safeRequestString(path: string, fallback: string): Promise<string> {
    try {
      return asString(await this.requestMessage(path), fallback);
    } catch {
      return fallback;
    }
  }

  private async safeRequestColor(path: string): Promise<number> {
    try {
      return asNumber(await this.requestMessage(path), 0);
    } catch {
      return 0;
    }
  }

  private async safeRequestLevel(path: string): Promise<number> {
    try {
      return clamp(asNumber(await this.requestMessage(path), 0));
    } catch {
      return 0;
    }
  }

  private async safeRequestOn(path: string): Promise<boolean> {
    try {
      return asNumber(await this.requestMessage(path), 1) > 0;
    } catch {
      return true;
    }
  }

  private async safeRequestPan(path: string): Promise<number> {
    try {
      return clamp(asNumber(await this.requestMessage(path), 0.5), 0, 1);
    } catch {
      return 0.5;
    }
  }

  private async requestNodeValues(
    nodePath: string,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retries = REQUEST_RETRIES,
  ): Promise<string[]> {
    if (this.useMockProvider) {
      return [];
    }

    const responseMode = await this.getNodeResponseMode(timeoutMs);
    if (responseMode === 'echo') {
      return this.requestNodeValuesByEcho(nodePath, timeoutMs, retries);
    }

    const request = (): Promise<string[]> =>
      this.requestNodeValuesDirect(nodePath, timeoutMs, retries);
    const nextRequest = this.nodeRequestChain.then(request, request);
    this.nodeRequestChain = nextRequest.then(
      () => undefined,
      () => undefined,
    );
    return nextRequest;
  }

  private async getNodeResponseMode(timeoutMs: number): Promise<NodeResponseMode> {
    if (this.nodeResponseMode) {
      return this.nodeResponseMode;
    }

    if (!this.nodeResponseModePromise) {
      this.nodeResponseModePromise = this.detectNodeResponseMode(timeoutMs).then(
        (mode) => {
          this.nodeResponseMode = mode;
          this.nodeResponseModePromise = undefined;
          return mode;
        },
        (error) => {
          this.nodeResponseModePromise = undefined;
          throw error;
        },
      );
    }

    return this.nodeResponseModePromise;
  }

  private async detectNodeResponseMode(timeoutMs: number): Promise<NodeResponseMode> {
    const probePath = 'ch/01/config';
    const message = await this.client.request<OscMessage>('/node', [probePath], timeoutMs);
    const firstValue = oscArgToNodeValue(message.args[0]);
    return firstValue !== undefined &&
      normalizeNodePath(firstValue) === probePath &&
      message.args.length > 1
      ? 'echo'
      : 'noEcho';
  }

  private async requestNodeValuesByEcho(
    nodePath: string,
    timeoutMs: number,
    retries: number,
  ): Promise<string[]> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await new Promise<string[]>((resolve, reject) => {
          let isSettled = false;
          let timeout: ReturnType<typeof setTimeout> | undefined;
          let unsubscribe = (): void => undefined;
          const cleanup = (): void => {
            if (timeout) {
              clearTimeout(timeout);
            }
            unsubscribe();
          };
          const settleResolve = (values: string[]): void => {
            if (isSettled) {
              return;
            }
            isSettled = true;
            cleanup();
            resolve(values);
          };
          const settleReject = (error: unknown): void => {
            if (isSettled) {
              return;
            }
            isSettled = true;
            cleanup();
            reject(error);
          };

          timeout = setTimeout(() => {
            settleReject(new Error(`/node timeout for ${nodePath}`));
          }, timeoutMs);

          unsubscribe = this.client.subscribe('/node', (message) => {
            const firstValue = oscArgToNodeValue(message.args[0]);
            if (
              firstValue === undefined ||
              normalizeNodePath(firstValue) !== normalizeNodePath(nodePath)
            ) {
              return;
            }

            const values = parseNodeResponseValues(message, nodePath);
            if (values.length === 0) {
              settleReject(new Error(`Empty /node response for ${nodePath}`));
              return;
            }

            settleResolve(values);
          });

          this.client.send('/node', [nodePath]).catch(settleReject);
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`/node request failed for ${nodePath}`);
  }

  private async requestNodeValuesDirect(
    nodePath: string,
    timeoutMs: number,
    retries: number,
  ): Promise<string[]> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const message = await this.client.request<OscMessage>('/node', [nodePath], timeoutMs);
        const values = parseNodeResponseValues(message, nodePath);
        if (values.length > 0) {
          return values;
        }

        throw new Error(`Empty /node response for ${nodePath}`);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`/node request failed for ${nodePath}`);
  }

  private async requestMessage(
    path: string,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retries = REQUEST_RETRIES,
  ): Promise<OscMessage> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.client.request<OscMessage>(path, [], timeoutMs);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`Request failed for ${path}`);
  }
}
