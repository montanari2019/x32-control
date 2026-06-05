import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@shared/theme/colors';
import { spacing } from '@shared/theme/spacing';

export const BusMixPresetRestoreOverlay = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <View pointerEvents="auto" style={styles.overlay}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={colors.text.primary} />
        <Text style={styles.title}>{t('busMix.presets.restoreOverlay')}</Text>
        <Text style={styles.subtitle}>{t('busMix.presets.restoreOverlaySubtitle')}</Text>
      </View>
    </View>
  );
};

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
