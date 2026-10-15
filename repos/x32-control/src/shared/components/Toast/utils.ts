import { i18next } from '@shared/i18n';
import { colors } from '@shared/theme/colors';

export type ToastVariant = 'success' | 'error' | 'warning';

export const getToastPalette = (
  variant: ToastVariant,
): {
  accent: string;
  background: string;
  label: string;
} => {
  switch (variant) {
    case 'error':
      return {
        accent: colors.status.danger,
        background: '#2A1016',
        label: i18next.t('toast.error'),
      };
    case 'warning':
      return {
        accent: colors.status.warning,
        background: '#2A1E0D',
        label: i18next.t('toast.warning'),
      };
    case 'success':
    default:
      return {
        accent: colors.status.success,
        background: '#11261D',
        label: i18next.t('toast.success'),
      };
  }
};
