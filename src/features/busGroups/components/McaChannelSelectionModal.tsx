import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icons } from '@assets';
import { Channel } from '@features/busMix/types/Channel';
import { ModalRenderProps } from '@shared/components/Modal';
import { APP_MODAL_SUPPORTED_ORIENTATIONS } from '@shared/components/Modal/modalOrientations';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';
import { McaGroup } from '../types/busGroups.types';

const CHANNEL_CARD_GAP = spacing.xxs;

const normalizeMcaName = (dcaNumber: number, name: string): string => {
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  return normalizedName || `MCA ${dcaNumber}`;
};

type McaChannelSelectionModalProps = ModalRenderProps & {
  accentColor: string;
  channels: Channel[];
  mca: McaGroup;
  onClearChannels: () => void;
  onRename: (name: string) => void;
  onToggleChannel: (channel: Channel) => void;
};

const getChannelTypeLabel = (channel: Channel): string => {
  if (channel.kind === 'aux') {
    return `AUX ${channel.sourceNumber}`;
  }

  if (channel.kind === 'fxReturn') {
    return `FX ${channel.sourceNumber}`;
  }

  return `CH ${channel.sourceNumber}`;
};

export const McaChannelSelectionModal = ({
  visible,
  onDismiss,
  accentColor,
  channels,
  mca,
  onClearChannels,
  onRename,
  onToggleChannel,
}: McaChannelSelectionModalProps): JSX.Element => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const inputRef = useRef<TextInput>(null);
  const closeAfterKeyboardHideRef = useRef(false);
  const closeFallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [displayName, setDisplayName] = useState(mca.name);
  const [draftName, setDraftName] = useState(mca.name);
  const [isEditingName, setIsEditingName] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    mca.assignedChannels.map((channel) => channel.channelId),
  );
  const modalMaxHeight = Math.max(
    360,
    height - insets.top - insets.bottom - spacing.lg * 2,
  );

  useEffect(() => {
    setDisplayName(mca.name);
    setDraftName(mca.name);
  }, [mca.name]);

  useEffect(() => {
    if (!visible) {
      setIsEditingName(false);
      Keyboard.dismiss();
      return;
    }

    setDisplayName(mca.name);
    setDraftName(mca.name);
  }, [mca.name, visible]);

  useEffect(() => {
    setSelectedIds(mca.assignedChannels.map((channel) => channel.channelId));
  }, [mca.assignedChannels]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      if (!closeAfterKeyboardHideRef.current) {
        return;
      }

      closeAfterKeyboardHideRef.current = false;
      if (closeFallbackTimerRef.current) {
        clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
      setIsEditingName(false);
    });

    return () => {
      hideSubscription.remove();
      if (closeFallbackTimerRef.current) {
        clearTimeout(closeFallbackTimerRef.current);
        closeFallbackTimerRef.current = null;
      }
      closeAfterKeyboardHideRef.current = false;
    };
  }, [visible]);

  const handleStartNameEdit = (): void => {
    setDraftName(displayName);
    setIsEditingName(true);
  };

  const finishEditingName = (): void => {
    if (Platform.OS !== 'android') {
      setIsEditingName(false);
      Keyboard.dismiss();
      return;
    }

    closeAfterKeyboardHideRef.current = true;
    inputRef.current?.blur();

    if (closeFallbackTimerRef.current) {
      clearTimeout(closeFallbackTimerRef.current);
    }

    closeFallbackTimerRef.current = setTimeout(() => {
      if (!closeAfterKeyboardHideRef.current) {
        return;
      }

      closeAfterKeyboardHideRef.current = false;
      closeFallbackTimerRef.current = null;
      setIsEditingName(false);
    }, 420);
  };

  const handleSaveName = (): void => {
    const nextName = normalizeMcaName(mca.dcaNumber, draftName);
    setDisplayName(nextName);
    setDraftName(nextName);
    onRename(nextName);
    finishEditingName();
  };

  const handleDismiss = (): void => {
    closeAfterKeyboardHideRef.current = false;
    if (closeFallbackTimerRef.current) {
      clearTimeout(closeFallbackTimerRef.current);
      closeFallbackTimerRef.current = null;
    }
    setDraftName(displayName);
    setIsEditingName(false);
    Keyboard.dismiss();
    onDismiss?.();
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleDismiss}
      presentationStyle="overFullScreen"
      supportedOrientations={APP_MODAL_SUPPORTED_ORIENTATIONS}
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.dismissBackdrop} onPress={handleDismiss} />

        <KeyboardAvoidingView
          keyboardVerticalOffset={insets.top + spacing.md}
          style={styles.keyboardLayer}
        >
          <ScrollView
            bounces={false}
            contentContainerStyle={[
              styles.keyboardScrollContent,
              {
                paddingBottom: insets.bottom + spacing.lg,
                paddingLeft: insets.left + spacing.lg,
                paddingRight: insets.right + spacing.lg,
                paddingTop: insets.top + spacing.lg,
              },
            ]}
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.keyboardScroll}
          >
            <Pressable
              style={[styles.card, { borderColor: accentColor, maxHeight: modalMaxHeight }]}
              onPress={() => undefined}
            >
              <View style={[styles.header, { borderColor: accentColor }]}>
                <View style={styles.headerTopRow}>
                  {isEditingName ? (
                    <View style={styles.nameEditor}>
                      <TextInput
                        accessibilityLabel="Editar nome do MCA"
                        autoFocus
                        blurOnSubmit
                        ref={inputRef}
                        onChangeText={setDraftName}
                        onSubmitEditing={handleSaveName}
                        placeholder="Nome do MCA"
                        placeholderTextColor={colors.text.tertiary}
                        returnKeyType="done"
                        selectTextOnFocus
                        style={[
                          styles.titleInput,
                          {
                            borderColor: accentColor,
                            color: accentColor,
                          },
                        ]}
                        value={draftName}
                      />
                      <Pressable
                        accessibilityLabel="Salvar nome do MCA"
                        accessibilityRole="button"
                        onPress={handleSaveName}
                        style={({ pressed }) => [
                          styles.saveNameButton,
                          {
                            backgroundColor: accentColor,
                            borderColor: accentColor,
                          },
                          pressed && styles.saveNameButtonPressed,
                        ]}
                      >
                        <Icons.SaveData color={colors.background.deep} width={18} height={18} />
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      accessibilityLabel={`Editar nome ${displayName}`}
                      accessibilityRole="button"
                      onPress={handleStartNameEdit}
                      style={({ pressed }) => [
                        styles.titleButton,
                        pressed && styles.titleButtonPressed,
                      ]}
                    >
                      <Text style={[styles.titleText, { color: accentColor }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                    </Pressable>
                  )}

                  <Pressable
                    accessibilityLabel="Fechar modal de MCA"
                    accessibilityRole="button"
                    onPress={handleDismiss}
                    style={({ pressed }) => [
                      styles.closeButton,
                      pressed && styles.closeButtonPressed,
                    ]}
                  >
                    <Icons.Close color={colors.text.primary} width={14} height={14} />
                  </Pressable>
                </View>

                <View style={styles.headerBottomRow}>
                  <Text style={styles.subtitle}>
                    {selectedIds.length}{' '}
                    {selectedIds.length === 1 ? 'canal vinculado' : 'canais vinculados'}
                  </Text>
                  <Pressable
                    accessibilityLabel="Limpar canais do MCA"
                    accessibilityRole="button"
                    disabled={selectedIds.length === 0}
                    onPress={() => {
                      setSelectedIds([]);
                      onClearChannels();
                    }}
                    style={({ pressed }) => [
                      styles.clearButton,
                      pressed && styles.clearButtonPressed,
                      selectedIds.length === 0 && styles.clearButtonDisabled,
                    ]}
                  >
                    <Text style={styles.clearButtonText}>Limpar</Text>
                  </Pressable>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={styles.grid}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled
                showsVerticalScrollIndicator
                style={styles.channelList}
              >
                {channels.map((channel) => {
                  const uiColor = mapX32ColorToUiColor(channel.color ?? 0);
                  const isSelected = selectedIds.includes(channel.number);

                  return (
                    <Pressable
                      key={channel.id}
                      accessibilityLabel={`${isSelected ? 'Remover' : 'Adicionar'} ${channel.name}`}
                      accessibilityRole="button"
                      onPress={() => {
                        setSelectedIds((current) =>
                          current.includes(channel.number)
                            ? current.filter((item) => item !== channel.number)
                            : [...current, channel.number],
                        );
                        onToggleChannel(channel);
                      }}
                      style={({ pressed }) => [
                        styles.channelCard,
                        {
                          backgroundColor: uiColor.backgroundColor,
                          opacity: isSelected ? 1 : 0.3,
                        },
                        pressed && styles.channelCardPressed,
                      ]}
                    >
                      <Text
                        adjustsFontSizeToFit
                        minimumFontScale={0.78}
                        numberOfLines={1}
                        style={[styles.channelName, { color: uiColor.textColor }]}
                      >
                        {channel.name}
                      </Text>
                      <Text style={[styles.channelLabel, { color: uiColor.textColor }]}>
                        {getChannelTypeLabel(channel)}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface.modal,
    borderColor: colors.border.active,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
  },
  channelCard: {
    alignItems: 'center',
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 74,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    width: '32%',
  },
  channelCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  channelLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.xxs,
    opacity: 0.9,
    textAlign: 'center',
  },
  channelList: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: spacing.lg,
  },
  channelName: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
  },
  clearButton: {
    backgroundColor: colors.mute.active.background,
    borderColor: colors.border.red,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearButtonDisabled: {
    opacity: 0.4,
  },
  clearButtonPressed: {
    opacity: 0.72,
  },
  clearButtonText: {
    color: colors.status.danger,
    fontSize: 12,
    fontWeight: '800',
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
  closeButtonPressed: {
    opacity: 0.72,
  },
  dismissBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
    rowGap: CHANNEL_CARD_GAP,
  },
  header: {
    gap: spacing.xxs,
  },
  headerBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  keyboardLayer: {
    flex: 1,
  },
  keyboardScroll: {
    flex: 1,
  },
  keyboardScrollContent: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalRoot: {
    backgroundColor: colors.overlay.backdrop,
    flex: 1,
  },
  nameEditor: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveNameButton: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  saveNameButtonPressed: {
    opacity: 0.84,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  titleButton: {
    borderRadius: radius.sm,
    flex: 1,
    marginLeft: -spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  titleButtonPressed: {
    opacity: 0.78,
  },
  titleInput: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.active,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: 0,
  },
  titleText: {
    fontSize: 20,
    fontWeight: '900',
  },
});
