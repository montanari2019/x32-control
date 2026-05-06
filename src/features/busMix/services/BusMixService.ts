import { clamp } from '@shared/utils/clamp';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { Channel } from '../types/Channel';

const asString = (message: OscMessage, fallback: string): string => {
  const value = message.args[0];
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
};

const asNumber = (message: OscMessage, fallback: number): number => {
  const value = message.args[0];
  return typeof value === 'number' ? value : fallback;
};

export class BusMixService {
  constructor(private readonly client = new OscClient()) { }

  async connect(consoleIp: string): Promise<void> {
    await this.client.connect(consoleIp);
    this.client.startXRemoteKeepAlive();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  onLevel(channel: number, bus: number, listener: (level: number) => void): () => void {
    return this.client.subscribe(X32Protocol.getBusSendLevelPath(channel, bus), (message) => {
      listener(clamp(asNumber(message, 0)));
    });
  }

  async loadChannels(bus: number): Promise<Channel[]> {
    return Promise.all(
      Array.from({ length: 32 }, async (_, index) => {
        const number = index + 1;
        const label = `CH ${number.toString().padStart(2, '0')}`;
        const [name, color, level, on, pan] = await Promise.all([
          this.safeRequestString(X32Protocol.getChannelNamePath(number), label),
          this.safeRequestColor(X32Protocol.getChannelColorPath(number)),
          this.safeRequestLevel(X32Protocol.getBusSendLevelPath(number, bus)),
          this.safeRequestOn(X32Protocol.getBusSendOnPath(number, bus)),
          this.safeRequestPan(X32Protocol.getBusSendPanPath(number, bus)),
        ]);

        return {
          id: `ch-${number}`,
          number,
          label,
          name,
          color,
          level,
          signalLevel: 0,
          pan,
          on,
        };
      }),
    );
  }

  async setChannelFader(channel: number, bus: number, level: number): Promise<void> {
    await this.client.send(X32Protocol.getBusSendLevelPath(channel, bus), [clamp(level)]);
  }

  async setChannelOn(channel: number, bus: number, on: boolean): Promise<void> {
    await this.client.send(X32Protocol.getBusSendOnPath(channel, bus), [on ? 1 : 0]);
  }

  async setChannelPan(channel: number, bus: number, pan: number): Promise<void> {
    await this.client.send(X32Protocol.getBusSendPanPath(channel, bus), [clamp(pan, 0, 1)]);
  }

  private async safeRequestString(path: string, fallback: string): Promise<string> {
    try {
      return asString(await this.client.request<OscMessage>(path, [], 1000), fallback);
    } catch {
      return fallback;
    }
  }

  private async safeRequestColor(path: string): Promise<number | string> {
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
