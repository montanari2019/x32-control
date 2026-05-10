import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '@assets';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type BusGroupsHeaderProps = {
  onBack: () => void;
  onChannels: () => void;
};

export const BusGroupsHeader = ({ onBack, onChannels }: BusGroupsHeaderProps): JSX.Element => (
  <View style={styles.row}>
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onBack}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <Icons.ArrowLeft color={colors.text.primary} width={24} height={24} />
    </Pressable>

    <View style={styles.titleWrap} pointerEvents="none">
      <Text style={styles.title}>Personal Mix Grupos</Text>
    </View>

    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onChannels}
      style={({ pressed }) => [styles.channelsButton, pressed && styles.pressed]}
    >
      <Text style={styles.channelsText}>Channels {'>'}</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  channelsButton: {
    alignItems: 'center',
    backgroundColor: colors.button.channels.background,
    borderColor: colors.button.channels.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 112,
    paddingHorizontal: spacing.sm,
  },
  channelsText: {
    color: colors.button.channels.text,
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.82,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
});
