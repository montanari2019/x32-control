import { colors } from '@shared/theme/colors';
import { clamp } from '@shared/utils/clamp';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { Channel } from '../types/Channel';

const x32ColorMap: Record<number, string> = {
  0: colors.neutralFader,
  1: '#E23B3B',
  2: '#38B85E',
  3: '#F0D34A',
  4: '#397BE8',
  5: '#D34FEA',
  6: '#44C7D8',
  7: '#F4F7FA',
  8: '#C23A3A',
  9: '#2E9650',
  10: '#C9B63A',
  11: '#3267BE',
  12: '#A842BD',
  13: '#369FAC',
  14: '#9AA7B6',
  15: '#2B3645',
};

const asString = (message: OscMessage, fallback: string): string => {
  const value = message.args[0];
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : fallback;
};

const asNumber = (message: OscMessage, fallback: number): number => {
  const value = message.args[0];
  return typeof value === 'number' ? value : fallback;
};

export class BusMixService {
  constructor(private readonly client = new OscClient()) {}

  async connect(consoleIp: string): Promise<void> {
    await this.client.connect(consoleIp);
    this.client.startXRemoteKeepAlive();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  onLevel(
    bus: number,
    channel: number,
    listener: (level: number) => void,
  ): () => void {
    return this.client.subscribe(
      X32Protocol.getBusSendLevelPath(channel, bus),
      (message) => {
        listener(clamp(asNumber(message, 0)));
      },
    );
  }

  async loadChannels(bus: number): Promise<Channel[]> {
    return Promise.all(
      Array.from({ length: 32 }, async (_, index) => {
        const number = index + 1;
        const label = `CH ${number.toString().padStart(2, '0')}`;
        const [name, color, level, on] = await Promise.all([
          this.safeRequestString(X32Protocol.getChannelNamePath(number), label),
          this.safeRequestColor(X32Protocol.getChannelColorPath(number)),
          this.safeRequestLevel(X32Protocol.getBusSendLevelPath(number, bus)),
          this.safeRequestOn(X32Protocol.getBusSendOnPath(number, bus)),
        ]);

        return {
          id: `ch-${number}`,
          number,
          label,
          name,
          color,
          level,
          on,
        };
      }),
    );
  }

  async setBusSendLevel(
    channel: number,
    bus: number,
    level: number,
  ): Promise<void> {
    await this.client.send(X32Protocol.getBusSendLevelPath(channel, bus), [
      clamp(level),
    ]);
  }

  async setBusSendOn(channel: number, bus: number, on: boolean): Promise<void> {
    await this.client.send(X32Protocol.getBusSendOnPath(channel, bus), [
      on ? 1 : 0,
    ]);
  }

  private async safeRequestString(
    path: string,
    fallback: string,
  ): Promise<string> {
    try {
      return asString(
        await this.client.request<OscMessage>(path, [], 1000),
        fallback,
      );
    } catch {
      return fallback;
    }
  }

  private async safeRequestColor(path: string): Promise<string> {
    try {
      const colorIndex = asNumber(
        await this.client.request<OscMessage>(path, [], 1000),
        0,
      );
      return x32ColorMap[colorIndex] ?? colors.neutralFader;
    } catch {
      return colors.neutralFader;
    }
  }

  private async safeRequestLevel(path: string): Promise<number> {
    try {
      return clamp(
        asNumber(await this.client.request<OscMessage>(path, [], 1000), 0),
      );
    } catch {
      return 0;
    }
  }

  private async safeRequestOn(path: string): Promise<boolean> {
    try {
      return (
        asNumber(await this.client.request<OscMessage>(path, [], 1000), 1) > 0
      );
    } catch {
      return true;
    }
  }
}
