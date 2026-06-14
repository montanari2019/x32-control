import { OscClient } from '@shared/osc/OscClient';
import type { SharedOscClientLease } from '@shared/osc/SharedOscClient';
import type { ConsoleAdapterFactoryOptions } from '../../../ConsoleAdapterFactory';
import type { ConsoleEndpoint } from '../../../ConsoleEndpoint';

export class X32AdapterContext {
  client: OscClient;
  connectedConsoleIp?: string;
  sharedLease?: SharedOscClientLease;
  readonly useSharedLease: boolean;

  constructor(
    readonly endpoint: ConsoleEndpoint,
    options: ConsoleAdapterFactoryOptions = {},
  ) {
    this.client = options.client ?? new OscClient();
    this.useSharedLease = options.useSharedLease ?? !options.client;
  }
}

