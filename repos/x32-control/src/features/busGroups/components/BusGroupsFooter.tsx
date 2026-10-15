import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type BusGroupsFooterProps = {
  onPressPresets: () => void;
  onPressSettings: () => void;
};

export const BusGroupsFooter = ({
  onPressPresets,
  onPressSettings,
}: BusGroupsFooterProps): JSX.Element => (
  <View style={styles.row}>
    <Pressable
      onPress={onPressPresets}
      style={({ pressed }) => [styles.presetsButton, pressed && styles.pressed]}
    >
      <Text style={styles.presetsText}>PRESSETS</Text>
    </Pressable>

    <Pressable
      onPress={onPressSettings}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Text style={styles.iconText}>CFG</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.button.icon.background,
    borderRadius: radius.md,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  iconText: {
    color: colors.button.icon.text,
    fontSize: 18,
    fontWeight: '900',
  },
  presetsButton: {
    alignItems: 'center',
    backgroundColor: colors.button.presets.background,
    borderRadius: radius.md,
    flex: 1,
    height: 52,
    justifyContent: 'center',
  },
  presetsText: {
    color: colors.button.presets.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.84,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
