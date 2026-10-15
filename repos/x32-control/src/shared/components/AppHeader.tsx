import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Icons } from '@assets';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  onBack: () => void;
  compact?: boolean;
  rightContent?: ReactNode;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;
  isRightDisabled?: boolean;
  rightVariant?: 'default' | 'channels' | 'success';
  reserveRightSpace?: boolean;
};

export const AppHeader = ({
  title,
  subtitle,
  onBack,
  compact = false,
  rightContent,
  onRightPress,
  rightAccessibilityLabel,
  isRightDisabled = false,
  rightVariant = 'default',
  reserveRightSpace = true,
}: AppHeaderProps): JSX.Element => {
  const { t } = useTranslation();
  const iconSize = compact ? 18 : 20;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.actions.back')}
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => [
          styles.iconButton,
          compact && styles.iconButtonCompact,
          pressed && styles.pressed,
        ]}
      >
        <Icons.ArrowLeft color={colors.text.primary} width={iconSize} height={iconSize} />
      </Pressable>

      <View style={styles.titleWrap} pointerEvents="none">
        <Text
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          numberOfLines={1}
          style={[styles.title, compact && styles.titleCompact]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={1}>
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
            compact && styles.actionButtonCompact,
            rightVariant === 'channels' && styles.channelsButton,
            rightVariant === 'channels' && compact && styles.channelsButtonCompact,
            rightVariant === 'success' && styles.successButton,
            rightVariant === 'success' && compact && styles.successButtonCompact,
            isRightDisabled && styles.disabled,
            pressed && !isRightDisabled && styles.pressed,
          ]}
        >
          {rightContent}
        </Pressable>
      ) : reserveRightSpace ? (
        <View style={[styles.iconButton, compact && styles.iconButtonCompact]} />
      ) : null}
    </View>
  );
};

export const AppHeaderActionText = ({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}): JSX.Element => (
  <Text style={[styles.actionText, compact && styles.actionTextCompact]} numberOfLines={1}>
    {children}
  </Text>
);

export const AppHeaderIconText = ({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}): JSX.Element => (
  <Text style={[styles.iconText, compact && styles.iconTextCompact]}>{children}</Text>
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
  actionButtonCompact: {
    height: 36,
    minWidth: 72,
    paddingHorizontal: spacing.md,
  },
  actionText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  actionTextCompact: {
    fontSize: 12,
  },
  channelsButton: {
    backgroundColor: colors.button.channels.background,
    borderColor: colors.button.channels.border,
    minWidth: 96,
  },
  channelsButtonCompact: {
    minWidth: 104,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'space-between',
    minHeight: 44,
  },
  containerCompact: {
    gap: spacing.xxs,
    minHeight: 36,
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
  iconButtonCompact: {
    height: 36,
    width: 40,
  },
  iconText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
    lineHeight: 20,
  },
  iconTextCompact: {
    fontSize: 18,
    lineHeight: 18,
  },
  pressed: {
    opacity: 0.78,
  },
  successButton: {
    backgroundColor: colors.button.success.background,
    borderColor: colors.button.success.border,
    minWidth: 88,
  },
  successButtonCompact: {
    minWidth: 96,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  subtitleCompact: {
    fontSize: 10,
    marginTop: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 14,
  },
  titleWrap: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
});
