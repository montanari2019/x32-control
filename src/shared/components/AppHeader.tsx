import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icons } from '@assets';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  rightContent?: ReactNode;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  isRightDisabled?: boolean;
  rightVariant?: 'default' | 'channels' | 'success';
};

export const AppHeader = ({
  title,
  subtitle,
  onBack,
  rightContent,
  onRightPress,
  rightAccessibilityLabel,
  isRightDisabled = false,
  rightVariant = 'default',
}: AppHeaderProps): JSX.Element => (
  <View style={styles.container}>
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Voltar"
      hitSlop={8}
      onPress={onBack}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Icons.ArrowLeft color={colors.text.primary} width={20} height={20} />
    </Pressable>

    <View style={styles.titleWrap} pointerEvents="none">
      <Text adjustsFontSizeToFit minimumFontScale={0.78} numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}
    </View>

    {rightContent ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={rightAccessibilityLabel}
        disabled={!onRightPress || isRightDisabled}
        hitSlop={8}
        onPress={onRightPress}
        style={({ pressed }) => [
          styles.actionButton,
          rightVariant === 'channels' && styles.channelsButton,
          rightVariant === 'success' && styles.successButton,
          isRightDisabled && styles.disabled,
          pressed && !isRightDisabled && styles.pressed,
        ]}
      >
        {rightContent}
      </Pressable>
    ) : (
      <View style={styles.iconButton} />
    )}
  </View>
);

export const AppHeaderActionText = ({ children }: { children: ReactNode }): JSX.Element => (
  <Text style={styles.actionText} numberOfLines={1}>
    {children}
  </Text>
);

export const AppHeaderIconText = ({ children }: { children: ReactNode }): JSX.Element => (
  <Text style={styles.iconText}>{children}</Text>
);

const styles = StyleSheet.create({
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    minWidth: 44,
    paddingHorizontal: spacing.sm,
    zIndex: 1,
  },
  actionText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  channelsButton: {
    backgroundColor: colors.button.channels.background,
    borderColor: colors.button.channels.border,
    minWidth: 96,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minHeight: 44,
  },
  disabled: {
    opacity: 0.5,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
    zIndex: 1,
  },
  iconText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 20,
  },
  pressed: {
    opacity: 0.78,
  },
  successButton: {
    backgroundColor: colors.button.success.background,
    borderColor: colors.button.success.border,
    minWidth: 88,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
});
