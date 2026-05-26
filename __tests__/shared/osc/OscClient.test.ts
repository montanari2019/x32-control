import { Buffer } from 'buffer';
import { UdpTransport } from '../../../src/shared/network/UdpTransport';
import { OscClient } from '../../../src/shared/osc/OscClient';
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
  it('sendRaw sends only the padded OSC address without type tags', async () => {
    const transport = new FakeUdpTransport();
    const client = new OscClient(transport as unknown as UdpTransport);

    await client.connect('192.168.0.10');
    await client.sendRaw('/meters/1');

    expect(transport.sentPackets).toHaveLength(1);
    expect(transport.sentPackets[0]).toEqual(encodeRawAddress('/meters/1'));
    expect(transport.sentPackets[0].includes(',')).toBe(false);
  });
});
