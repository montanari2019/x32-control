import { X32Protocol } from '../../../src/shared/osc/X32Protocol';

describe('X32Protocol', () => {
  it('builds documented X32 paths', () => {
    expect(X32Protocol.getInfoPath()).toBe('/info');
    expect(X32Protocol.getStatusPath()).toBe('/status');
    expect(X32Protocol.getChannelNamePath(1)).toBe('/ch/01/config/name');
    expect(X32Protocol.getChannelColorPath(32)).toBe('/ch/32/config/color');
    expect(X32Protocol.getBusNamePath(3)).toBe('/bus/03/config/name');
    expect(X32Protocol.getBusColorPath(3)).toBe('/bus/03/config/color');
    expect(X32Protocol.getBusSendLevelPath(1, 3)).toBe('/ch/01/mix/03/level');
    expect(X32Protocol.getBusSendOnPath(2, 16)).toBe('/ch/02/mix/16/on');
    expect(X32Protocol.getBusMasterFaderPath(7)).toBe('/bus/07/mix/fader');
  });

  it('rejects out of range channels and buses', () => {
    expect(() => X32Protocol.getBusSendLevelPath(0, 1)).toThrow(RangeError);
    expect(() => X32Protocol.getBusSendLevelPath(1, 17)).toThrow(RangeError);
  });
});
