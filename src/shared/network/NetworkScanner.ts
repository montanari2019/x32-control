import { AppError } from '@shared/errors/AppError';
import { OscClient } from '@shared/osc/OscClient';
import { OscDecoder } from '@shared/osc/OscDecoder';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { ConsoleDevice } from '@features/consoleDiscovery/types/ConsoleDevice';
import { Buffer } from 'buffer';
import { i18next } from '@shared/i18n';
import {
  getNativeBroadcastAddresses,
  getNativeNetworkInterfaces,
  NativeNetworkInterface,
} from './NativeNetworkInterfaces';
import { UdpTransport } from './UdpTransport';

const FALLBACK_BROADCAST_ADDRESS = '255.255.255.255';
const DISCOVERY_MIN_WAIT_MS = 500;
const BROADCAST_RESPONSE_WAIT_MS = 2000;
const UNICAST_RESPONSE_WAIT_MS = 3000;
const UNICAST_BATCH_SIZE = 32;
const UNICAST_BATCH_GAP_MS = 25;
const MAX_UNICAST_DISCOVERY_HOSTS = 512;

const pad4 = (length: number): number => (4 - (length % 4)) % 4;

const encodeAddressOnly = (address: string): Buffer => {
  const content = Buffer.from(`${address}\0`, 'utf8');
  return Buffer.concat([content, Buffer.alloc(pad4(content.length))]);
};

const getDiscoveryBroadcastAddresses = async (): Promise<string[]> => {
  const nativeBroadcasts = await getNativeBroadcastAddresses();
  return [...new Set([...nativeBroadcasts, FALLBACK_BROADCAST_ADDRESS])];
};

const ipv4ToNumber = (ip: string): number =>
  ip.split('.').reduce((acc, part) => ((acc << 8) + Number(part)) >>> 0, 0);

const numberToIpv4 = (value: number): string =>
  [24, 16, 8, 0].map((shift) => (value >>> shift) & 255).join('.');

const getSame24Addresses = (networkInterface: NativeNetworkInterface): string[] => {
  const octets = networkInterface.address.split('.');
  const prefix = octets.slice(0, 3).join('.');
  return sortLikelyConsoleAddresses(
    Array.from({ length: 254 }, (_, index) => `${prefix}.${index + 1}`).filter(
      (address) => address !== networkInterface.address && address !== networkInterface.broadcast,
    ),
  );
};

const getInterfaceHostAddresses = (networkInterface: NativeNetworkInterface): string[] => {
  const address = ipv4ToNumber(networkInterface.address);
  const netmask = ipv4ToNumber(networkInterface.netmask);
  const network = (address & netmask) >>> 0;
  const broadcast = ipv4ToNumber(networkInterface.broadcast);
  const hostCount = Math.max(0, broadcast - network - 1);

  if (hostCount <= 0) {
    return [];
  }

  if (hostCount > MAX_UNICAST_DISCOVERY_HOSTS) {
    return getSame24Addresses(networkInterface);
  }

  const addresses: string[] = [];
  for (let host = network + 1; host < broadcast; host += 1) {
    const hostAddress = numberToIpv4(host);
    if (hostAddress !== networkInterface.address) {
      addresses.push(hostAddress);
    }
  }

  return sortLikelyConsoleAddresses(addresses);
};

const getUnicastDiscoveryAddresses = async (): Promise<string[]> => {
  const networkInterfaces = await getNativeNetworkInterfaces();
  return [...new Set(networkInterfaces.flatMap(getInterfaceHostAddresses))];
};

const sleep = (delayMs: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

const sortLikelyConsoleAddresses = (addresses: string[]): string[] => {
  const priorityOctets = new Map([
    [250, 0],
    [251, 1],
    [252, 2],
    [253, 3],
    [254, 4],
    [1, 5],
  ]);

  return [...addresses].sort((left, right) => {
    const leftOctet = Number(left.split('.')[3]);
    const rightOctet = Number(right.split('.')[3]);
    const leftPriority = priorityOctets.get(leftOctet) ?? leftOctet + 10;
    const rightPriority = priorityOctets.get(rightOctet) ?? rightOctet + 10;
    return leftPriority - rightPriority;
  });
};

const parseInfo = (ip: string, port: number, response: OscMessage): ConsoleDevice => {
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
    private readonly transportFactory: () => UdpTransport = () => new UdpTransport(),
  ) {}

  async scanForConsoles(): Promise<ConsoleDevice[]> {
    const transport = this.transportFactory();
    const devices = new Map<string, ConsoleDevice>();

    await transport.bind(0, { broadcast: true });

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

    try {
      const payload = encodeAddressOnly(X32Protocol.getInfoPath());
      const broadcasts = await getDiscoveryBroadcastAddresses();
      this.sendDiscoveryBatch(payload, transport, broadcasts);

      await this.waitForResponses(devices, BROADCAST_RESPONSE_WAIT_MS);

      if (devices.size === 0) {
        await this.sendUnicastDiscovery(payload, transport, devices);
        await this.waitForResponses(devices, UNICAST_RESPONSE_WAIT_MS);
      }
    } finally {
      unsubscribe();
      transport.close();
    }

    return [...devices.values()];
  }

  async validateConsole(ip: string, timeoutMs = 5000): Promise<ConsoleDevice> {
    const client = this.clientFactory();

    try {
      await client.connect(ip, X32Protocol.defaultPort);
      const info = await client.request<OscMessage>(X32Protocol.getInfoPath(), [], timeoutMs);
      return parseInfo(ip, X32Protocol.defaultPort, info);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'CONSOLE_NOT_FOUND',
        i18next.t('errors.discoveryFailure'),
        error,
      );
    } finally {
      client.disconnect();
    }
  }

  private async sendUnicastDiscovery(
    payload: Buffer,
    transport: UdpTransport,
    devices: Map<string, ConsoleDevice>,
  ): Promise<void> {
    const addresses = await getUnicastDiscoveryAddresses();

    for (let index = 0; index < addresses.length; index += UNICAST_BATCH_SIZE) {
      if (devices.size > 0) {
        return;
      }

      const batch = addresses.slice(index, index + UNICAST_BATCH_SIZE);
      this.sendDiscoveryBatch(payload, transport, batch);
      await sleep(UNICAST_BATCH_GAP_MS);
    }
  }

  private sendDiscoveryBatch(payload: Buffer, transport: UdpTransport, addresses: string[]): void {
    addresses.forEach((address) => {
      transport.send(payload, address, X32Protocol.defaultPort).catch(() => undefined);
    });
  }

  private async waitForResponses(
    devices: Map<string, ConsoleDevice>,
    maxWaitMs: number,
  ): Promise<void> {
    await new Promise<void>((resolve) => {
      // iOS can spend part of the first scan waiting for the Local Network permission prompt.
      let isSettled = false;
      let minTimer: ReturnType<typeof setTimeout>;
      let maxTimer: ReturnType<typeof setTimeout>;
      let checkInterval: ReturnType<typeof setInterval>;
      let minPassed = false;

      const settle = (): void => {
        if (isSettled) {
          return;
        }

        isSettled = true;
        clearTimeout(minTimer);
        clearTimeout(maxTimer);
        clearInterval(checkInterval);
        resolve();
      };

      minTimer = setTimeout(() => {
        minPassed = true;
        if (devices.size > 0) settle();
      }, DISCOVERY_MIN_WAIT_MS);

      maxTimer = setTimeout(settle, maxWaitMs);
      checkInterval = setInterval(() => {
        if (minPassed && devices.size > 0) {
          settle();
        }
      }, 50);
    });
  }
}
