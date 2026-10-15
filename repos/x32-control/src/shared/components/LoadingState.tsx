import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@shared/theme/colors';

export const LoadingState = ({
  label,
}: {
  label?: string;
}): JSX.Element => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.accent.primary} size="large" />
      <Text style={styles.label}>{label ?? t('common.loading.default')}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 15,
  },
});
