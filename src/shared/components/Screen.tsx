import React, { PropsWithChildren } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '@shared/theme/colors';

type ScreenProps = PropsWithChildren<{
  scroll?: boolean;
  style?: ViewStyle;
}>;

export const Screen = ({ children, scroll = false, style }: ScreenProps): JSX.Element => {
  if (scroll) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScrollView contentContainerStyle={[styles.content, style]}>{children}</ScrollView>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={[styles.safe, styles.content, style]}>{children}</SafeAreaView>;
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
