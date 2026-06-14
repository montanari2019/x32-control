import type { ConsoleAdapterKind } from './ConsoleAdapterKind';

export type ConsoleEndpoint = {
  id?: string;
  ip: string;
  port?: number;
  name?: string;
  model?: string;
  firmware?: string;
  kind?: ConsoleAdapterKind;
};
