import { X32Adapter } from '@shared/console/adapters/x32/X32Adapter';
import { X32Protocol } from '@shared/osc/X32Protocol';

const createFloatMeterBlob = (linearValues: number[]): Uint8Array => {
  const count = linearValues.length;
  const buffer = new ArrayBuffer(4 + count * 4);
  const view = new DataView(buffer);

  view.setUint32(0, count, true);
  linearValues.forEach((value, index) => {
    view.setFloat32(4 + index * 4, value, true);
  });

  return new Uint8Array(buffer);
};

describe('X32Adapter Bus Master meter', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('subscribes to the /meters/2 BUS master stream and renews it', () => {
    const listeners = new Map<string, (message: { args: unknown[] }) => void>();
    const unsubscribe = jest.fn();
    const client = {
      send: jest.fn(async () => undefined),
      subscribe: jest.fn((address: string, listener: (message: { args: unknown[] }) => void) => {
        listeners.set(address, listener);
        return unsubscribe;
      }),
    };
    const adapter = new X32Adapter(
      { ip: '192.168.10.50', kind: 'x32' },
      { client: client as never, useSharedLease: false },
    );
    const listener = jest.fn();

    const cleanup = adapter.subscribeBusMasterMeter(9, listener);

    expect(client.subscribe).toHaveBeenCalledWith(
      X32Protocol.getMeters2Path(),
      expect.any(Function),
    );
    expect(client.send).toHaveBeenCalledWith(X32Protocol.getMetersSubscribePath(), [
      X32Protocol.getMeters2Path(),
    ]);

    const values = new Array(49).fill(0.001);
    values[8] = 0.5;
    listeners.get(X32Protocol.getMeters2Path())?.({
      args: [createFloatMeterBlob(values)],
    });

    expect(listener.mock.calls[0]?.[0]).toBeCloseTo(-6, 0);

    jest.advanceTimersByTime(8000);
    expect(client.send).toHaveBeenCalledTimes(2);

    cleanup();
    jest.advanceTimersByTime(8000);

    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(client.send).toHaveBeenCalledTimes(2);
  });

  it('ignores malformed meter messages without notifying listeners', () => {
    const listeners = new Map<string, (message: { args: unknown[] }) => void>();
    const client = {
      send: jest.fn(async () => undefined),
      subscribe: jest.fn((address: string, listener: (message: { args: unknown[] }) => void) => {
        listeners.set(address, listener);
        return jest.fn();
      }),
    };
    const adapter = new X32Adapter(
      { ip: '192.168.10.50', kind: 'x32' },
      { client: client as never, useSharedLease: false },
    );
    const listener = jest.fn();

    const cleanup = adapter.subscribeBusMasterMeter(1, listener);

    listeners.get(X32Protocol.getMeters2Path())?.({ args: ['not-a-blob'] });

    expect(listener).not.toHaveBeenCalled();

    cleanup();
  });
});
