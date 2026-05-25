import {
  applyLinkedLocalLevelUpdate,
  applyLinkedOnUpdate,
  applyLinkedRemoteLevelUpdate,
  applyPanUpdate,
  getLinkedPeerNumber,
} from '@features/busMix/utils/linkedChannelSync';
import { Channel } from '@features/busMix/types/Channel';

const createChannel = (number: number, overrides: Partial<Channel> = {}): Channel => ({
  id: `ch-${number}`,
  kind: 'channel',
  number,
  sourceNumber: number,
  label: `CH ${number.toString().padStart(2, '0')}`,
  name: `Channel ${number}`,
  color: 0,
  backgroundOpacity: 0.2,
  meterChannelId: number,
  faderRaw: 0.25,
  faderDb: -20,
  localFaderRaw: 0.25,
  remoteFaderRaw: 0.25,
  isDirty: false,
  lastLocalChangeAt: 0,
  meterDbfs: -60,
  visualMeterDbfs: -60,
  level: 0.25,
  signalLevel: 0,
  pan: 0.5,
  on: true,
  ...overrides,
});

const linkMap = new Map([
  [1, 2],
  [2, 1],
]);

describe('linkedChannelSync', () => {
  it('resolves linked peer numbers from the link map', () => {
    expect(getLinkedPeerNumber(1, linkMap)).toBe(2);
    expect(getLinkedPeerNumber(2, linkMap)).toBe(1);
    expect(getLinkedPeerNumber(3, linkMap)).toBeUndefined();
  });

  it('mirrors local level updates to a linked peer', () => {
    const result = applyLinkedLocalLevelUpdate([createChannel(1), createChannel(2)], 1, 0.75, {
      linkMap,
      markDirty: true,
      now: 1000,
    });

    expect(result).toEqual([
      expect.objectContaining({
        number: 1,
        faderRaw: 0.75,
        localFaderRaw: 0.75,
        level: 0.75,
        isDirty: true,
        lastLocalChangeAt: 1000,
      }),
      expect.objectContaining({
        number: 2,
        faderRaw: 0.75,
        localFaderRaw: 0.75,
        level: 0.75,
        isDirty: true,
        lastLocalChangeAt: 1000,
      }),
    ]);
  });

  it('mirrors local level updates from the right side back to the left side', () => {
    const result = applyLinkedLocalLevelUpdate([createChannel(1), createChannel(2)], 2, 0.65, {
      linkMap,
      markDirty: true,
      now: 2000,
    });

    expect(result[0]).toEqual(expect.objectContaining({ number: 1, faderRaw: 0.65 }));
    expect(result[1]).toEqual(expect.objectContaining({ number: 2, faderRaw: 0.65 }));
  });

  it('updates only the requested channel when no linked peer exists', () => {
    const result = applyLinkedLocalLevelUpdate([createChannel(1), createChannel(3)], 3, 0.5, {
      linkMap,
      markDirty: true,
      now: 1000,
    });

    expect(result[0]).toEqual(expect.objectContaining({ number: 1, faderRaw: 0.25 }));
    expect(result[1]).toEqual(expect.objectContaining({ number: 3, faderRaw: 0.5 }));
  });

  it('mirrors remote level updates to linked peers', () => {
    const result = applyLinkedRemoteLevelUpdate([createChannel(1), createChannel(2)], 1, 0.82, {
      linkMap,
      localProtectionWindowMs: 250,
      now: 1000,
    });

    expect(result[0]).toEqual(
      expect.objectContaining({ number: 1, faderRaw: 0.82, remoteFaderRaw: 0.82 }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({ number: 2, faderRaw: 0.82, remoteFaderRaw: 0.82 }),
    );
  });

  it('protects recently changed local faders from stale remote echo', () => {
    const result = applyLinkedRemoteLevelUpdate(
      [
        createChannel(1, { localFaderRaw: 0.7, lastLocalChangeAt: 900 }),
        createChannel(2, { localFaderRaw: 0.7, lastLocalChangeAt: 900 }),
      ],
      1,
      0.25,
      {
        linkMap,
        localProtectionWindowMs: 250,
        now: 1000,
      },
    );

    expect(result[0]).toEqual(
      expect.objectContaining({ number: 1, faderRaw: 0.7, remoteFaderRaw: 0.25 }),
    );
    expect(result[1]).toEqual(
      expect.objectContaining({ number: 2, faderRaw: 0.7, remoteFaderRaw: 0.25 }),
    );
  });

  it('mirrors on updates to linked peers', () => {
    const result = applyLinkedOnUpdate([createChannel(1), createChannel(2)], 1, false, {
      linkMap,
    });

    expect(result[0]).toEqual(expect.objectContaining({ number: 1, on: false }));
    expect(result[1]).toEqual(expect.objectContaining({ number: 2, on: false }));
  });

  it('does not mirror pan updates to linked peers', () => {
    const result = applyPanUpdate([createChannel(1), createChannel(2)], 1, 0.1);

    expect(result[0]).toEqual(expect.objectContaining({ number: 1, pan: 0.1 }));
    expect(result[1]).toEqual(expect.objectContaining({ number: 2, pan: 0.5 }));
  });
});
