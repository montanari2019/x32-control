import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Channel } from '@features/busMix/types/Channel';
import { ModalRenderProps } from '@shared/components/Modal';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';
import { McaGroup } from '../types/busGroups.types';

type McaChannelSelectionModalProps = ModalRenderProps & {
  accentColor: string;
  channels: Channel[];
  mca: McaGroup;
  onToggleChannel: (channel: Channel) => void;
};

const getChannelTypeLabel = (channel: Channel): string => {
  if (channel.kind === 'aux') {
    return `AUX ${channel.sourceNumber}`;
  }

  if (channel.kind === 'fxReturn') {
    return `FX Return ${channel.sourceNumber}`;
  }

  return `CH ${channel.sourceNumber}`;
};

export const McaChannelSelectionModal = ({
  visible,
  onDismiss,
  accentColor,
  channels,
  mca,
  onToggleChannel,
}: McaChannelSelectionModalProps): JSX.Element => {
  const [selectedIds, setSelectedIds] = useState<number[]>(
    mca.assignedChannels.map((channel) => channel.channelId),
  );

  useEffect(() => {
    setSelectedIds(mca.assignedChannels.map((channel) => channel.channelId));
  }, [mca.assignedChannels]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={() => undefined}>
          <View style={[styles.header, { borderColor: accentColor }]}>
            <Text style={[styles.title, { color: accentColor }]}>{mca.name}</Text>
            <Text style={styles.subtitle}>
              {selectedIds.length} {selectedIds.length === 1 ? 'canal vinculado' : 'canais vinculados'}
            </Text>
          </View>

          <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
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
                      opacity: isSelected ? 1 : 0.6,
                    },
                    pressed && styles.channelCardPressed,
                  ]}
                >
                  <Text
                    style={[styles.channelName, { color: uiColor.textColor }]}
                    numberOfLines={2}
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
    backgroundColor: colors.surface.modal,
    borderColor: colors.border.active,
    borderRadius: radius.xl,
    borderWidth: 1,
    maxHeight: '82%',
    padding: spacing.lg,
    width: '100%',
  },
  channelCard: {
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 74,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: '23%',
  },
  channelCardPressed: {
    transform: [{ scale: 0.98 }],
  },
  channelLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: spacing.xxs,
    opacity: 0.9,
  },
  channelName: {
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  header: {
    borderBottomWidth: 1,
    gap: spacing.xxs,
    paddingBottom: spacing.sm,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
});
