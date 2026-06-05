import { i18next } from '@shared/i18n';
import { secureStore } from '@shared/storage';
import { BusMixPreset } from '../types/BusMixPreset';

const PRESETS_KEY = 'presets';
export const MAX_BUS_MIX_PRESETS = 10;

const normalizePresetName = (value: string): string => value.trim().replace(/\s+/g, ' ');

const sortByUpdatedAtDesc = (presets: BusMixPreset[]): BusMixPreset[] =>
  [...presets].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

export class BusMixPresetService {
  private getStore(consoleId: string, busId: number) {
    return secureStore.createScope(
      secureStore.buildScopedKey('console', consoleId, 'bus-mix', 'bus', String(busId)),
    );
  }

  async listPresets(consoleId: string, busId: number): Promise<BusMixPreset[]> {
    const store = this.getStore(consoleId, busId);
    const presets = (await store.getObject<BusMixPreset[]>(PRESETS_KEY)) ?? [];
    return sortByUpdatedAtDesc(
      presets.map((preset) => ({
        ...preset,
        consoleId,
        busId,
      })),
    );
  }

  async loadPreset(
    consoleId: string,
    busId: number,
    presetId: string,
  ): Promise<BusMixPreset | null> {
    const presets = await this.listPresets(consoleId, busId);
    return presets.find((preset) => preset.id === presetId) ?? null;
  }

  async savePreset(
    consoleId: string,
    busId: number,
    name: string,
    channels: BusMixPreset['channels'],
  ): Promise<BusMixPreset> {
    const normalizedName = normalizePresetName(name);
    if (!normalizedName) {
      throw new Error(i18next.t('errors.presetNameRequired'));
    }

    const presets = await this.listPresets(consoleId, busId);
    if (presets.length >= MAX_BUS_MIX_PRESETS) {
      throw new Error(
        i18next.t('errors.presetLimitReached', { max: MAX_BUS_MIX_PRESETS }),
      );
    }

    const now = new Date().toISOString();
    const preset: BusMixPreset = {
      id: `preset-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      name: normalizedName,
      consoleId,
      busId,
      createdAt: now,
      updatedAt: now,
      channels,
    };

    await this.persistPresets(consoleId, busId, [...presets, preset]);
    return preset;
  }

  async overwritePreset(
    consoleId: string,
    busId: number,
    presetId: string,
    channels: BusMixPreset['channels'],
  ): Promise<BusMixPreset> {
    const presets = await this.listPresets(consoleId, busId);
    const existing = presets.find((preset) => preset.id === presetId);

    if (!existing) {
      throw new Error(i18next.t('errors.presetNotFound'));
    }

    const updatedPreset: BusMixPreset = {
      ...existing,
      updatedAt: new Date().toISOString(),
      channels,
    };

    await this.persistPresets(
      consoleId,
      busId,
      presets.map((preset) => (preset.id === presetId ? updatedPreset : preset)),
    );

    return updatedPreset;
  }

  async deletePreset(consoleId: string, busId: number, presetId: string): Promise<BusMixPreset[]> {
    const presets = await this.listPresets(consoleId, busId);
    const nextPresets = presets.filter((preset) => preset.id !== presetId);
    await this.persistPresets(consoleId, busId, nextPresets);
    return this.listPresets(consoleId, busId);
  }

  private async persistPresets(
    consoleId: string,
    busId: number,
    presets: BusMixPreset[],
  ): Promise<void> {
    const store = this.getStore(consoleId, busId);
    await store.setObject(PRESETS_KEY, sortByUpdatedAtDesc(presets));
  }
}
