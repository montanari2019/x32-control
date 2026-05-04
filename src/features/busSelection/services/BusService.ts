import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { Bus } from '../types/Bus';

const defaultBusNames = [
  'Guitarra',
  'Baixo',
  'Bateria',
  'Vocal',
  'Click',
  'Playback',
];

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
    const buses = await Promise.all(
      Array.from({ length: 16 }, async (_, index) => {
        const number = index + 1;
        const fallback =
          defaultBusNames[index] ?? `Bus ${number.toString().padStart(2, '0')}`;

        try {
          const response = await this.client.request<OscMessage>(
            X32Protocol.getBusNamePath(number),
            [],
            1000,
          );
          const customName = response.args[0];
          const name =
            typeof customName === 'string' && customName.trim()
              ? customName
              : fallback;
          return {
            number,
            label: `Bus ${number.toString().padStart(2, '0')}`,
            name,
          };
        } catch {
          return {
            number,
            label: `Bus ${number.toString().padStart(2, '0')}`,
            name: fallback,
          };
        }
      }),
    );

    return buses;
  }
}
