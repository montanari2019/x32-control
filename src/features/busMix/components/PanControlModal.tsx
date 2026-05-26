import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
  PanResponderInstance,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Icons } from '@assets';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { clampPanPercent, formatSignedPanValue } from '@shared/x32/pan';
import { ModalRenderProps } from '@shared/components/Modal';
import { APP_MODAL_SUPPORTED_ORIENTATIONS } from '@shared/components/Modal/modalOrientations';
import {
  PAN_SLIDER_RANGE,
  panPercentToSliderRatio,
  sliderPositionToPanPercent,
} from '../utils/panSlider';

type PanControlModalProps = ModalRenderProps & {
  channelLabel: string;
  channelName: string;
  value: number;
  onChange: (value: number) => void;
};

const MODAL_ANIMATION_DURATION_MS = 140;
const PAN_THUMB_SIZE = 28;

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
  const [localValue, setLocalValue] = useState(() => clampPanPercent(value));
  const localValueRef = useRef(localValue);
  const trackWidthRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartValueRef = useRef(localValue);
  const [trackWidth, setTrackWidth] = useState(0);

  useEffect(() => {
    if (isDraggingRef.current) {
      return;
    }

    const clampedValue = clampPanPercent(value);
    localValueRef.current = clampedValue;
    setLocalValue(clampedValue);
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

  const setLocalPanValue = (nextValue: number): void => {
    const clampedValue = clampPanPercent(nextValue);
    localValueRef.current = clampedValue;
    setLocalValue(clampedValue);
  };

  const commitPanValue = (nextValue: number): void => {
    const clampedValue = clampPanPercent(nextValue);
    localValueRef.current = clampedValue;
    setLocalValue(clampedValue);
    onChange(clampedValue);
  };

  const beginGestureFromEvent = (event: GestureResponderEvent): void => {
    const nextValue = sliderPositionToPanPercent(
      event.nativeEvent.locationX,
      trackWidthRef.current,
    );
    dragStartValueRef.current = nextValue;
    setLocalPanValue(nextValue);
  };

  const updateLocalValueFromGesture = (gestureState: PanResponderGestureState): void => {
    const width = trackWidthRef.current;
    if (width <= 0) {
      return;
    }

    setLocalPanValue(dragStartValueRef.current + (gestureState.dx / width) * PAN_SLIDER_RANGE);
  };

  const panResponder = useRef<PanResponderInstance>(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        isDraggingRef.current = true;
        beginGestureFromEvent(event);
      },
      onPanResponderMove: (_event, gestureState) => {
        updateLocalValueFromGesture(gestureState);
      },
      onPanResponderRelease: () => {
        isDraggingRef.current = false;
        commitPanValue(localValueRef.current);
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        commitPanValue(localValueRef.current);
      },
      onShouldBlockNativeResponder: () => true,
    }),
  ).current;

  const handleTrackLayout = (event: LayoutChangeEvent): void => {
    const nextWidth = event.nativeEvent.layout.width;
    trackWidthRef.current = nextWidth;
    setTrackWidth(nextWidth);
  };

  const handleCenterPress = (): void => {
    commitPanValue(0);
  };

  const sliderRatio = panPercentToSliderRatio(localValue);
  const thumbLeft = Math.max(0, Math.min(trackWidth, sliderRatio * trackWidth));
  const fillLeft = sliderRatio < 0.5 ? thumbLeft : trackWidth / 2;
  const fillWidth = Math.abs(thumbLeft - trackWidth / 2);

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
                <Text style={styles.panValueLabel}>{formatSignedPanValue(localValue)}</Text>
              </View>

              <View style={styles.axis}>
                <View style={styles.axisMarker} />
                <View style={styles.axisCenter} />
                <View style={styles.axisMarker} />
              </View>

              <View
                accessibilityRole="adjustable"
                accessibilityLabel="Pan"
                accessibilityValue={{ min: -100, max: 100, now: localValue }}
                style={styles.panSliderTouchArea}
                onLayout={handleTrackLayout}
                {...panResponder.panHandlers}
              >
                <View pointerEvents="none" style={styles.panSliderTrack}>
                  <View
                    pointerEvents="none"
                    style={[styles.panSliderFill, { left: fillLeft, width: fillWidth }]}
                  />
                  <View pointerEvents="none" style={styles.panSliderCenterMark} />
                  <View pointerEvents="none" style={[styles.panSliderThumb, { left: thumbLeft }]} />
                </View>
              </View>

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
  panSliderCenterMark: {
    backgroundColor: colors.pan.indicator,
    borderRadius: radius.pill,
    height: 18,
    left: '50%',
    marginLeft: -1,
    position: 'absolute',
    top: -7,
    width: 2,
  },
  panSliderFill: {
    backgroundColor: colors.pan.indicator,
    borderRadius: radius.pill,
    height: 4,
    position: 'absolute',
    top: 0,
  },
  panSliderThumb: {
    backgroundColor: colors.pan.knob,
    borderColor: colors.border.active,
    borderRadius: PAN_THUMB_SIZE / 2,
    borderWidth: 2,
    elevation: 4,
    height: PAN_THUMB_SIZE,
    marginLeft: -PAN_THUMB_SIZE / 2,
    marginTop: -PAN_THUMB_SIZE / 2 + 2,
    position: 'absolute',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    top: 0,
    width: PAN_THUMB_SIZE,
  },
  panSliderTouchArea: {
    justifyContent: 'center',
    minHeight: 44,
  },
  panSliderTrack: {
    backgroundColor: colors.pan.axis,
    borderRadius: radius.pill,
    height: 4,
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
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
