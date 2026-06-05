import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icons } from '@assets';
import { Button } from '@shared/components/Button';
import Dialog from '@shared/components/Dialog';
import { ModalRenderProps, useModal } from '@shared/components/Modal';
import Toast from '@shared/components/Toast';
import { getErrorMessage } from '@shared/errors/AppError';
import { getCurrentLocale } from '@shared/i18n';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { BusMixPreset } from '../types/BusMixPreset';

const RESTORE_SUCCESS_TOAST_DURATION_MS = 500;

type BusMixPresetsModalProps = ModalRenderProps & {
  presets: BusMixPreset[];
  maxPresets: number;
  isRestoringPreset: boolean;
  onRefreshPresets: () => Promise<BusMixPreset[]>;
  onCreatePreset: (name: string) => Promise<BusMixPreset[]>;
  onOverwritePreset: (presetId: string) => Promise<BusMixPreset[]>;
  onDeletePreset: (presetId: string) => Promise<BusMixPreset[]>;
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
  onDeletePreset,
  onRestorePreset,
}: BusMixPresetsModalProps): JSX.Element => {
  const { showModal } = useModal();
  const { t } = useTranslation();
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
    () => t('busMix.presets.savedCount', { count: presetList.length, max: maxPresets }),
    [maxPresets, presetList.length, t],
  );

  const handleCreate = async (): Promise<void> => {
    try {
      setPendingPresetId('new');
      const nextPresets = await onCreatePreset(presetName);
      setPresetList(nextPresets);
      setPresetName('');
      setIsCreating(false);
      showModal(Toast, {
        title: t('busMix.presets.savedTitle'),
        message: t('busMix.presets.savedMessage'),
        variant: 'success',
      });
    } catch (error) {
      showModal(Toast, {
        title: t('busMix.presets.saveFailureTitle'),
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
        title: t('busMix.presets.updateTitle'),
        message: t('busMix.presets.updateMessage'),
        variant: 'success',
      });
    } catch (error) {
      showModal(Toast, {
        title: t('busMix.presets.overwriteFailureTitle'),
        message: getErrorMessage(error),
        variant: 'error',
      });
    } finally {
      setPendingPresetId(null);
    }
  };

  const handleDelete = async (presetId: string, presetNameValue: string): Promise<void> => {
    try {
      setPendingPresetId(`delete:${presetId}`);
      const nextPresets = await onDeletePreset(presetId);
      setPresetList(nextPresets);
      showModal(Toast, {
        title: t('busMix.presets.removedTitle'),
        message: t('busMix.presets.removedMessage', { name: presetNameValue }),
        variant: 'success',
      });
    } catch (error) {
      showModal(Toast, {
        title: t('busMix.presets.removeFailureTitle'),
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
        title: t('busMix.presets.restoredTitle'),
        message: t('busMix.presets.restoredMessage'),
        variant: 'success',
        timeToCloseInMilliseconds: RESTORE_SUCCESS_TOAST_DURATION_MS,
      });
    } catch (error) {
      showModal(Toast, {
        title: t('busMix.presets.restoreFailureTitle'),
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
      animationDuration={0}
      backdropStyle={styles.dialogBackdrop}
      containerStyle={styles.dialog}
      dismissible={!isRestoringPreset}
    >
      <View style={styles.modalHeader}>
        <View style={styles.modalTitleBlock}>
          <Text style={styles.modalTitle}>{t('busMix.presets.title')}</Text>
          <View style={styles.headerBlock}>
            <Text style={styles.helperText}>{helperText}</Text>
            <Text style={styles.helperSubtext}>
              {t('busMix.presets.helper')}
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.closePresetsModal')}
          disabled={isRestoringPreset}
          onPress={onDismiss}
          style={({ pressed }) => [
            styles.closeButton,
            pressed && styles.closeButtonPressed,
            isRestoringPreset && styles.closeButtonDisabled,
          ]}
        >
          <Icons.Close color={colors.text.primary} width={14} height={14} />
        </Pressable>
      </View>

      <Button
        title={t('busMix.presets.newPreset')}
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
            placeholder={t('busMix.presets.namePlaceholder')}
            placeholderTextColor={colors.text.tertiary}
            style={styles.input}
            autoFocus
            maxLength={40}
          />
          <View style={styles.createActions}>
            <Button
              title={t('busMix.presets.savePreset')}
              onPress={() => {
                handleCreate().catch(() => undefined);
              }}
              disabled={!presetName.trim()}
              loading={pendingPresetId === 'new'}
              style={styles.actionButton}
            />
            <Button
              title={t('common.actions.cancel')}
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
        {isLoadingPresets ? <Text style={styles.emptyText}>{t('busMix.presets.loading')}</Text> : null}

        {!isLoadingPresets && presetList.length === 0 ? (
          <Text style={styles.emptyText}>{t('busMix.presets.empty')}</Text>
        ) : null}

        {!isLoadingPresets
          ? presetList.map((preset) => (
              <View key={preset.id} style={styles.presetRow}>
                <View style={styles.presetInfo}>
                  <Text style={styles.presetName} numberOfLines={1}>
                    {preset.name}
                  </Text>
                  <Text style={styles.presetMeta}>
                    {t('busMix.presets.updatedAt', {
                      date: new Date(preset.updatedAt).toLocaleString(getCurrentLocale()),
                    })}
                  </Text>
                </View>

                <View style={styles.iconActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('accessibility.removePreset', { name: preset.name })}
                    onPress={() => {
                      handleDelete(preset.id, preset.name).catch(() => undefined);
                    }}
                    disabled={pendingPresetId !== null || isRestoringPreset}
                    style={({ pressed }) => [
                      styles.iconButton,
                      styles.deleteButton,
                      pressed && styles.iconButtonPressed,
                      (pendingPresetId !== null || isRestoringPreset) && styles.iconButtonDisabled,
                    ]}
                  >
                    <Icons.Trash color={colors.status.danger} width={18} height={18} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('accessibility.overwritePreset', { name: preset.name })}
                    onPress={() => {
                      handleOverwrite(preset.id).catch(() => undefined);
                    }}
                    disabled={pendingPresetId !== null || isRestoringPreset}
                    style={({ pressed }) => [
                      styles.iconButton,
                      styles.overwriteButton,
                      pressed && styles.iconButtonPressed,
                      (pendingPresetId !== null || isRestoringPreset) && styles.iconButtonDisabled,
                    ]}
                  >
                    <Icons.SaveData color={colors.mca.yellow} width={20} height={20} />
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('accessibility.restorePreset', { name: preset.name })}
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
                    <Icons.Play color={colors.border.blue} width={20} height={20} />
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
  closeButton: {
    alignItems: 'center',
    borderColor: colors.border.subtle,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeButtonDisabled: {
    opacity: 0.45,
  },
  closeButtonPressed: {
    opacity: 0.72,
  },
  createActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  createBlock: {
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: colors.status.danger,
  },
  dialog: {
    gap: spacing.md,
    height: '95%',
    width: '95%',
  },
  dialogBackdrop: {
    justifyContent: 'center',
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
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  modalTitleBlock: {
    flex: 1,
    gap: spacing.xs,
  },
  newPresetButton: {
    width: '100%',
  },
  overwriteButton: {
    borderColor: colors.mca.yellow,
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
