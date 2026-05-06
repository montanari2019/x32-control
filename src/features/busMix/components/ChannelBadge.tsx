import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type ChannelBadgeProps = {
    label: string;
    variant: 'blue' | 'pink';
    onPress: () => void;
};

export const ChannelBadge = ({ label, variant, onPress }: ChannelBadgeProps): JSX.Element => (
    <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Editar PAN ${label}`}
        onPress={onPress}
        style={({ pressed }) => [styles.badge, styles[variant], pressed && styles.pressed]}
    >
        <Text style={styles.text}>{label}</Text>
    </Pressable>
);

const styles = StyleSheet.create({
    badge: {
        alignItems: 'center',
        borderRadius: radius.sm,
        paddingHorizontal: spacing.xs,
        paddingVertical: spacing.xxs,
    },
    blue: {
        backgroundColor: colors.border.channelBlue,
    },
    pink: {
        backgroundColor: colors.border.channelPink,
    },
    pressed: {
        opacity: 0.8,
    },
    text: {
        color: colors.text.primary,
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
});
