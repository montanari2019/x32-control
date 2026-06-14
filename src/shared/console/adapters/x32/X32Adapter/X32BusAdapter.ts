import type { Bus } from '@features/busSelection/types/Bus';
import type { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import {
  fetchBusStereoLinkMap,
  getCachedBusStereoLinkMap,
  normalizeStereoBusName,
  setCachedBusStereoLinkMap,
} from '@shared/x32/busStereoLink';
import type { X32ChannelColor } from '@shared/x32/channelColor';
import { X32AdapterContext } from './X32AdapterContext';
import { DEFAULT_BUS_NAMES } from './X32AdapterConstants';
import { parseBusColor } from './x32OscValueUtils';

export class X32BusAdapter {
  constructor(private readonly context: X32AdapterContext) {}

  async getBuses(): Promise<Bus[]> {
    const byNumber = new Map<number, Bus>();

    await Promise.all(
      Array.from({ length: 16 }, async (_, index) => {
        const number = index + 1;
        const fallback = DEFAULT_BUS_NAMES[index] ?? `Bus ${number.toString().padStart(2, '0')}`;

        try {
          const [response, color] = await Promise.all([
            this.context.client.request<OscMessage>(X32Protocol.getBusNamePath(number), [], 1000),
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

    const fetchedMap = await fetchBusStereoLinkMap(this.context.client);
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
          label: `Bus ${bus.toString().padStart(2, '0')}/${(bus + 1)
            .toString()
            .padStart(2, '0')}`,
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
        await this.context.client.request<OscMessage>(X32Protocol.getBusColorPath(bus), [], 1000),
      );
    } catch {
      return undefined;
    }
  }
}

