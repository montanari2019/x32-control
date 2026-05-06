import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { mapX32ColorToUiColor } from '@shared/x32/channelColor';

type ChannelNamePlateProps = {
    label: string;
    name: string;
    color?: number | string;
    onPress: () => void;
};

export const ChannelNamePlate = ({
    label,
    name,
    color = 0,
    onPress,
}: ChannelNamePlateProps): JSX.Element => {
    const uiColor = mapX32ColorToUiColor(color);

    return (
        <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Editar PAN ${label}`}
            onPress={onPress}
            style={({ pressed }) => [
                styles.plate,
                { backgroundColor: uiColor.backgroundColor },
                pressed && styles.pressed,
            ]}
        >
            <Text style={[styles.name, { color: uiColor.textColor }]} numberOfLines={1}>
                {name}
            </Text>
            <View style={styles.labelWrapper}>
                <Text style={styles.label}>{label}</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    label: {
        color: colors.text.primary,
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    labelWrapper: {
        backgroundColor: colors.surface.control,
        borderRadius: radius.xs,
        marginTop: 1,
        paddingHorizontal: 2,
        paddingVertical: 2,
    },
    name: {
        fontSize: 12,
        fontWeight: '900',
        textAlign: 'center',
    },
    plate: {
        alignItems: 'center',
        borderRadius: radius.sm,
        paddingHorizontal: 2,
        paddingVertical: 2,
        width: '100%',
    },
    pressed: {
        opacity: 0.85,
    },
});
