import { Buffer } from 'buffer';
import { UdpTransport } from '../../../src/shared/network/UdpTransport';
import { OscClient } from '../../../src/shared/osc/OscClient';
import { OscDecoder } from '../../../src/shared/osc/OscDecoder';
import { OscEncoder } from '../../../src/shared/osc/OscEncoder';
import { OscMessage } from '../../../src/shared/osc/OscMessage';

class FakeUdpTransport {
  sentPackets: Buffer[] = [];
  private messageHandler?: (message: { data: Buffer; remoteAddress: string; remotePort: number }) => void;

  async bind(): Promise<void> {
    return undefined;
  }

  async send(data: Buffer): Promise<void> {
    this.sentPackets.push(data);
  }

  onMessage(
    handler: (message: { data: Buffer; remoteAddress: string; remotePort: number }) => void,
  ): () => void {
    this.messageHandler = handler;
    return () => {
      this.messageHandler = undefined;
    };
  }

  close(): void {
    return undefined;
  }

  emit(message: OscMessage): void {
    this.messageHandler?.({
      data: OscEncoder.encode(message),
      remoteAddress: '192.168.0.10',
      remotePort: 10023,
    });
  }
}

const encodeRawAddress = (address: string): Buffer => {
  const content = Buffer.from(`${address}\0`, 'utf8');
  const padding = Buffer.alloc((4 - (content.length % 4)) % 4);
  return Buffer.concat([content, padding]);
};

describe('OscClient', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('sendRaw sends only the padded OSC address without type tags', async () => {
    const transport = new FakeUdpTransport();
    const client = new OscClient(transport as unknown as UdpTransport);

    await client.connect('192.168.0.10');
    await client.sendRaw('/meters/1');

    expect(transport.sentPackets).toHaveLength(1);
    expect(transport.sentPackets[0]).toEqual(encodeRawAddress('/meters/1'));
    expect(transport.sentPackets[0].includes(',')).toBe(false);
  });

  it('manages scalar X32 subscriptions with renewal, dispatch and cleanup', async () => {
    jest.useFakeTimers();
    const transport = new FakeUdpTransport();
    const client = new OscClient(transport as unknown as UdpTransport);
    const firstListener = jest.fn();
    const secondListener = jest.fn();
    const onRenew = jest.fn();

    await client.connect('192.168.0.10');

    const unsubscribeFirst = client.subscribeScalarValue({
      address: '/ch/17/mix/01/level',
      timeFactor: 5,
      renewIntervalMs: 8000,
      listener: firstListener,
      onRenew,
    });
    const unsubscribeSecond = client.subscribeScalarValue({
      address: '/ch/17/mix/01/level',
      timeFactor: 5,
      renewIntervalMs: 8000,
      listener: secondListener,
    });

    expect(transport.sentPackets.map((packet) => OscDecoder.decode(packet))).toEqual([
      {
        address: '/subscribe',
        args: ['/ch/17/mix/01/level', 5],
      },
    ]);

    transport.emit({
      address: '/ch/17/mix/01/level',
      args: [{ type: 'f', value: 0.42 }],
    });

    expect(firstListener).toHaveBeenCalledWith(
      expect.objectContaining({ address: '/ch/17/mix/01/level' }),
    );
    expect(secondListener).toHaveBeenCalledWith(
      expect.objectContaining({ address: '/ch/17/mix/01/level' }),
    );

    jest.advanceTimersByTime(8000);
    await Promise.resolve();

    expect(onRenew).toHaveBeenCalledTimes(1);
    expect(OscDecoder.decode(transport.sentPackets[1])).toEqual({
      address: '/renew',
      args: ['/ch/17/mix/01/level'],
    });

    unsubscribeFirst();
    expect(transport.sentPackets).toHaveLength(2);

    unsubscribeSecond();
    await Promise.resolve();

    expect(OscDecoder.decode(transport.sentPackets[2])).toEqual({
      address: '/unsubscribe',
      args: ['/ch/17/mix/01/level'],
    });

    jest.advanceTimersByTime(8000);
    await Promise.resolve();

    expect(onRenew).toHaveBeenCalledTimes(1);
    expect(transport.sentPackets).toHaveLength(3);
  });

  it('clears managed scalar subscription timers on disconnect', async () => {
    jest.useFakeTimers();
    const transport = new FakeUdpTransport();
    const client = new OscClient(transport as unknown as UdpTransport);

    await client.connect('192.168.0.10');
    client.subscribeScalarValue({
      address: '/ch/17/mix/01/level',
      renewIntervalMs: 8000,
      listener: jest.fn(),
    });

    client.disconnect();
    jest.advanceTimersByTime(8000);
    await Promise.resolve();

    expect(transport.sentPackets.map((packet) => OscDecoder.decode(packet))).toEqual([
      {
        address: '/subscribe',
        args: ['/ch/17/mix/01/level', 5],
      },
    ]);
  });
});
