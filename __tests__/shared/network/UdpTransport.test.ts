import { Buffer } from 'buffer';

type MockSocket = {
  _id: number;
  bind: jest.Mock<void, [number]>;
  close: jest.Mock<void, []>;
  on: jest.Mock<void, [event: 'message' | 'error' | 'listening', listener: (...args: unknown[]) => void]>;
  send: jest.Mock<void, [Buffer, number, number, number, string, ((error?: Error) => void)?]>;
  setBroadcast: jest.Mock<void, [boolean]>;
};

describe('UdpTransport', () => {
  const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = true;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetModules();
    jest.restoreAllMocks();
    (globalThis as unknown as { __DEV__: boolean }).__DEV__ = originalDev;
  });

  const loadTransportModule = ({
    nativeUdpSockets,
    platform,
  }: {
    nativeUdpSockets?: Record<string, unknown>;
    platform: 'android' | 'ios';
  }) => {
    const listeners = new Map<string, (...args: unknown[]) => void>();
    const socket: MockSocket = {
      _id: 7,
      bind: jest.fn<void, [number]>((_port) => {
        listeners.get('listening')?.();
      }),
      close: jest.fn(),
      on: jest.fn((event, listener) => {
        listeners.set(event, listener);
      }),
      send: jest.fn(),
      setBroadcast: jest.fn(),
    };
    const ensureLocalNetworkPermission = jest.fn().mockResolvedValue(undefined);

    jest.doMock('react-native', () => ({
      NativeModules: {
        ...(nativeUdpSockets ? { UdpSockets: nativeUdpSockets } : {}),
      },
      Platform: { OS: platform },
    }));
    jest.doMock('react-native-udp', () => ({
      createSocket: jest.fn(() => socket),
    }));
    jest.doMock('../../../src/shared/network/LocalNetworkPermission', () => ({
      ensureLocalNetworkPermission,
    }));

    const module = require('../../../src/shared/network/UdpTransport') as typeof import('../../../src/shared/network/UdpTransport');
    return {
      UdpTransport: module.UdpTransport,
      ensureLocalNetworkPermission,
      socket,
    };
  };

  it('settles Android bind when native broadcast confirmation never returns', async () => {
    const nativeSetBroadcast = jest.fn();
    const { UdpTransport, ensureLocalNetworkPermission, socket } = loadTransportModule({
      nativeUdpSockets: {
        setBroadcast: nativeSetBroadcast,
      },
      platform: 'android',
    });

    const transport = new UdpTransport();
    const bindPromise = transport.bind(0, { broadcast: true });
    void bindPromise.catch(() => undefined);

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);

    await expect(bindPromise).resolves.toBeUndefined();
    expect(ensureLocalNetworkPermission).toHaveBeenCalledTimes(1);
    expect(nativeSetBroadcast).toHaveBeenCalledWith(7, true, expect.any(Function));
    expect(socket.setBroadcast).toHaveBeenCalledWith(true);
  });

  it('preserves the awaited iOS broadcast failure path', async () => {
    const nativeSetBroadcast = jest.fn((_socketId, _enabled, callback: (error?: unknown) => void) => {
      callback({ message: 'ios broadcast failed' });
    });
    const { UdpTransport, socket } = loadTransportModule({
      nativeUdpSockets: {
        setBroadcast: nativeSetBroadcast,
      },
      platform: 'ios',
    });

    const transport = new UdpTransport();
    const bindPromise = transport.bind(0, { broadcast: true });
    void bindPromise.catch(() => undefined);

    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(1000);

    await expect(bindPromise).rejects.toMatchObject({
      code: 'UDP_TRANSPORT_ERROR',
    });
    expect(socket.setBroadcast).not.toHaveBeenCalled();
  });
});
