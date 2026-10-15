import { MixerControlProvider } from '@shared/mixer/MixerControlProvider';
import {
  getMockProviderForIp,
  isMockConsoleIp,
  mockMixerProvider,
} from '@shared/mixer/mock/mockMixerProvider';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { X32ChannelColor } from '@shared/x32/channelColor';
import {
  fetchBusStereoLinkMap,
  getCachedBusStereoLinkMap,
  normalizeStereoBusName,
  setCachedBusStereoLinkMap,
} from '@shared/x32/busStereoLink';
import { Bus } from '../types/Bus';

const defaultBusNames = ['Guitarra', 'Baixo', 'Bateria', 'Vocal', 'Click', 'Playback'];
const X32_BUS_COLORS = new Set<X32ChannelColor>(['OFF', 'RD', 'GN', 'YE', 'BL', 'MG', 'CY', 'WH']);

const parseBusColor = (message: OscMessage): X32ChannelColor | number | undefined => {
  const value = message.args[0];
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (X32_BUS_COLORS.has(normalized as X32ChannelColor)) {
      return normalized as X32ChannelColor;
    }
  }

  return undefined;
};

export class BusService {
  private useMockProvider = false;
  private mockProvider: MixerControlProvider = mockMixerProvider;

  constructor(private readonly client = new OscClient()) {}

  async connect(consoleIp: string): Promise<void> {
    if (this.useMockProvider) {
      this.mockProvider.disconnect();
    }

    this.useMockProvider = isMockConsoleIp(consoleIp);
    if (this.useMockProvider) {
      this.mockProvider = getMockProviderForIp(consoleIp);
      await this.mockProvider.connect(consoleIp);
      return;
    }

    await this.client.connect(consoleIp);
    this.client.startXRemoteKeepAlive();
  }

  disconnect(): void {
    if (this.useMockProvider) {
      this.mockProvider.disconnect();
      this.useMockProvider = false;
      return;
    }

    this.client.disconnect();
  }

  async getBuses(): Promise<Bus[]> {
    if (this.useMockProvider) {
      return this.mockProvider.getBuses();
    }

    const byNumber = new Map<number, Bus>();

    await Promise.all(
      Array.from({ length: 16 }, async (_, index) => {
        const number = index + 1;
        const fallback = defaultBusNames[index] ?? `Bus ${number.toString().padStart(2, '0')}`;

        try {
          const [response, color] = await Promise.all([
            this.client.request<OscMessage>(X32Protocol.getBusNamePath(number), [], 1000),
            this.getBusColor(number),
          ]);
          const customName = response.args[0];
          const name = typeof customName === 'string' && customName.trim() ? customName : fallback;

          byNumber.set(number, {
            number,
            label: `Bus ${number.toString().padStart(2, '0')}`,
            name,
            color,
          });
        } catch {
          byNumber.set(number, {
            number,
            label: `Bus ${number.toString().padStart(2, '0')}`,
            name: fallback,
            color: await this.getBusColor(number),
          });
        }
      }),
    );

    const fetchedMap = await fetchBusStereoLinkMap(this.client);
    if (fetchedMap) {
      setCachedBusStereoLinkMap(fetchedMap);
    }
    const stereoLinkMap = fetchedMap ?? getCachedBusStereoLinkMap() ?? {};

    const linkedOddBuses = new Set<number>();
    for (let bus = 1; bus <= 15; bus += 2) {
      const pairKey = `${bus}-${bus + 1}`;
      if (stereoLinkMap[pairKey]) {
        linkedOddBuses.add(bus);
      }
    }

    const result: Bus[] = [];
    for (let bus = 1; bus <= 16; bus += 1) {
      const current = byNumber.get(bus);
      if (!current) {
        continue;
      }

      const previousIsLinked = bus > 1 && linkedOddBuses.has(bus - 1);
      if (previousIsLinked) {
        continue;
      }

      const isLinkedOdd = bus % 2 === 1 && linkedOddBuses.has(bus);
      if (isLinkedOdd && bus < 16) {
        const leftName = current.name;
        const rightBus = byNumber.get(bus + 1);
        const rightName = rightBus?.name ?? '';
        const { name } = normalizeStereoBusName(leftName, rightName);

        result.push({
          ...current,
          name,
          color: current.color ?? rightBus?.color,
          label: `Bus ${bus.toString().padStart(2, '0')}/${(bus + 1).toString().padStart(2, '0')}`,
          linkedBusNumber: bus + 1,
          isStereoLinked: true,
          rawNames: {
            left: leftName,
            right: rightName,
          },
        });
        continue;
      }

      result.push(current);
    }

    return result;
  }

  private async getBusColor(bus: number): Promise<X32ChannelColor | number | undefined> {
    try {
      return parseBusColor(
        await this.client.request<OscMessage>(X32Protocol.getBusColorPath(bus), [], 1000),
      );
    } catch {
      return undefined;
    }
  }
}
