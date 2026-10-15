import { DefaultTheme, Theme } from '@react-navigation/native';
import { colors } from './colors';

export const darkTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background.primary,
    border: colors.border.primary,
    card: colors.surface.elevated,
    notification: colors.accent.primary,
    primary: colors.accent.primary,
    text: colors.text.primary,
  },
};
