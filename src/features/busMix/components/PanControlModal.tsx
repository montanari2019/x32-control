import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { formatPanLabel } from '@shared/x32/pan';
import { ModalRenderProps } from '@shared/components/Modal';

type PanControlModalProps = ModalRenderProps & {
    channelLabel: string;
    channelName: string;
    value: number;
    onChange: (value: number) => void;
};

export const PanControlModal = ({
    visible,
    onDismiss,
    channelLabel,
    channelName,
    value,
    onChange,
}: PanControlModalProps): JSX.Element => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleValueChange = (nextValue: number): void => {
        setLocalValue(nextValue);
        onChange(nextValue);
    };

    const handleCenterPress = (): void => {
        handleValueChange(0);
    };

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
            <Pressable style={styles.backdrop} onPress={onDismiss}>
                <Pressable style={styles.card} onPress={() => undefined}>
                    <Text style={styles.kicker}>{channelLabel}</Text>
                    <Text style={styles.title}>{channelName}</Text>

                    <View style={styles.panValueRow}>
                        <Text style={styles.panValueLabel}>{formatPanLabel(localValue)}</Text>
                        <Text style={styles.panValueNumber}>{localValue}</Text>
                    </View>

                    <View style={styles.axis}>
                        <View style={styles.axisMarker} />
                        <View style={styles.axisCenter} />
                        <View style={styles.axisMarker} />
                    </View>

                    <Slider
                        minimumValue={-100}
                        maximumValue={100}
                        step={1}
                        value={localValue}
                        onValueChange={handleValueChange}
                        minimumTrackTintColor={colors.pan.indicator}
                        maximumTrackTintColor={colors.pan.axis}
                        thumbTintColor={colors.pan.knob}
                    />

                    <View style={styles.footerRow}>
                        <Text style={styles.footerLabel}>L</Text>
                        <Pressable style={styles.centerButton} onPress={handleCenterPress}>
                            <Text style={styles.centerLabel}>Center</Text>
                        </Pressable>
                        <Text style={styles.footerLabel}>R</Text>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    axis: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    axisCenter: {
        backgroundColor: colors.pan.indicator,
        borderRadius: radius.pill,
        height: 6,
        width: 6,
    },
    axisMarker: {
        backgroundColor: colors.pan.axis,
        borderRadius: radius.pill,
        height: 4,
        width: 4,
    },
    backdrop: {
        alignItems: 'center',
        backgroundColor: colors.overlay.backdrop,
        flex: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.pan.modalBackground,
        borderColor: colors.border.active,
        borderRadius: radius.lg,
        borderWidth: 1,
        gap: spacing.sm,
        padding: spacing.lg,
        width: '100%',
    },
    centerButton: {
        alignItems: 'center',
        backgroundColor: colors.surface.control,
        borderColor: colors.border.active,
        borderRadius: radius.pill,
        borderWidth: 1,
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xxs,
    },
    centerLabel: {
        color: colors.text.primary,
        fontSize: 12,
        fontWeight: '800',
    },
    footerLabel: {
        color: colors.text.muted,
        fontSize: 12,
        fontWeight: '700',
    },
    footerRow: {
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    kicker: {
        color: colors.text.secondary,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    panValueLabel: {
        color: colors.text.primary,
        fontSize: 20,
        fontWeight: '900',
    },
    panValueNumber: {
        color: colors.text.secondary,
        fontSize: 14,
        fontWeight: '700',
    },
    panValueRow: {
        alignItems: 'center',
        borderColor: colors.border.active,
        borderRadius: radius.md,
        borderWidth: 1,
        flexDirection: 'row',
        gap: spacing.sm,
        justifyContent: 'center',
        paddingVertical: spacing.xs,
    },
    title: {
        color: colors.text.primary,
        fontSize: 16,
        fontWeight: '900',
    },
});
