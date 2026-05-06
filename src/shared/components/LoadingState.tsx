import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';

export const LoadingState = ({ label = 'Buscando...' }: { label?: string }): JSX.Element => (
  <View style={styles.container}>
    <ActivityIndicator color={colors.accent.primary} size="large" />
    <Text style={styles.label}>{label}</Text>
  </View>
);

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
