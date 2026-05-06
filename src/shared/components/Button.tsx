import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors } from '@shared/theme/colors';

type ButtonProps = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
};

export const Button = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  style,
}: ButtonProps): JSX.Element => (
  <Pressable
    accessibilityRole="button"
    disabled={disabled || loading}
    onPress={onPress}
    style={({ pressed }) => [
      styles.button,
      styles[variant],
      (disabled || loading) && styles.disabled,
      pressed && styles.pressed,
      style,
    ]}
  >
    {loading ? (
      <ActivityIndicator
        color={variant === 'secondary' ? colors.text.primary : colors.text.inverse}
      />
    ) : (
      <Text style={styles.text}>{title}</Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  danger: {
    backgroundColor: colors.status.danger,
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.82,
  },
  primary: {
    backgroundColor: colors.accent.primary,
  },
  secondary: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderWidth: 1,
  },
  text: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
});
