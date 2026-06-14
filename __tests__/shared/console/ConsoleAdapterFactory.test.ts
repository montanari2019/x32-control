import { ConsoleAdapterFactory } from '@shared/console/ConsoleAdapterFactory';
import { DemoConsoleAdapter } from '@shared/console/adapters/demo/DemoConsoleAdapter';
import { X32Adapter } from '@shared/console/adapters/x32/X32Adapter';
import { DEMO_CONSOLE_IP, DEV_MOCK_CONSOLE_IP } from '@shared/mixer/mock/mockMixerProvider';
import { X32Protocol } from '@shared/osc/X32Protocol';

describe('ConsoleAdapterFactory', () => {
  it('creates demo adapters for demo and dev mock endpoints', () => {
    const factory = new ConsoleAdapterFactory();

    expect(factory.createAdapter({ ip: DEMO_CONSOLE_IP })).toBeInstanceOf(DemoConsoleAdapter);
    expect(factory.createAdapter({ ip: DEV_MOCK_CONSOLE_IP })).toBeInstanceOf(DemoConsoleAdapter);
  });

  it('creates an X32 adapter for default real-console endpoints', () => {
    const adapter = new ConsoleAdapterFactory().createAdapter({ ip: '192.168.0.10' });

    expect(adapter).toBeInstanceOf(X32Adapter);
    expect(adapter.endpoint.port).toBe(X32Protocol.defaultPort);
  });

  it('does not create a runtime WING adapter yet', () => {
    expect(() =>
      new ConsoleAdapterFactory().createAdapter({
        ip: '192.168.0.20',
        port: 2223,
        kind: 'wing',
      }),
    ).toThrow(/not implemented/i);
  });
});

