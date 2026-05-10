import { Buffer } from 'buffer';
import { UdpTransport } from '../../../src/shared/network/UdpTransport';
import { OscClient } from '../../../src/shared/osc/OscClient';

class FakeUdpTransport {
  sentPackets: Buffer[] = [];

  async bind(): Promise<void> {
    return undefined;
  }

  async send(data: Buffer): Promise<void> {
    this.sentPackets.push(data);
  }

  onMessage(): () => void {
    return () => undefined;
  }

  close(): void {
    return undefined;
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
