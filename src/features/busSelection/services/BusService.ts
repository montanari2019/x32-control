import { ConsoleAdapterFactory, IConsoleAdapter } from '@shared/console';
import { Bus } from '../types/Bus';

export class BusService {
  private adapter?: IConsoleAdapter;

  constructor(private readonly adapterFactory = new ConsoleAdapterFactory()) {}

  async connect(consoleIp: string): Promise<void> {
    this.adapter?.disconnect();
    this.adapter = this.adapterFactory.createAdapter({ ip: consoleIp });
    await this.adapter.connect();
    this.adapter.startHeartbeat();
  }

  disconnect(): void {
    this.adapter?.disconnect();
    this.adapter = undefined;
  }

  async getBuses(): Promise<Bus[]> {
    if (!this.adapter) {
      throw new Error('Console adapter is not connected.');
    }

    return this.adapter.getBuses();
  }
}
