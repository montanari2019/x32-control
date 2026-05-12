import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '@app/navigation/RootNavigator';
import { AppHeader } from '@shared/components/AppHeader';
import { Screen } from '@shared/components/Screen';
import { colors } from '@shared/theme/colors';
import { radius } from '@shared/theme/radius';
import { spacing } from '@shared/theme/spacing';

type Props = NativeStackScreenProps<RootStackParamList, 'About'>;

const APP_COMMIT_VERSION = 27;
const APP_VERSION = APP_COMMIT_VERSION.toString().padEnd(3, '0').split('').join('.');
const CURRENT_YEAR = new Date().getFullYear();

export const AboutScreen = ({ navigation }: Props): JSX.Element => (
  <Screen style={styles.screen}>
    <AppHeader
      title=""
      onBack={() => navigation.goBack()}
      reserveRightSpace={false}
    />

    <View style={styles.content}>
      <Text style={styles.title}>ABOUT</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Versao do app</Text>
        <Text style={styles.value}>{APP_VERSION}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Desenvolvido por</Text>
        <Text style={styles.value}>Ikaro Montanari</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Apoio de</Text>
        <Text style={styles.value}>Renan Bohn</Text>
      </View>

      <Text style={styles.year}>{CURRENT_YEAR}</Text>
    </View>
  </Screen>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background.secondary,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  content: {
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  label: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  screen: {
    backgroundColor: colors.background.primary,
    gap: spacing.lg,
    padding: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  value: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  year: {
    color: colors.text.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
