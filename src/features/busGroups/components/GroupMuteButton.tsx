import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type GroupMuteButtonProps = {
  isMuted: boolean;
  onPress: () => void;
};

export const GroupMuteButton = ({ isMuted, onPress }: GroupMuteButtonProps): JSX.Element => (
  <Pressable
    accessibilityRole="button"
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      isMuted ? styles.active : styles.inactive,
      pressed && styles.pressed,
    ]}
  >
    <Text style={[styles.text, isMuted ? styles.activeText : styles.inactiveText]}>MUTE</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  active: {
    backgroundColor: colors.mute.active.background,
    borderColor: colors.mute.active.border,
  },
  activeText: {
    color: colors.mute.active.text,
  },
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 42,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    width: '100%',
  },
  inactive: {
    backgroundColor: colors.mute.inactive.background,
    borderColor: colors.mute.inactive.border,
  },
  inactiveText: {
    color: colors.mute.inactive.text,
  },
  pressed: {
    opacity: 0.84,
  },
  text: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
