import React, { Children, ReactElement, ReactNode, isValidElement, useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Button } from '@shared/components/Button';
import { ModalPropsType } from '@shared/components/Modal';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

export type DialogPropsType = ModalPropsType & {
  modalStyle?: StyleProp<ViewStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  containerChildren?: React.ReactNode;
  children?: React.ReactNode;
};

const DialogBase = ({
  visible,
  onDismiss,
  onDismissEnd,
  dismissible = true,
  animationDuration = 250,
  modalStyle,
  containerStyle,
  containerChildren,
  children,
}: DialogPropsType): JSX.Element => {
  const backdropOpacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(visible ? 0 : 48)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start();

      return undefined;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 48,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        onDismissEnd?.();
      }
    });

    return undefined;
  }, [animationDuration, backdropOpacity, onDismissEnd, translateY, visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onDismiss}>
      <Animated.View style={[styles.modal, modalStyle, { opacity: backdropOpacity }]}>
        <Pressable style={styles.backdrop} onPress={dismissible ? onDismiss : undefined}>
          <Animated.View
            style={[
              styles.container,
              containerStyle,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            {containerChildren}
            {children}
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const DialogHeader = ({ children }: { children: ReactNode }): JSX.Element => (
  <View style={styles.header}>{children}</View>
);

const DialogTitle = ({ children }: { children: ReactNode }): JSX.Element => (
  <Text style={styles.title}>{children}</Text>
);

const DialogMessage = ({ children }: { children: ReactNode }): JSX.Element => {
  if (typeof children === 'string') {
    return <Text style={styles.message}>{children}</Text>;
  }

  return <View style={styles.messageBlock}>{children}</View>;
};

const DialogActions = ({ children }: { children: ReactNode }): JSX.Element => {
  const items = Children.toArray(children);

  if (__DEV__) {
    items.forEach((child) => {
      if (!isValidElement(child)) {
        throw new Error('Dialog.Actions aceita apenas componentes Button.');
      }

      if (child.type !== Button) {
        throw new Error('Dialog.Actions aceita apenas componentes Button.');
      }
    });
  }

  return (
    <View style={styles.actions}>
      {items.map((child, index) => {
        if (!isValidElement(child)) {
          return null;
        }

        return (
          <View key={index} style={index === 0 ? styles.primaryAction : styles.secondaryAction}>
            {child as ReactElement}
          </View>
        );
      })}
    </View>
  );
};

type DialogCompoundComponent = typeof DialogBase & {
  Header: typeof DialogHeader;
  Title: typeof DialogTitle;
  Message: typeof DialogMessage;
  Actions: typeof DialogActions;
};

const Dialog = DialogBase as DialogCompoundComponent;

Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Message = DialogMessage;
Dialog.Actions = DialogActions;

const styles = StyleSheet.create({
  actions: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  backdrop: {
    backgroundColor: colors.overlay.backdrop,
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.surface.modal,
    borderColor: colors.border.active,
    borderRadius: radius.xl,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  header: {
    gap: spacing.xs,
  },
  message: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  messageBlock: {
    marginTop: spacing.xs,
  },
  modal: {
    flex: 1,
  },
  primaryAction: {
    width: '100%',
  },
  secondaryAction: {
    width: '100%',
  },
  title: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '900',
  },
});

export default Dialog;
