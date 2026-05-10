import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { ModalPropsType } from '@shared/components/Modal';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';
import { getToastPalette, ToastVariant } from './utils';

export type ToastPropsType = ModalPropsType & {
  title: string;
  message: string;
  variant?: ToastVariant;
  timeToCloseInMilliseconds?: number;
  bottomOffset?: number;
};

const MAX_TIMEOUT = 1000;
const TOAST_VERTICAL_OFFSET = -32;

const Toast = ({
  visible,
  onDismiss,
  onDismissEnd,
  dismissible = true,
  animationDuration = 250,
  title,
  message,
  variant = 'success',
  timeToCloseInMilliseconds = MAX_TIMEOUT,
}: ToastPropsType): JSX.Element => {
  const [isModalVisible, setIsModalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(TOAST_VERTICAL_OFFSET)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const palette = getToastPalette(variant);
  const timeoutDuration = Math.max(0, Math.min(timeToCloseInMilliseconds, MAX_TIMEOUT));
  const toastAnimationDuration = Math.max(0, Math.min(animationDuration, timeoutDuration));
  const autoDismissDelay = Math.max(0, timeoutDuration - toastAnimationDuration);

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: toastAnimationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: toastAnimationDuration,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(translateY, {
        toValue: TOAST_VERTICAL_OFFSET,
        duration: toastAnimationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: toastAnimationDuration,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setIsModalVisible(false);
        onDismissEnd?.();
      }
    });

    return undefined;
  }, [onDismissEnd, opacity, toastAnimationDuration, translateY, visible]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      onDismiss?.();
    }, autoDismissDelay);

    return () => clearTimeout(timeoutId);
  }, [autoDismissDelay, onDismiss, visible]);

  if (!isModalVisible) {
    return <></>;
  }

  return (
    <View pointerEvents="box-none" style={styles.overlay}>
      <Animated.View
        pointerEvents="box-none"
        style={[
          styles.wrapper,
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <Pressable
          disabled={!dismissible}
          onPress={dismissible ? onDismiss : undefined}
          pointerEvents="auto"
          style={[
            styles.card,
            { backgroundColor: palette.background, borderColor: palette.accent },
          ]}
        >
          <View style={[styles.marker, { backgroundColor: palette.accent }]} />
          <View style={styles.content}>
            <Text style={[styles.kicker, { color: palette.accent }]}>{palette.label}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,
  },
  content: {
    flex: 1,
    gap: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  kicker: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  marker: {
    width: 4,
  },
  message: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    zIndex: 999,
  },
  title: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  wrapper: {
    maxWidth: 420,
    width: '100%',
  },
});

export default Toast;
