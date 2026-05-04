import { AppError } from '@shared/errors/AppError';
import { OscClient } from '@shared/osc/OscClient';
import { OscDecoder } from '@shared/osc/OscDecoder';
import { OscEncoder } from '@shared/osc/OscEncoder';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { ConsoleDevice } from '@features/consoleDiscovery/types/ConsoleDevice';
import { UdpTransport } from './UdpTransport';

const parseInfo = (
  ip: string,
  port: number,
  response: OscMessage,
): ConsoleDevice => {
  const values = response.args.map(String);
  const model = values.find((value) => /X32|M32/i.test(value)) ?? 'X32/M32';
  const name = values[1] && values[1].trim().length > 0 ? values[1] : model;

  return {
    id: `${ip}:${port}`,
    ip,
    port,
    name,
    model,
    status: 'connected',
    firmware: values.find((value) => /^\d+\.\d+/.test(value)),
  };
};

export class NetworkScanner {
  constructor(
    private readonly clientFactory: () => OscClient = () => new OscClient(),
    private readonly transportFactory: () => UdpTransport = () =>
      new UdpTransport(),
  ) {}

  async scanForConsoles(): Promise<ConsoleDevice[]> {
    const transport = this.transportFactory();
    const devices = new Map<string, ConsoleDevice>();

    await transport.bind();

    const unsubscribe = transport.onMessage((message) => {
      try {
        const packet = OscDecoder.decode(message.data);
        if (packet.address === X32Protocol.getInfoPath()) {
          devices.set(
            message.remoteAddress,
            parseInfo(message.remoteAddress, X32Protocol.defaultPort, packet),
          );
        }
      } catch {
        // Discovery ignores non-OSC broadcast traffic on busy networks.
      }
    });

    await transport.send(
      OscEncoder.encode({ address: X32Protocol.getInfoPath(), args: [] }),
      '255.255.255.255',
      X32Protocol.defaultPort,
    );

    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), 900);
    });
    unsubscribe();
    transport.close();
    return [...devices.values()];
  }

  async validateConsole(ip: string, timeoutMs = 1500): Promise<ConsoleDevice> {
    const client = this.clientFactory();

    try {
      await client.connect(ip, X32Protocol.defaultPort);
      const info = await client.request<OscMessage>(
        X32Protocol.getInfoPath(),
        [],
        timeoutMs,
      );
      await client.request<OscMessage>(
        X32Protocol.getStatusPath(),
        [],
        timeoutMs,
      );
      return parseInfo(ip, X32Protocol.defaultPort, info);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'CONSOLE_NOT_FOUND',
        'Mesa não encontrada neste IP.',
        error,
      );
    } finally {
      client.disconnect();
    }
  }
}
