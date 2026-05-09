import {
  MCA_DEFAULT_RAW_VALUE,
  McaChannelFaderService,
} from '@features/busGroups/services/McaChannelFaderService';
import { McaAssignedChannel } from '@features/busGroups/types/busGroups.types';
import { busMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { BusMixService } from '@features/busMix/services/BusMixService';
import { Channel } from '@features/busMix/types/Channel';

const TEST_CONSOLE_IP = '192.168.1.20';
const TEST_BUS_ID = 3;

const createChannel = (overrides: Partial<Channel> = {}): Channel => ({
  id: 'ch-1',
  kind: 'channel',
  number: 1,
  sourceNumber: 1,
  label: 'CH 01',
  name: 'Lead Vox',
  color: 0,
  backgroundOpacity: 0.2,
  meterChannelId: 1,
  faderRaw: 0.75,
  faderDb: 0,
  localFaderRaw: 0.75,
  remoteFaderRaw: 0.75,
  isDirty: false,
  lastLocalChangeAt: 0,
  meterDbfs: -60,
  visualMeterDbfs: -60,
  level: 0.75,
  signalLevel: 0,
  pan: 0.5,
  on: true,
  ...overrides,
});

const createAssignedChannel = (channelId: number): McaAssignedChannel => ({
  channelId,
  channelLabel: `CH ${channelId.toString().padStart(2, '0')}`,
  channelName: `Channel ${channelId}`,
  channelType: 'channel',
});

describe('McaChannelFaderService', () => {
  const setChannelFaderInBus = jest.fn(async () => undefined);
  const setChannelOnInBus = jest.fn(async () => undefined);
  const busMixService = {
    setChannelFaderInBus,
    setChannelOnInBus,
  } as unknown as BusMixService;
  const service = new McaChannelFaderService(busMixService);

  beforeEach(() => {
    setChannelFaderInBus.mockClear();
    setChannelOnInBus.mockClear();
    busMixChannelStore.clearConsole(TEST_CONSOLE_IP);
  });

  it('returns the default raw value when the MCA has no assigned channels', () => {
    expect(service.computeAverageRaw(TEST_CONSOLE_IP, TEST_BUS_ID, [])).toBe(MCA_DEFAULT_RAW_VALUE);
  });

  it('computes the MCA average from the assigned channel faders', () => {
    busMixChannelStore.setChannels(TEST_CONSOLE_IP, TEST_BUS_ID, [
      createChannel({ number: 1, sourceNumber: 1, faderRaw: 0.5 }),
      createChannel({ id: 'ch-2', number: 2, sourceNumber: 2, faderRaw: 0.75 }),
      createChannel({ id: 'ch-3', number: 3, sourceNumber: 3, faderRaw: 0.25 }),
    ]);

    const average = service.computeAverageRaw(TEST_CONSOLE_IP, TEST_BUS_ID, [
      createAssignedChannel(1),
      createAssignedChannel(3),
    ]);

    expect(average).toBeCloseTo(0.375, 5);
  });

  it('applies the MCA delta proportionally in dB and updates the shared store', async () => {
    busMixChannelStore.setChannels(TEST_CONSOLE_IP, TEST_BUS_ID, [
      createChannel({ number: 1, sourceNumber: 1, faderRaw: 0.5, localFaderRaw: 0.5, level: 0.5 }),
      createChannel({
        id: 'ch-2',
        number: 2,
        sourceNumber: 2,
        faderRaw: 0.25,
        localFaderRaw: 0.25,
        level: 0.25,
      }),
    ]);

    await service.applyProportionalFader(
      TEST_CONSOLE_IP,
      TEST_BUS_ID,
      [createAssignedChannel(1), createAssignedChannel(2)],
      0.5,
      0.75,
    );

    expect(setChannelFaderInBus).toHaveBeenCalledTimes(2);
    expect(setChannelFaderInBus).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ number: 1 }),
      TEST_BUS_ID,
      0.75,
    );
    expect(setChannelFaderInBus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ number: 2 }),
      TEST_BUS_ID,
      0.375,
    );

    expect(busMixChannelStore.getSnapshot(TEST_CONSOLE_IP, TEST_BUS_ID)).toEqual([
      expect.objectContaining({ number: 1, faderRaw: 0.75, localFaderRaw: 0.75, level: 0.75 }),
      expect.objectContaining({
        number: 2,
        faderRaw: 0.375,
        localFaderRaw: 0.375,
        level: 0.375,
      }),
    ]);
  });

  it('mutes all assigned channels in the bus and reflects the new on-state in the store', async () => {
    busMixChannelStore.setChannels(TEST_CONSOLE_IP, TEST_BUS_ID, [
      createChannel({ number: 1, sourceNumber: 1, on: true }),
      createChannel({ id: 'ch-2', number: 2, sourceNumber: 2, on: true }),
    ]);

    await service.applyMuteToChannels(
      TEST_CONSOLE_IP,
      TEST_BUS_ID,
      [createAssignedChannel(1), createAssignedChannel(2)],
      true,
    );

    expect(setChannelOnInBus).toHaveBeenCalledTimes(2);
    expect(setChannelOnInBus).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ number: 1 }),
      TEST_BUS_ID,
      false,
    );
    expect(setChannelOnInBus).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ number: 2 }),
      TEST_BUS_ID,
      false,
    );

    expect(
      busMixChannelStore.getSnapshot(TEST_CONSOLE_IP, TEST_BUS_ID).every((channel) => !channel.on),
    ).toBe(true);
  });
});
