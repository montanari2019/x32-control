jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

import { BusMixService } from '@features/busMix/services/BusMixService';
import { Channel } from '@features/busMix/types/Channel';
import { OscClient, OscScalarSubscriptionOptions } from '@shared/osc/OscClient';

const createChannel = (overrides: Partial<Channel> = {}): Channel => ({
  id: 'ch-17',
  kind: 'channel',
  number: 17,
  sourceNumber: 17,
  label: 'CH 17',
  name: 'CH 17',
  color: 0,
  backgroundOpacity: 0.2,
  meterChannelId: 17,
  faderRaw: 0.5,
  faderDb: 0,
  localFaderRaw: 0.5,
  remoteFaderRaw: 0.5,
  isDirty: false,
  lastLocalChangeAt: 0,
  meterDbfs: -60,
  visualMeterDbfs: -60,
  level: 0.5,
  signalLevel: 0,
  pan: 0.5,
  on: true,
  ...overrides,
});

class FakeOscClient {
  subscribeScalarValue = jest.fn((_options: OscScalarSubscriptionOptions) => () => undefined);
}

describe('BusMixService', () => {
  it('subscribes BusMix CH fader updates to the send-level path, not the main fader', () => {
    const client = new FakeOscClient();
    const service = new BusMixService(client as unknown as OscClient);

    service.subscribeChannelLevelUpdates(createChannel(), 1, jest.fn());

    expect(client.subscribeScalarValue).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '/ch/17/mix/01/level',
      }),
    );
    expect(client.subscribeScalarValue).not.toHaveBeenCalledWith(
      expect.objectContaining({
        address: '/ch/17/mix/fader',
      }),
    );
  });

  it('subscribes AUX and FX Return BusMix faders to their send-level paths', () => {
    const client = new FakeOscClient();
    const service = new BusMixService(client as unknown as OscClient);

    service.subscribeChannelLevelUpdates(
      createChannel({ id: 'aux-1', kind: 'aux', number: 33, sourceNumber: 1, label: 'AUX 01' }),
      3,
      jest.fn(),
    );
    service.subscribeChannelLevelUpdates(
      createChannel({
        id: 'fxrtn-1',
        kind: 'fxReturn',
        number: 41,
        sourceNumber: 1,
        label: 'FX 01',
      }),
      3,
      jest.fn(),
    );

    expect(client.subscribeScalarValue).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        address: '/auxin/01/mix/03/level',
      }),
    );
    expect(client.subscribeScalarValue).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        address: '/fxrtn/01/mix/03/level',
      }),
    );
  });

  it('clamps incoming subscribed fader values before notifying listeners', () => {
    const client = new FakeOscClient();
    const service = new BusMixService(client as unknown as OscClient);
    const listener = jest.fn();

    service.subscribeChannelLevelUpdates(createChannel(), 1, listener);

    const options = client.subscribeScalarValue.mock.calls[0][0];
    options.listener({
      address: '/ch/17/mix/01/level',
      args: [1.4],
    });

    expect(listener).toHaveBeenCalledWith(1);
  });
});
