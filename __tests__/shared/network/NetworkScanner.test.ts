import { Buffer } from 'buffer';
import { AppError } from '../../../src/shared/errors/AppError';
import { UdpTransport, UdpMessageHandler } from '../../../src/shared/network/UdpTransport';
import { NetworkScanner } from '../../../src/shared/network/NetworkScanner';

jest.mock('../../../src/shared/network/NativeNetworkInterfaces', () => ({
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

class FakeUdpTransport {
  sentPackets: Array<{ data: Buffer; ip: string; port: number }> = [];
  sendError?: AppError;
  respondToAddress?: string;
  hangSends = false;
  private messageHandler?: UdpMessageHandler;

  async bind(): Promise<void> {
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
    return undefined;
  }
}

describe('NetworkScanner', () => {
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
  });

  it('falls back to unicast discovery across the local subnet when broadcast has no response', async () => {
    const transport = new FakeUdpTransport();
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await scanner.scanForConsoles();

    expect(transport.sentPackets.map((packet) => packet.ip)).toContain('192.168.1.250');
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
  }, 10000);

  it('waits for discovery responses when send callbacks time out on iOS', async () => {
    const transport = new FakeUdpTransport();
    transport.sendError = new AppError('UDP_TIMEOUT', 'Timeout ao enviar pacote UDP.');
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await expect(scanner.scanForConsoles()).resolves.toEqual([]);
  });

  it('does not abort discovery when individual discovery sends fail', async () => {
    const transport = new FakeUdpTransport();
    transport.sendError = new AppError('UDP_TRANSPORT_ERROR', 'Falha ao enviar pacote UDP.');
    const scanner = new NetworkScanner(
      () => undefined as never,
      () => transport as unknown as UdpTransport,
    );

    await expect(scanner.scanForConsoles()).resolves.toEqual([]);
  });
});
