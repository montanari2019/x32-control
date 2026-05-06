import { isMockConsoleIp, mockMixerProvider } from '@shared/mixer/mock/mockMixerProvider';
import { clamp } from '@shared/utils/clamp';
import { x32RawToDb } from '@shared/utils/faderDb';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { Channel, ChannelKind } from '../types/Channel';

const asString = (message: OscMessage, fallback: string): string => {
  const value = message.args[0];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const asNumber = (message: OscMessage, fallback: number): number => {
  const value = message.args[0];
  return typeof value === 'number' ? value : fallback;
};

type SourceDefinition = {
  kind: ChannelKind;
  count: number;
  labelPrefix: string;
  idPrefix: string;
  absoluteOffset: number;
  backgroundOpacity: number;
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
    getNamePath: X32Protocol.getFxReturnNamePath,
    getColorPath: X32Protocol.getFxReturnColorPath,
    getLevelPath: X32Protocol.getFxReturnBusSendLevelPath,
    getOnPath: X32Protocol.getFxReturnBusSendOnPath,
    getPanPath: X32Protocol.getFxReturnBusSendPanPath,
  },
];

export class BusMixService {
  private useMockProvider = false;

  constructor(private readonly client = new OscClient()) { }

  async connect(consoleIp: string): Promise<void> {
    this.useMockProvider = isMockConsoleIp(consoleIp);
    if (this.useMockProvider) {
      await mockMixerProvider.connect(consoleIp);
      return;
    }

    await this.client.connect(consoleIp);
    this.client.startXRemoteKeepAlive();
  }

  disconnect(): void {
    if (this.useMockProvider) {
      mockMixerProvider.disconnect();
      this.useMockProvider = false;
      return;
    }

    this.client.disconnect();
  }

  onLevel(channel: Channel, bus: number, listener: (level: number) => void): () => void {
    if (this.useMockProvider) {
      return mockMixerProvider.subscribeChannelLevel(channel.number, bus, listener);
    }

    const source = this.getSourceDefinition(channel.kind);
    return this.client.subscribe(source.getLevelPath(channel.sourceNumber, bus), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  onOn(channel: Channel, bus: number, listener: (on: boolean) => void): () => void {
    if (this.useMockProvider) {
      return () => { };
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

    const pairs = Array.from({ length: 16 }, (_, i) => ({
      left: i * 2 + 1,
      right: i * 2 + 2,
    }));

    const results = await Promise.allSettled(
      pairs.map(async ({ left, right }) => {
        const message = await this.client.request<OscMessage>(
          X32Protocol.getChannelLinkPath(left, right),
          [],
          800,
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
    return map;
  }

  async loadChannels(bus: number): Promise<Channel[]> {
    if (this.useMockProvider) {
      return mockMixerProvider.getChannels(bus);
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
              meterChannelId: source.kind === 'channel' ? sourceNumber : undefined,
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

  async setChannelFader(channel: Channel, bus: number, level: number): Promise<void> {
    if (this.useMockProvider) {
      await mockMixerProvider.setChannelFader(channel.number, bus, level);
      return;
    }

    const source = this.getSourceDefinition(channel.kind);
    await this.client.send(source.getLevelPath(channel.sourceNumber, bus), [
      { type: 'f', value: clamp(level) },
    ]);
  }

  async loadChannelFaders(
    bus: number,
    existingChannels?: Channel[],
  ): Promise<{ channel: Channel; level: number }[]> {
    if (this.useMockProvider) {
      const channels = await mockMixerProvider.getChannels(bus);
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
    if (this.useMockProvider) {
      await mockMixerProvider.setChannelOn(channel.number, bus, on);
      return;
    }

    const source = this.getSourceDefinition(channel.kind);
    await this.client.send(source.getOnPath(channel.sourceNumber, bus), [on ? 1 : 0]);
  }

  async setChannelPan(channel: Channel, bus: number, pan: number): Promise<void> {
    if (this.useMockProvider) {
      await mockMixerProvider.setChannelPan(channel.number, bus, pan);
      return;
    }

    const source = this.getSourceDefinition(channel.kind);
    await this.client.send(source.getPanPath(channel.sourceNumber, bus), [
      { type: 'f', value: clamp(pan, 0, 1) },
    ]);
  }

  private getSourceDefinition(kind: ChannelKind): SourceDefinition {
    const source = SOURCE_DEFINITIONS.find((item) => item.kind === kind);
    if (!source) {
      throw new Error(`Unsupported bus mix source: ${kind}`);
    }

    return source;
  }

  private async safeRequestString(path: string, fallback: string): Promise<string> {
    try {
      return asString(await this.client.request<OscMessage>(path, [], 1000), fallback);
    } catch {
      return fallback;
    }
  }

  private async safeRequestColor(path: string): Promise<number> {
    try {
      return asNumber(await this.client.request<OscMessage>(path, [], 1000), 0);
    } catch {
      return 0;
    }
  }

  private async safeRequestLevel(path: string): Promise<number> {
    try {
      return clamp(asNumber(await this.client.request<OscMessage>(path, [], 1000), 0));
    } catch {
      return 0;
    }
  }

  private async safeRequestOn(path: string): Promise<boolean> {
    try {
      return asNumber(await this.client.request<OscMessage>(path, [], 1000), 1) > 0;
    } catch {
      return true;
    }
  }

  private async safeRequestPan(path: string): Promise<number> {
    try {
      return clamp(asNumber(await this.client.request<OscMessage>(path, [], 1000), 0.5), 0, 1);
    } catch {
      return 0.5;
    }
  }
}
