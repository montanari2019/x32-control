import { Channel } from '../types/Channel';

type ChannelListener = (channels: Channel[]) => void;
type ChannelLoader = () => Promise<Channel[]>;

const getStoreKey = (consoleIp: string, busNumber: number): string => `${consoleIp}:${busNumber}`;

const cloneChannels = (channels: Channel[]): Channel[] =>
  channels.map((channel) => ({ ...channel }));

export class BusMixChannelStore {
  private readonly channelsByKey = new Map<string, Channel[]>();
  private readonly inFlightLoads = new Map<string, Promise<Channel[]>>();
  private readonly listenersByKey = new Map<string, Set<ChannelListener>>();

  getSnapshot(consoleIp: string, busNumber: number): Channel[] {
    return cloneChannels(this.channelsByKey.get(getStoreKey(consoleIp, busNumber)) ?? []);
  }

  async loadChannels(
    consoleIp: string,
    busNumber: number,
    loader: ChannelLoader,
    options: { force?: boolean } = {},
  ): Promise<Channel[]> {
    const key = getStoreKey(consoleIp, busNumber);
    const cachedChannels = this.channelsByKey.get(key);

    if (!options.force && cachedChannels) {
      return cloneChannels(cachedChannels);
    }

    const inFlightLoad = this.inFlightLoads.get(key);
    if (!options.force && inFlightLoad) {
      return cloneChannels(await inFlightLoad);
    }

    const loadPromise = loader().then((channels) => {
      this.setChannelsByKey(key, channels);
      return this.getSnapshot(consoleIp, busNumber);
    });

    this.inFlightLoads.set(key, loadPromise);

    try {
      return await loadPromise;
    } finally {
      if (this.inFlightLoads.get(key) === loadPromise) {
        this.inFlightLoads.delete(key);
      }
    }
  }

  setChannels(consoleIp: string, busNumber: number, channels: Channel[]): void {
    this.setChannelsByKey(getStoreKey(consoleIp, busNumber), channels);
  }

  updateChannels(
    consoleIp: string,
    busNumber: number,
    updater: (channels: Channel[]) => Channel[],
  ): void {
    const key = getStoreKey(consoleIp, busNumber);
    const currentChannels = this.getSnapshot(consoleIp, busNumber);
    this.setChannelsByKey(key, updater(currentChannels));
  }

  subscribe(consoleIp: string, busNumber: number, listener: ChannelListener): () => void {
    const key = getStoreKey(consoleIp, busNumber);
    const listeners = this.listenersByKey.get(key) ?? new Set<ChannelListener>();
    listeners.add(listener);
    this.listenersByKey.set(key, listeners);
    listener(this.getSnapshot(consoleIp, busNumber));

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listenersByKey.delete(key);
      }
    };
  }

  private setChannelsByKey(key: string, channels: Channel[]): void {
    const nextChannels = cloneChannels(channels);
    this.channelsByKey.set(key, nextChannels);
    this.listenersByKey.get(key)?.forEach((listener) => listener(cloneChannels(nextChannels)));
  }
}

export const busMixChannelStore = new BusMixChannelStore();
