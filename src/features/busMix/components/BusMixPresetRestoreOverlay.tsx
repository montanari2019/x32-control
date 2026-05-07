import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';

export const BusMixPresetRestoreOverlay = (): JSX.Element => (
  <View pointerEvents="auto" style={styles.overlay}>
    <View style={styles.content}>
      <ActivityIndicator size="large" color={colors.text.primary} />
      <Text style={styles.title}>Restaurando preset...</Text>
      <Text style={styles.subtitle}>Aplicando volumes do Bus Mix atual.</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    zIndex: 30,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
