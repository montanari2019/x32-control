import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { colors } from '@shared/theme/colors';

type ErrorStateProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const ErrorState = ({ message, actionLabel, onAction }: ErrorStateProps): JSX.Element => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('common.errors.defaultTitle')}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} onPress={onAction} variant="secondary" />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface.elevated,
    borderColor: colors.border.primary,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  message: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.text.primary,
    fontSize: 17,
    fontWeight: '700',
  },
});
