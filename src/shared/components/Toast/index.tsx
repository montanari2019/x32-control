import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
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

const DEFAULT_TIMEOUT = 4000;

const Toast = ({
  visible,
  onDismiss,
  onDismissEnd,
  dismissible = true,
  animationDuration = 250,
  title,
  message,
  variant = 'success',
  timeToCloseInMilliseconds = DEFAULT_TIMEOUT,
}: ToastPropsType): JSX.Element => {
  const { width } = useWindowDimensions();
  const translateX = useRef(new Animated.Value(visible ? 0 : width)).current;
  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const palette = getToastPalette(variant);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
      return undefined;
    }

    Animated.parallel([
      Animated.timing(translateX, {
        toValue: width,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismissEnd?.();
      }
    });

    return undefined;
  }, [animationDuration, onDismissEnd, opacity, translateX, visible, width]);

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      onDismiss?.();
    }, timeToCloseInMilliseconds);

    return () => clearTimeout(timeoutId);
  }, [onDismiss, timeToCloseInMilliseconds, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <View pointerEvents="box-none" style={styles.overlay}>
        <Animated.View
          style={[
            styles.wrapper,
            {
              opacity,
              transform: [{ translateX }],
            },
          ]}
        >
          <Pressable
            disabled={!dismissible}
            onPress={dismissible ? onDismiss : undefined}
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
    </Modal>
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
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
