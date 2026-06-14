import { isMockConsoleIp } from '@shared/mixer/mock/mockMixerProvider';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { OscClient } from '@shared/osc/OscClient';
import { ConsoleEndpoint } from './ConsoleEndpoint';
import { ConsoleAdapterKind } from './ConsoleAdapterKind';
import { IConsoleAdapter } from './IConsoleAdapter';
import { DemoConsoleAdapter } from './adapters/demo/DemoConsoleAdapter';
import { X32Adapter } from './adapters/x32/X32Adapter';

export type ConsoleAdapterFactoryOptions = {
  client?: OscClient;
  useSharedLease?: boolean;
};

const inferKind = (endpoint: ConsoleEndpoint): ConsoleAdapterKind => {
  if (endpoint.kind) {
    return endpoint.kind;
  }

  if (isMockConsoleIp(endpoint.ip)) {
    return 'demo';
  }

  return 'x32';
};

export class ConsoleAdapterFactory {
  createAdapter(
    endpoint: ConsoleEndpoint,
    options: ConsoleAdapterFactoryOptions = {},
  ): IConsoleAdapter {
    const normalizedEndpoint = {
      ...endpoint,
      port: endpoint.port ?? X32Protocol.defaultPort,
    };
    const kind = inferKind(normalizedEndpoint);

    switch (kind) {
      case 'demo':
        return new DemoConsoleAdapter({ ...normalizedEndpoint, kind });
      case 'x32':
        return new X32Adapter({ ...normalizedEndpoint, kind }, options);
      case 'wing':
        throw new Error('WING adapter is documented for future support but is not implemented.');
      default:
        throw new Error(`Unsupported console adapter kind: ${String(kind)}`);
    }
  }
}

