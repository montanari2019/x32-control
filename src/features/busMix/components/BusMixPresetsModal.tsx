import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '@shared/components/Button';
import { ModalRenderProps, useModal } from '@shared/components/Modal';
import Toast from '@shared/components/Toast';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import Dialog from '@shared/components/Dialog';
import { getErrorMessage } from '@shared/errors/AppError';
import { BusMixPreset } from '../types/BusMixPreset';

type BusMixPresetsModalProps = ModalRenderProps & {
  presets: BusMixPreset[];
  maxPresets: number;
  isRestoringPreset: boolean;
  onRefreshPresets: () => Promise<BusMixPreset[]>;
  onCreatePreset: (name: string) => Promise<BusMixPreset[]>;
  onOverwritePreset: (presetId: string) => Promise<BusMixPreset[]>;
  onRestorePreset: (presetId: string) => Promise<void>;
};

export const BusMixPresetsModal = ({
  visible,
  onDismiss,
  onDismissEnd,
  presets,
  maxPresets,
  isRestoringPreset,
  onRefreshPresets,
  onCreatePreset,
  onOverwritePreset,
  onRestorePreset,
}: BusMixPresetsModalProps): JSX.Element => {
  const { showModal } = useModal();
  const [presetList, setPresetList] = useState<BusMixPreset[]>(presets);
  const [isLoadingPresets, setIsLoadingPresets] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [pendingPresetId, setPendingPresetId] = useState<string | null>(null);

  useEffect(() => {
    setPresetList(presets);
  }, [presets]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setIsLoadingPresets(true);
    onRefreshPresets()
      .then((nextPresets) => setPresetList(nextPresets))
      .catch(() => undefined)
      .finally(() => setIsLoadingPresets(false));
  }, [onRefreshPresets, visible]);

  const canCreateMore = presetList.length < maxPresets;
  const helperText = useMemo(
    () => `Presets salvos: ${presetList.length}/${maxPresets}`,
    [maxPresets, presetList.length],
  );

  const handleCreate = async (): Promise<void> => {
    try {
      setPendingPresetId('new');
      const nextPresets = await onCreatePreset(presetName);
      setPresetList(nextPresets);
      setPresetName('');
      setIsCreating(false);
      showModal(Toast, {
        title: 'Preset salvo',
        message: 'O estado atual do Bus Mix foi salvo localmente neste dispositivo.',
        variant: 'success',
      });
    } catch (error) {
      showModal(Toast, {
        title: 'Falha ao salvar preset',
        message: getErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setPendingPresetId(null);
    }
  };

  const handleOverwrite = async (presetId: string): Promise<void> => {
    try {
      setPendingPresetId(presetId);
      const nextPresets = await onOverwritePreset(presetId);
      setPresetList(nextPresets);
      showModal(Toast, {
        title: 'Preset atualizado',
        message: 'O preset foi sobrescrito com os niveis atuais do Bus Mix.',
        variant: 'success',
      });
    } catch (error) {
      showModal(Toast, {
        title: 'Falha ao sobrescrever',
        message: getErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setPendingPresetId(null);
    }
  };

  const handleRestore = async (presetId: string): Promise<void> => {
    try {
      onDismiss?.();
      await onRestorePreset(presetId);
      showModal(Toast, {
        title: 'Preset restaurado',
        message: 'Os volumes salvos foram aplicados ao Bus Mix e enviados para a mesa.',
        variant: 'success',
      });
    } catch (error) {
      showModal(Toast, {
        title: 'Falha ao restaurar',
        message: getErrorMessage(error),
        variant: 'error',
      });
    }
  };

  return (
    <Dialog
      visible={visible}
      onDismiss={onDismiss}
      onDismissEnd={onDismissEnd}
      containerStyle={styles.dialog}
      dismissible={!isRestoringPreset}
    >
      <Dialog.Header>
        <Dialog.Title>Presets do Bus Mix</Dialog.Title>
        <Dialog.Message>
          <View style={styles.headerBlock}>
            <Text style={styles.helperText}>{helperText}</Text>
            <Text style={styles.helperSubtext}>
              Os presets ficam salvos apenas neste dispositivo e separados por console e bus.
            </Text>
          </View>
        </Dialog.Message>
      </Dialog.Header>

      <Button
        title="Novo Preset"
        onPress={() => setIsCreating((current) => !current)}
        variant="secondary"
        disabled={!canCreateMore || isRestoringPreset || isLoadingPresets}
        style={styles.newPresetButton}
      />

      {isCreating ? (
        <View style={styles.createBlock}>
          <TextInput
            value={presetName}
            onChangeText={setPresetName}
            placeholder="Digite o nome do preset"
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            autoFocus
            maxLength={40}
          />
          <View style={styles.createActions}>
            <Button
              title="Salvar Preset"
              onPress={() => {
                handleCreate().catch(() => undefined);
              }}
              disabled={!presetName.trim()}
              loading={pendingPresetId === 'new'}
              style={styles.actionButton}
            />
            <Button
              title="Cancelar"
              onPress={() => {
                setPresetName('');
                setIsCreating(false);
              }}
              variant="secondary"
              disabled={pendingPresetId === 'new'}
              style={styles.actionButton}
            />
          </View>
        </View>
      ) : null}

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {isLoadingPresets ? (
          <Text style={styles.emptyText}>Carregando presets...</Text>
        ) : null}

        {!isLoadingPresets && presetList.length === 0 ? (
          <Text style={styles.emptyText}>Nenhum preset salvo para este Bus Mix.</Text>
        ) : null}

        {!isLoadingPresets
          ? presetList.map((preset) => (
              <View key={preset.id} style={styles.presetRow}>
                <View style={styles.presetInfo}>
                  <Text style={styles.presetName} numberOfLines={1}>
                    {preset.name}
                  </Text>
                  <Text style={styles.presetMeta}>
                    Atualizado em {new Date(preset.updatedAt).toLocaleString('pt-BR')}
                  </Text>
                </View>

                <View style={styles.iconActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Sobrescrever preset ${preset.name}`}
                    onPress={() => {
                      handleOverwrite(preset.id).catch(() => undefined);
                    }}
                    disabled={pendingPresetId !== null || isRestoringPreset}
                    style={({ pressed }) => [
                      styles.iconButton,
                      pressed && styles.iconButtonPressed,
                      (pendingPresetId !== null || isRestoringPreset) && styles.iconButtonDisabled,
                    ]}
                  >
                    <Text style={styles.iconText}>↺</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Restaurar preset ${preset.name}`}
                    onPress={() => {
                      handleRestore(preset.id).catch(() => undefined);
                    }}
                    disabled={pendingPresetId !== null || isRestoringPreset}
                    style={({ pressed }) => [
                      styles.iconButton,
                      styles.restoreButton,
                      pressed && styles.iconButtonPressed,
                      (pendingPresetId !== null || isRestoringPreset) && styles.iconButtonDisabled,
                    ]}
                  >
                    <Text style={styles.iconText}>▶</Text>
                  </Pressable>
                </View>
              </View>
            ))
          : null}
      </ScrollView>
    </Dialog>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    flex: 1,
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  createBlock: {
    gap: spacing.sm,
  },
  dialog: {
    gap: spacing.md,
    maxHeight: '82%',
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  headerBlock: {
    gap: spacing.xxs,
  },
  helperSubtext: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  helperText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  iconActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface.elevated,
    borderColor: colors.border.active,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconButtonDisabled: {
    opacity: 0.45,
  },
  iconButtonPressed: {
    opacity: 0.8,
  },
  iconText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text.primary,
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  list: {
    maxHeight: 320,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  newPresetButton: {
    width: '100%',
  },
  presetInfo: {
    flex: 1,
    gap: spacing.xxs,
    paddingRight: spacing.sm,
  },
  presetMeta: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  presetName: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  presetRow: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  restoreButton: {
    borderColor: colors.border.blue,
  },
});
