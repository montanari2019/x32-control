import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors } from '@shared/theme/colors';

type ErrorStateProps = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export const ErrorState = ({
  message,
  actionLabel,
  onAction,
}: ErrorStateProps): JSX.Element => (
  <View style={styles.container}>
    <Text style={styles.title}>Algo saiu do tom</Text>
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onAction ? (
      <Button title={actionLabel} onPress={onAction} variant="secondary" />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  message: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
  },
});
