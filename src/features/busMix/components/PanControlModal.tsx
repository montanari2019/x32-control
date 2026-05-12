import React, { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Icons } from '@assets';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { formatPanLabel } from '@shared/x32/pan';
import { ModalRenderProps } from '@shared/components/Modal';
import { APP_MODAL_SUPPORTED_ORIENTATIONS } from '@shared/components/Modal/modalOrientations';

type PanControlModalProps = ModalRenderProps & {
  channelLabel: string;
  channelName: string;
  value: number;
  onChange: (value: number) => void;
};

const MODAL_ANIMATION_DURATION_MS = 140;

export const PanControlModal = ({
  visible,
  onDismiss,
  onDismissEnd,
  channelLabel,
  channelName,
  value,
  onChange,
}: PanControlModalProps): JSX.Element => {
  const [isModalVisible, setIsModalVisible] = useState(visible);
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(visible ? 1 : 0.98)).current;
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: MODAL_ANIMATION_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: MODAL_ANIMATION_DURATION_MS,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: MODAL_ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.98,
        duration: MODAL_ANIMATION_DURATION_MS,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsModalVisible(false);
        onDismissEnd?.();
      }
    });

    return undefined;
  }, [onDismissEnd, opacity, scale, visible]);

  const handleValueChange = (nextValue: number): void => {
    setLocalValue(nextValue);
    onChange(nextValue);
  };

  const handleCenterPress = (): void => {
    handleValueChange(0);
  };

  return (
    <Modal
      transparent
      visible={isModalVisible}
      animationType="none"
      onRequestClose={onDismiss}
      presentationStyle="overFullScreen"
      supportedOrientations={APP_MODAL_SUPPORTED_ORIENTATIONS}
    >
      <Animated.View style={[styles.modalSurface, { opacity }]}>
        <Pressable style={styles.backdrop} onPress={onDismiss}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Pressable style={styles.card} onPress={() => undefined}>
              <View style={styles.headerTopRow}>
                <View style={styles.titleBlock}>
                  <Text style={styles.kicker}>{channelLabel}</Text>
                  <Text style={styles.title}>{channelName}</Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Fechar modal do Personal Mix"
                  onPress={onDismiss}
                  style={({ pressed }) => [
                    styles.closeButton,
                    pressed && styles.closeButtonPressed,
                  ]}
                >
                  <Icons.Close color={colors.text.primary} width={14} height={14} />
                </Pressable>
              </View>

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
          </Animated.View>
        </Pressable>
      </Animated.View>
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
  modalSurface: {
    flex: 1,
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
    minWidth: 300,
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
  closeButton: {
    alignItems: 'center',
    borderColor: colors.border.subtle,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  closeButtonPressed: {
    opacity: 0.72,
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
  headerTopRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
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
  titleBlock: {
    flex: 1,
    gap: spacing.xxs,
  },
});
