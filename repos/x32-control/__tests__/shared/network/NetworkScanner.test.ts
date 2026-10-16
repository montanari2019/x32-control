import { Buffer } from 'buffer';
import { Platform } from 'react-native';
import { AppError } from '../../../src/shared/errors/AppError';
import { UdpTransport, UdpMessageHandler } from '../../../src/shared/network/UdpTransport';
import {
  getNativeBroadcastAddresses,
  getNativeNetworkInterfaces,
} from '../../../src/shared/network/NativeNetworkInterfaces';
import * as nativeNetwork from '../../../src/shared/network/NativeNetworkInterfaces';
import { NetworkScanner } from '../../../src/shared/network/NetworkScanner';

jest.mock('../../../src/shared/network/NativeNetworkInterfaces', () => ({
  acquireAndroidMulticastLock: jest.fn().mockResolvedValue(true),
  releaseAndroidMulticastLock: jest.fn().mockResolvedValue(true),
  bindAndroidProcessToWifi: jest.fn().mockResolvedValue(true),
  unbindAndroidProcessFromWifi: jest.fn().mockResolvedValue(true),
  logNativeDiscovery: jest.fn(),
  getNativeBroadcastAddresses: jest.fn().mockResolvedValue(['192.168.1.255']),
  getNativeNetworkInterfaces: jest.fn().mockResolvedValue([
    {
      address: '192.168.1.10',
      netmask: '255.255.255.0',
      broadcast: '192.168.1.255',
    },
  ]),
}));

const INFO_RESPONSE = Buffer.from(
  '2f696e666f0000002c7373737300000056322e30370000006f73632d736572766572000058333200342e303200000000',
  'hex',
);

const mockedGetNativeBroadcastAddresses = getNativeBroadcastAddresses as jest.MockedFunction<
  typeof getNativeBroadcastAddresses
>;
const mockedGetNativeNetworkInterfaces = getNativeNetworkInterfaces as jest.MockedFunction<
  typeof getNativeNetworkInterfaces
>;

class FakeUdpTransport {
  sentPackets: Array<{ data: Buffer; ip: string; port: number }> = [];
  bindError?: AppError;
  closed = false;
  sendError?: AppError;
  hangBind = false;
  respondToAddress?: string;
  hangSends = false;
  private messageHandler?: UdpMessageHandler;

  async bind(): Promise<void> {
    if (this.hangBind) {
      await new Promise(() => undefined);
    }

    if (this.bindError) {
      throw this.bindError;
    }

    return undefined;
  }

  async send(data: Buffer, ip: string, port: number): Promise<void> {
    this.sentPackets.push({ data, ip, port });
    if (ip === this.respondToAddress) {
      this.messageHandler?.({
        data: INFO_RESPONSE,
        remoteAddress: '192.168.1.250',
        remotePort: port,
      });
    }

    if (this.sendError) {
      throw this.sendError;
    }

    if (this.hangSends) {
      await new Promise(() => undefined);
    }
  }

  onMessage(handler: UdpMessageHandler): () => void {
    this.messageHandler = handler;
    return () => {
      this.messageHandler = undefined;
    };
  }

  close(): void {
    this.closed = true;
  }
}

describe('NetworkScanner', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockedGetNativeBroadcastAddresses.mockResolvedValue(['192.168.1.255']);
    mockedGetNativeNetworkInterfaces.mockResolvedValue([
      {
        address: '192.168.1.10',
        netmask: '255.255.255.0',
        broadcast: '192.168.1.255',
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('sends discovery to the native directed broadcast and fallback broadcast', async () => {
    const transport = new FakeUdpTransport();
    transport.respondToAddress = '192.168.1.255';
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await scanner.scanForConsoles();

    expect(transport.sentPackets.map((packet) => packet.ip)).toEqual([
      '192.168.1.255',
      '255.255.255.255',
    ]);
    expect(transport.closed).toBe(true);
  });

  it('falls back to unicast discovery across the local subnet when broadcast has no response', async () => {
    const transport = new FakeUdpTransport();
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await scanner.scanForConsoles();

    expect(transport.sentPackets.map((packet) => packet.ip)).toContain('192.168.1.250');
    expect(transport.closed).toBe(true);
  });

  it('does not block unicast discovery on pending send callbacks from earlier hosts', async () => {
    const transport = new FakeUdpTransport();
    transport.hangSends = true;
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await scanner.scanForConsoles();

    expect(transport.sentPackets.map((packet) => packet.ip)).toContain('192.168.1.250');
    expect(transport.closed).toBe(true);
  }, 10000);

  it('waits for discovery responses when send callbacks time out on iOS', async () => {
    const transport = new FakeUdpTransport();
    transport.sendError = new AppError('UDP_TIMEOUT', 'Timeout ao enviar pacote UDP.');
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await expect(scanner.scanForConsoles()).resolves.toEqual([]);
    expect(transport.closed).toBe(true);
  });

  it('does not abort discovery when individual discovery sends fail', async () => {
    const transport = new FakeUdpTransport();
    transport.sendError = new AppError('UDP_TRANSPORT_ERROR', 'Falha ao enviar pacote UDP.');
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await expect(scanner.scanForConsoles()).resolves.toEqual([]);
    expect(transport.closed).toBe(true);
  });

  it('keeps the fallback global broadcast when native interface data is unavailable', async () => {
    mockedGetNativeBroadcastAddresses.mockResolvedValueOnce([]);
    mockedGetNativeNetworkInterfaces.mockResolvedValueOnce([]);

    const transport = new FakeUdpTransport();
    transport.respondToAddress = '255.255.255.255';
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await scanner.scanForConsoles();

    expect(transport.sentPackets.map((packet) => packet.ip)).toEqual(['255.255.255.255']);
  });

  it('closes the transport when bind fails before discovery can start', async () => {
    const transport = new FakeUdpTransport();
    transport.bindError = new AppError('UDP_TRANSPORT_ERROR', 'Bind falhou.');
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await expect(scanner.scanForConsoles()).rejects.toBe(transport.bindError);
    expect(transport.closed).toBe(true);
  });

  describe('Android guards', () => {
    const originalOs = Platform.OS;
    const makeScanner = (transport: FakeUdpTransport) =>
      new NetworkScanner(
        () => undefined as never,
        () => transport as unknown as UdpTransport,
      );

    beforeEach(() => {
      jest.useFakeTimers();
      (Platform as { OS: string }).OS = 'android';
    });

    afterEach(() => {
      jest.useRealTimers();
      (Platform as { OS: string }).OS = originalOs;
    });

    it('settles with an empty result when bind never resolves', async () => {
      const transport = new FakeUdpTransport();
      transport.hangBind = true;

      const result = makeScanner(transport).scanForConsoles();
      const outcome = result.then(
        (devices) => ({ devices }),
        (error: AppError) => ({ error }),
      );
      await jest.advanceTimersByTimeAsync(10000);

      await expect(outcome).resolves.toMatchObject({ error: { code: 'UDP_TIMEOUT' } });
      expect(transport.closed).toBe(true);
    });

    it('does not freeze when native interface lookups never resolve', async () => {
      mockedGetNativeBroadcastAddresses.mockReturnValueOnce(new Promise(() => undefined));
      mockedGetNativeNetworkInterfaces.mockReturnValueOnce(new Promise(() => undefined));
      const transport = new FakeUdpTransport();

      const result = makeScanner(transport).scanForConsoles();
      await jest.advanceTimersByTimeAsync(12000);

      await expect(result).resolves.toEqual([]);
      expect(transport.sentPackets.map((packet) => packet.ip)).toContain('255.255.255.255');
      expect(transport.closed).toBe(true);
    });

    it('returns before the watchdog limit even if the native setup hangs', async () => {
      (nativeNetwork.acquireAndroidMulticastLock as jest.Mock).mockReturnValueOnce(
        new Promise(() => undefined),
      );
      (nativeNetwork.bindAndroidProcessToWifi as jest.Mock).mockReturnValueOnce(
        new Promise(() => undefined),
      );
      const transport = new FakeUdpTransport();

      const result = makeScanner(transport).scanForConsoles();
      await jest.advanceTimersByTimeAsync(9500);

      await expect(result).resolves.toEqual([]);
      expect(transport.closed).toBe(true);
    });

    it('finds the console by subnet sweep without waiting for a silent broadcast window', async () => {
      const transport = new FakeUdpTransport();
      transport.respondToAddress = '192.168.1.250';

      const result = makeScanner(transport).scanForConsoles();
      await jest.advanceTimersByTimeAsync(2000);

      await expect(result).resolves.toEqual([
        expect.objectContaining({ ip: '192.168.1.250', name: 'osc-server', model: 'X32' }),
      ]);
      expect(transport.sentPackets.map((packet) => packet.ip)).toEqual(
        expect.arrayContaining(['192.168.1.255', '255.255.255.255', '192.168.1.250']),
      );
    });

    it('holds the multicast lock and Wi-Fi binding during the scan and always releases them', async () => {
      const transport = new FakeUdpTransport();
      transport.respondToAddress = '192.168.1.250';

      const result = makeScanner(transport).scanForConsoles();
      await jest.advanceTimersByTimeAsync(2000);
      await result;

      expect(nativeNetwork.acquireAndroidMulticastLock).toHaveBeenCalledTimes(1);
      expect(nativeNetwork.bindAndroidProcessToWifi).toHaveBeenCalledTimes(1);
      expect(nativeNetwork.unbindAndroidProcessFromWifi).toHaveBeenCalledTimes(1);
      expect(nativeNetwork.releaseAndroidMulticastLock).toHaveBeenCalledTimes(1);
    });

    it('awaits the native release before returning when the watchdog wins', async () => {
      const transport = new FakeUdpTransport();
      transport.hangBind = true;
      let releasedWhenSettled = false;

      const result = makeScanner(transport).scanForConsoles();
      const settled = result.catch(() => {
        releasedWhenSettled =
          (nativeNetwork.unbindAndroidProcessFromWifi as jest.Mock).mock.calls.length > 0 &&
          (nativeNetwork.releaseAndroidMulticastLock as jest.Mock).mock.calls.length > 0;
      });
      await jest.advanceTimersByTimeAsync(10000);
      await settled;

      expect(releasedWhenSettled).toBe(true);
    });

    it('retries the Wi-Fi unbind once when the first attempt is not confirmed', async () => {
      (nativeNetwork.unbindAndroidProcessFromWifi as jest.Mock)
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      const transport = new FakeUdpTransport();
      transport.respondToAddress = '192.168.1.250';

      const result = makeScanner(transport).scanForConsoles();
      await jest.advanceTimersByTimeAsync(2000);
      await result;

      expect(nativeNetwork.unbindAndroidProcessFromWifi).toHaveBeenCalledTimes(2);
    });

    it('never overlaps two scans: the second prepares native state only after the first released it', async () => {
      const events: string[] = [];
      (nativeNetwork.acquireAndroidMulticastLock as jest.Mock).mockImplementation(async () => {
        events.push('acquire');
        return true;
      });
      (nativeNetwork.releaseAndroidMulticastLock as jest.Mock).mockImplementation(async () => {
        events.push('release');
        return true;
      });
      const first = new FakeUdpTransport();
      first.respondToAddress = '192.168.1.250';
      const second = new FakeUdpTransport();
      second.respondToAddress = '192.168.1.250';

      const firstScan = makeScanner(first).scanForConsoles();
      const secondScan = makeScanner(second).scanForConsoles();
      await jest.advanceTimersByTimeAsync(5000);
      await Promise.all([firstScan, secondScan]);

      expect(events).toEqual(['acquire', 'release', 'acquire', 'release']);
    });

    it('releases native resources when bind fails', async () => {
      const transport = new FakeUdpTransport();
      transport.bindError = new AppError('UDP_TRANSPORT_ERROR', 'Bind falhou.');

      const result = makeScanner(transport).scanForConsoles();
      const settled = result.catch((error: AppError) => error);
      await jest.advanceTimersByTimeAsync(3000);

      await expect(settled).resolves.toBe(transport.bindError);
      expect(nativeNetwork.unbindAndroidProcessFromWifi).toHaveBeenCalledTimes(1);
      expect(nativeNetwork.releaseAndroidMulticastLock).toHaveBeenCalledTimes(1);
    });
  });

  it('does not touch Android native network helpers on iOS', async () => {
    const transport = new FakeUdpTransport();
    transport.respondToAddress = '192.168.1.255';
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await scanner.scanForConsoles();

    expect(nativeNetwork.acquireAndroidMulticastLock).not.toHaveBeenCalled();
    expect(nativeNetwork.bindAndroidProcessToWifi).not.toHaveBeenCalled();
  });
});
