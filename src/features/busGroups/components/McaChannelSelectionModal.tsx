import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Channel } from '@features/busMix/types/Channel';
import { ModalRenderProps } from '@shared/components/Modal';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';
import { McaGroup } from '../types/busGroups.types';

const CHANNEL_CARD_GAP = spacing.xxs;

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
  const { height } = useWindowDimensions();
  const [draftName, setDraftName] = useState(mca.name);
  const [selectedIds, setSelectedIds] = useState<number[]>(
    mca.assignedChannels.map((channel) => channel.channelId),
  );
  const modalMaxHeight = Math.max(360, height - spacing.xxl * 2);

  useEffect(() => {
    setDraftName(mca.name);
  }, [mca.name]);

  useEffect(() => {
    setSelectedIds(mca.assignedChannels.map((channel) => channel.channelId));
  }, [mca.assignedChannels]);

  const commitName = (): void => {
    onRename(draftName);
  };

  const handleDismiss = (): void => {
    commitName();
    onDismiss?.();
  };

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleDismiss}>
      <Pressable style={styles.backdrop} onPress={handleDismiss}>
        <Pressable style={[styles.card, { maxHeight: modalMaxHeight }]} onPress={() => undefined}>
          <View style={[styles.header, { borderColor: accentColor }]}>
            <View style={styles.headerTopRow}>
              <TextInput
                value={draftName}
                onBlur={commitName}
                onChangeText={setDraftName}
                onSubmitEditing={commitName}
                placeholder="Nome do MCA"
                placeholderTextColor={colors.text.tertiary}
                returnKeyType="done"
                selectTextOnFocus
                style={[styles.titleInput, { color: accentColor }]}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fechar modal de MCA"
                onPress={handleDismiss}
                style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}
              >
                <Text style={styles.closeButtonText}>X</Text>
              </Pressable>
            </View>
            <View style={styles.headerBottomRow}>
              <Text style={styles.subtitle}>
                {selectedIds.length}{' '}
                {selectedIds.length === 1 ? 'canal vinculado' : 'canais vinculados'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Limpar canais do MCA"
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator
            style={styles.channelList}
          >
            {channels.map((channel) => {
              const uiColor = mapX32ColorToUiColor(channel.color ?? 0);
              const isSelected = selectedIds.includes(channel.number);

              return (
                <Pressable
                  key={channel.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${isSelected ? 'Remover' : 'Adicionar'} ${channel.name}`}
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
                    style={[styles.channelName, { color: uiColor.textColor }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.78}
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
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlay.backdrop,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface.modal,
    borderColor: colors.border.active,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    width: '100%',
  },
  channelList: {
    flexGrow: 0,
    flexShrink: 1,
    marginTop: spacing.sm,
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
  channelName: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
    textAlign: 'center',
    width: '100%',
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
  closeButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  clearButton: {
    borderColor: colors.border.subtle,
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
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: spacing.xl,
    rowGap: CHANNEL_CARD_GAP,
  },
  header: {
    borderBottomWidth: 1,
    gap: spacing.xxs,
    paddingBottom: spacing.sm,
  },
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'space-between',
  },
  headerBottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  titleInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    padding: 0,
  },
});
