import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChannelKind } from '../types/Channel';

const CACHE_VERSION = 1;
const TTL_MS = 3 * 24 * 60 * 60 * 1000;

export type CachedChannelStructure = {
  id: string;
  kind: ChannelKind;
  number: number;
  sourceNumber: number;
  label: string;
  name: string;
  color: number;
  backgroundOpacity: number;
  meterChannelId: number | undefined;
};

type CachePayload = {
  version: number;
  savedAt: number;
  channels: CachedChannelStructure[];
};

const getCacheKey = (consoleIp: string): string =>
  `x32-control:channel-structure:v${CACHE_VERSION}:${consoleIp}`;

export class ChannelStructureCache {
  async load(consoleIp: string): Promise<CachedChannelStructure[] | null> {
    try {
      const raw = await AsyncStorage.getItem(getCacheKey(consoleIp));
      if (!raw) {
        return null;
      }

      const payload = JSON.parse(raw) as CachePayload;
      if (payload.version !== CACHE_VERSION) {
        return null;
      }

      if (Date.now() - payload.savedAt > TTL_MS) {
        return null;
      }

      return payload.channels;
    } catch {
      return null;
    }
  }

  async save(consoleIp: string, channels: CachedChannelStructure[]): Promise<void> {
    try {
      const payload: CachePayload = {
        version: CACHE_VERSION,
        savedAt: Date.now(),
        channels,
      };

      await AsyncStorage.setItem(getCacheKey(consoleIp), JSON.stringify(payload));
    } catch {
      // Cache write failure is non-fatal.
    }
  }

  async invalidate(consoleIp: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(getCacheKey(consoleIp));
    } catch {
      // Cache invalidation failure is non-fatal.
    }
  }
}

export const channelStructureCache = new ChannelStructureCache();
