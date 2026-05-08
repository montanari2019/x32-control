const storage = new Map<string, string>();

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async (key: string) => storage.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      storage.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      storage.delete(key);
    }),
    getAllKeys: jest.fn(async () => Array.from(storage.keys())),
  },
}));

import {
  BusMixPresetService,
  MAX_BUS_MIX_PRESETS,
} from '../../../../src/features/busMix/services/BusMixPresetService';

const makeChannels = (suffix: number) => [
  {
    channelId: 1,
    channelName: `Kick ${suffix}`,
    channelLabel: 'CH 01',
    kind: 'channel' as const,
    sourceNumber: 1,
    raw: 0.75,
    db: 0,
    mute: suffix % 2 === 0,
  },
];

describe('BusMixPresetService', () => {
  beforeEach(() => {
    storage.clear();
    jest.clearAllMocks();
  });

  it('keeps presets isolated by console and bus', async () => {
    const service = new BusMixPresetService();

    await service.savePreset('10.0.0.1', 1, 'Preset A', makeChannels(1));
    await service.savePreset('10.0.0.2', 1, 'Preset B', makeChannels(2));
    await service.savePreset('10.0.0.1', 2, 'Preset C', makeChannels(3));

    await expect(service.listPresets('10.0.0.1', 1)).resolves.toHaveLength(1);
    await expect(service.listPresets('10.0.0.2', 1)).resolves.toHaveLength(1);
    await expect(service.listPresets('10.0.0.1', 2)).resolves.toHaveLength(1);
  });

  it('overwrites an existing preset without creating duplicates', async () => {
    const service = new BusMixPresetService();
    const created = await service.savePreset('10.0.0.1', 1, 'Preset A', makeChannels(1));

    await service.overwritePreset('10.0.0.1', 1, created.id, makeChannels(2));

    const presets = await service.listPresets('10.0.0.1', 1);
    expect(presets).toHaveLength(1);
    expect(presets[0].channels[0].channelName).toBe('Kick 2');
    expect(presets[0].channels[0].mute).toBe(true);
  });

  it('deletes a preset from local persistence', async () => {
    const service = new BusMixPresetService();
    const first = await service.savePreset('10.0.0.1', 1, 'Preset A', makeChannels(1));
    const second = await service.savePreset('10.0.0.1', 1, 'Preset B', makeChannels(2));

    await expect(service.deletePreset('10.0.0.1', 1, first.id)).resolves.toHaveLength(1);

    const presets = await service.listPresets('10.0.0.1', 1);
    expect(presets).toHaveLength(1);
    expect(presets[0].id).toBe(second.id);
  });

  it('enforces the maximum preset limit per console and bus', async () => {
    const service = new BusMixPresetService();

    for (let index = 0; index < MAX_BUS_MIX_PRESETS; index += 1) {
      await service.savePreset('10.0.0.1', 1, `Preset ${index + 1}`, makeChannels(index));
    }

    await expect(
      service.savePreset('10.0.0.1', 1, 'Preset extra', makeChannels(99)),
    ).rejects.toThrow(
      `Limite maximo de ${MAX_BUS_MIX_PRESETS} presets atingido para este Bus Mix.`,
    );
  });
});
