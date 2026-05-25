import {
  dispatchMeterStreamBlob,
  getMeterStreamForChannelId,
  isAuxFxMeterId,
  isInputChannelMeterId,
  MeterListener,
} from '../../../../src/features/busMix/utils/meterStreamRouting';

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

const createListenersMap = (
  entries: Array<[number, MeterListener]>,
): Map<number, Set<MeterListener>> => {
  const map = new Map<number, Set<MeterListener>>();
  entries.forEach(([channelId, listener]) => {
    const listeners = map.get(channelId) ?? new Set<MeterListener>();
    listeners.add(listener);
    map.set(channelId, listeners);
  });
  return map;
};

describe('meter stream routing', () => {
  it('classifies BusMix meter channel IDs by X32 meter stream ownership', () => {
    expect(isInputChannelMeterId(0)).toBe(false);
    expect(isInputChannelMeterId(1)).toBe(true);
    expect(isInputChannelMeterId(32)).toBe(true);
    expect(isInputChannelMeterId(33)).toBe(false);

    expect(isAuxFxMeterId(32)).toBe(false);
    expect(isAuxFxMeterId(33)).toBe(true);
    expect(isAuxFxMeterId(40)).toBe(true);
    expect(isAuxFxMeterId(41)).toBe(true);
    expect(isAuxFxMeterId(48)).toBe(true);
    expect(isAuxFxMeterId(49)).toBe(false);

    expect(getMeterStreamForChannelId(0)).toBeUndefined();
    expect(getMeterStreamForChannelId(1)).toBe('meters1');
    expect(getMeterStreamForChannelId(32)).toBe('meters1');
    expect(getMeterStreamForChannelId(33)).toBe('meters13');
    expect(getMeterStreamForChannelId(48)).toBe('meters13');
    expect(getMeterStreamForChannelId(49)).toBeUndefined();
  });

  it('dispatches /meters/1 only to CH01-CH32 listeners', () => {
    const ch01Listener = jest.fn();
    const aux01Listener = jest.fn();
    const values = new Array(96).fill(0.001);
    values[0] = 0.5;
    values[32] = 1.0;
    const blob = createFloatMeterBlob(values);

    dispatchMeterStreamBlob(
      'meters1',
      blob,
      createListenersMap([
        [1, ch01Listener],
        [33, aux01Listener],
      ]),
    );

    expect(ch01Listener).toHaveBeenCalledTimes(1);
    expect(ch01Listener.mock.calls[0][0].preFadeDbfs).toBeCloseTo(-6, 0);
    expect(aux01Listener).not.toHaveBeenCalled();
  });

  it('dispatches /meters/13 only to AUX/FX Return listeners', () => {
    const ch01Listener = jest.fn();
    const aux01Listener = jest.fn();
    const values = new Array(48).fill(0.001);
    values[0] = 1.0;
    values[32] = 0.5;
    const blob = createFloatMeterBlob(values);

    dispatchMeterStreamBlob(
      'meters13',
      blob,
      createListenersMap([
        [1, ch01Listener],
        [33, aux01Listener],
      ]),
    );

    expect(ch01Listener).not.toHaveBeenCalled();
    expect(aux01Listener).toHaveBeenCalledTimes(1);
    expect(aux01Listener.mock.calls[0][0].preFadeDbfs).toBeCloseTo(-6, 0);
  });

  it('prevents AUX/FX flicker caused by /meters/1 gate or dynamics values', () => {
    const aux01Listener = jest.fn();
    const listeners = createListenersMap([[33, aux01Listener]]);
    const meters1Values = new Array(96).fill(0.001);
    meters1Values[32] = 1.0;
    const meters13Values = new Array(48).fill(0.001);
    meters13Values[32] = 0.25;

    dispatchMeterStreamBlob('meters1', createFloatMeterBlob(meters1Values), listeners);
    dispatchMeterStreamBlob('meters13', createFloatMeterBlob(meters13Values), listeners);

    expect(aux01Listener).toHaveBeenCalledTimes(1);
    expect(aux01Listener.mock.calls[0][0].preFadeDbfs).toBeCloseTo(-12, 0);
  });
});
