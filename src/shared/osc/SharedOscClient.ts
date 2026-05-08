import { OscClient } from './OscClient';
import { X32Protocol } from './X32Protocol';

type SharedOscClientEntry = {
  client: OscClient;
  connectPromise?: Promise<void>;
  isConnected: boolean;
  refCount: number;
  releaseTimer?: ReturnType<typeof setTimeout>;
};

export type SharedOscClientLease = {
  client: OscClient;
  release: () => void;
};

const RELEASE_DELAY_MS = 5000;
const clientsByEndpoint = new Map<string, SharedOscClientEntry>();

const getEndpointKey = (ip: string, port: number): string => `${ip}:${port}`;

export const acquireSharedOscClient = async (
  ip: string,
  port = X32Protocol.defaultPort,
): Promise<SharedOscClientLease> => {
  const key = getEndpointKey(ip, port);
  let entry = clientsByEndpoint.get(key);

  if (!entry) {
    entry = {
      client: new OscClient(),
      isConnected: false,
      refCount: 0,
    };
    clientsByEndpoint.set(key, entry);
  }

  if (entry.releaseTimer) {
    clearTimeout(entry.releaseTimer);
    entry.releaseTimer = undefined;
  }

  entry.refCount += 1;

  try {
    if (!entry.isConnected) {
      entry.connectPromise ??= entry.client.connect(ip, port).finally(() => {
        if (entry) {
          entry.connectPromise = undefined;
        }
      });
      await entry.connectPromise;
      entry.isConnected = true;
    }
  } catch (error) {
    releaseSharedOscClient(key);
    throw error;
  }

  let isReleased = false;
  return {
    client: entry.client,
    release: () => {
      if (isReleased) {
        return;
      }

      isReleased = true;
      releaseSharedOscClient(key);
    },
  };
};

const releaseSharedOscClient = (key: string): void => {
  const entry = clientsByEndpoint.get(key);
  if (!entry) {
    return;
  }

  entry.refCount = Math.max(0, entry.refCount - 1);
  if (entry.refCount > 0 || entry.releaseTimer) {
    return;
  }

  entry.releaseTimer = setTimeout(() => {
    const current = clientsByEndpoint.get(key);
    if (!current || current.refCount > 0) {
      return;
    }

    current.client.disconnect();
    current.isConnected = false;
    clientsByEndpoint.delete(key);
  }, RELEASE_DELAY_MS);
};
