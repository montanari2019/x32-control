import { ConsoleAdapterFactory, IConsoleAdapter } from '@shared/console';
import { BusGroupsState } from '../types/busGroups.types';

type ConsoleAdapterClient = NonNullable<
  Parameters<ConsoleAdapterFactory['createAdapter']>[1]
>['client'];

export class BusGroupsService {
  private adapter?: IConsoleAdapter;
  private connectedConsoleIp?: string;

  constructor(
    private readonly client?: ConsoleAdapterClient,
    private readonly adapterFactory = new ConsoleAdapterFactory(),
  ) {}

  async connect(consoleIp: string): Promise<void> {
    if (this.adapter && this.connectedConsoleIp === consoleIp) {
      return;
    }

    this.adapter?.disconnect();
    this.adapter = this.createAdapter(consoleIp);
    this.connectedConsoleIp = consoleIp;
    await this.adapter.connect();
  }

  disconnect(): void {
    this.adapter?.disconnect();
    this.adapter = undefined;
    this.connectedConsoleIp = undefined;
  }

  startHeartbeat(): void {
    this.requireAdapter().startHeartbeat();
  }

  stopHeartbeat(): void {
    this.requireAdapter().stopHeartbeat();
  }

  fetchInitialState(busId: number): Promise<BusGroupsState> {
    return this.requireAdapter().getBusGroupsState(busId);
  }

  subscribeToDcaFader(dcaNumber: number, listener: (value: number) => void): () => void {
    return this.requireAdapter().subscribeDcaFader(dcaNumber, listener);
  }

  subscribeToDcaOn(dcaNumber: number, listener: (isMuted: boolean) => void): () => void {
    return this.requireAdapter().subscribeDcaOn(dcaNumber, listener);
  }

  subscribeToBusMasterFader(busId: number, listener: (value: number) => void): () => void {
    return this.requireAdapter().subscribeBusMasterFader(busId, listener);
  }

  subscribeToBusMasterOn(busId: number, listener: (isMuted: boolean) => void): () => void {
    return this.requireAdapter().subscribeBusMasterOn(busId, listener);
  }

  subscribeToBusMasterMeter(busId: number, listener: (dbfs: number) => void): () => void {
    return this.requireAdapter().subscribeBusMasterMeter(busId, listener);
  }

  setDcaFader(dcaNumber: number, value: number): Promise<void> {
    return this.requireAdapter().setDcaFader(dcaNumber, value);
  }

  setDcaOn(dcaNumber: number, isOn: boolean): Promise<void> {
    return this.requireAdapter().setDcaOn(dcaNumber, isOn);
  }

  setBusMasterFader(busId: number, value: number): Promise<void> {
    return this.requireAdapter().setBusMasterFader(busId, value);
  }

  setBusMasterOn(busId: number, isOn: boolean): Promise<void> {
    return this.requireAdapter().setBusMasterOn(busId, isOn);
  }

  private createAdapter(consoleIp: string): IConsoleAdapter {
    if (this.client) {
      return this.adapterFactory.createAdapter(
        { ip: consoleIp, kind: 'x32' },
        { client: this.client, useSharedLease: false },
      );
    }

    return this.adapterFactory.createAdapter({ ip: consoleIp });
  }

  private requireAdapter(): IConsoleAdapter {
    if (this.adapter) {
      return this.adapter;
    }

    if (this.client) {
      this.adapter = this.createAdapter('0.0.0.0');
      return this.adapter;
    }

    throw new Error('Console adapter is not connected.');
  }
}
