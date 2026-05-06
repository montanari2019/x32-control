import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import {
  fetchBusStereoLinkMap,
  getCachedBusStereoLinkMap,
  normalizeStereoBusName,
  setCachedBusStereoLinkMap,
} from '@shared/x32/busStereoLink';
import { Bus } from '../types/Bus';

const defaultBusNames = ['Guitarra', 'Baixo', 'Bateria', 'Vocal', 'Click', 'Playback'];

export class BusService {
  constructor(private readonly client = new OscClient()) {}

  async connect(consoleIp: string): Promise<void> {
    await this.client.connect(consoleIp);
    this.client.startXRemoteKeepAlive();
  }

  disconnect(): void {
    this.client.disconnect();
  }

  async getBuses(): Promise<Bus[]> {
    const byNumber = new Map<number, Bus>();

    await Promise.all(
      Array.from({ length: 16 }, async (_, index) => {
        const number = index + 1;
        const fallback = defaultBusNames[index] ?? `Bus ${number.toString().padStart(2, '0')}`;

        try {
          const response = await this.client.request<OscMessage>(
            X32Protocol.getBusNamePath(number),
            [],
            1000,
          );
          const customName = response.args[0];
          const name = typeof customName === 'string' && customName.trim() ? customName : fallback;

          byNumber.set(number, {
            number,
            label: `Bus ${number.toString().padStart(2, '0')}`,
            name,
          });
        } catch {
          byNumber.set(number, {
            number,
            label: `Bus ${number.toString().padStart(2, '0')}`,
            name: fallback,
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
        const rightName = byNumber.get(bus + 1)?.name ?? '';
        const { name } = normalizeStereoBusName(leftName, rightName);

        result.push({
          ...current,
          name,
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
}
