import React, { PropsWithChildren } from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { colors } from '@shared/theme/colors';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
}>;

export const Screen = ({ children, scroll = false, style }: ScreenProps): JSX.Element => {
  if (scroll) {
    return (
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView>
      </View>
    );
  }

  return <View style={[styles.safe, styles.content, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  safe: {
    backgroundColor: colors.background.primary,
    flex: 1,
  },
  content: {
    padding: 16,
  },
});
