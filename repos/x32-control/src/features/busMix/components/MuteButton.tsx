import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type MuteButtonProps = {
  isMuted: boolean;
  onToggle: () => void;
};

export const MuteButton = ({ isMuted, onToggle }: MuteButtonProps): JSX.Element => (
  <Pressable
    accessibilityRole="switch"
    accessibilityState={{ checked: isMuted }}
    onPress={onToggle}
    style={({ pressed }) => [
      styles.base,
      isMuted ? styles.active : styles.inactive,
      pressed && styles.pressed,
    ]}
  >
    <Text
      adjustsFontSizeToFit
      minimumFontScale={0.9}
      numberOfLines={1}
      style={[styles.text, isMuted ? styles.activeText : styles.inactiveText]}
    >
      MUTE
    </Text>
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
  base: {
    alignItems: 'center',
    borderRadius: radius.sm,
    borderWidth: 1,
    margin: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  inactive: {
    backgroundColor: colors.mute.inactive.background,
    borderColor: colors.mute.inactive.border,
  },
  inactiveText: {
    color: colors.mute.inactive.text,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
