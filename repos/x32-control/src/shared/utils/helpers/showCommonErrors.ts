import { ComponentProps } from 'react';
import Toast from '@shared/components/Toast';
import { ModalHandle, ModalPropsType } from '@shared/components/Modal';
import { AppError, getErrorMessage } from '@shared/errors/AppError';
import { i18next } from '@shared/i18n';

type ShowModalType = (
  Component: typeof Toast,
  props: Omit<ComponentProps<typeof Toast>, keyof ModalPropsType>,
) => ModalHandle;

export const showCommonErrors = (showModal: ShowModalType, error: unknown): ModalHandle => {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'INVALID_IP':
        return showModal(Toast, {
          title: i18next.t('errors.invalidIpTitle'),
          message: error.message,
          variant: 'warning',
        });
      case 'CONSOLE_NOT_FOUND':
      case 'UDP_TIMEOUT':
      case 'CONNECTION_LOST':
      case 'UDP_TRANSPORT_ERROR':
      case 'INVALID_OSC_RESPONSE':
      default:
        return showModal(Toast, {
          title: i18next.t('errors.communicationFailureTitle'),
          message: error.message,
          variant: 'error',
        });
    }
  }

  return showModal(Toast, {
    title: i18next.t('errors.unexpectedTitle'),
    message: getErrorMessage(error),
    variant: 'error',
  });
};
