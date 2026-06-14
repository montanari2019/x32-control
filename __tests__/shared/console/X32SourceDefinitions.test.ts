import {
  getX32SourceDefinition,
  X32_SOURCE_DEFINITIONS,
} from '@shared/console/adapters/x32/X32SourceDefinitions';
import { X32Protocol } from '@shared/osc/X32Protocol';

describe('X32SourceDefinitions', () => {
  it('keeps current CH/AUX/FX send paths unchanged', () => {
    const channel = getX32SourceDefinition('channel');
    const aux = getX32SourceDefinition('aux');
    const fxReturn = getX32SourceDefinition('fxReturn');

    expect(channel.getLevelPath(1, 9)).toBe(X32Protocol.getBusSendLevelPath(1, 9));
    expect(channel.getOnPath(1, 9)).toBe(X32Protocol.getBusSendOnPath(1, 9));
    expect(channel.getPanPath(1, 9)).toBe(X32Protocol.getBusSendPanPath(1, 9));

    expect(aux.getLevelPath(2, 9)).toBe(X32Protocol.getAuxInBusSendLevelPath(2, 9));
    expect(aux.getOnPath(2, 9)).toBe(X32Protocol.getAuxInBusSendOnPath(2, 9));
    expect(aux.getPanPath(2, 9)).toBe(X32Protocol.getAuxInBusSendPanPath(2, 9));

    expect(fxReturn.getLevelPath(3, 9)).toBe(
      X32Protocol.getFxReturnBusSendLevelPath(3, 9),
    );
    expect(fxReturn.getOnPath(3, 9)).toBe(X32Protocol.getFxReturnBusSendOnPath(3, 9));
    expect(fxReturn.getPanPath(3, 9)).toBe(X32Protocol.getFxReturnBusSendPanPath(3, 9));
  });

  it('keeps the 48-source BusMix shape', () => {
    expect(X32_SOURCE_DEFINITIONS.map((source) => [source.kind, source.count])).toEqual([
      ['channel', 32],
      ['aux', 8],
      ['fxReturn', 8],
    ]);
  });
});

