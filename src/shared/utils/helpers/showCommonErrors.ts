import { ComponentProps } from 'react';
import Toast from '@shared/components/Toast';
import { ModalHandle, ModalPropsType } from '@shared/components/Modal';
import { AppError, getErrorMessage } from '@shared/errors/AppError';

type ShowModalType = (
  Component: typeof Toast,
  props: Omit<ComponentProps<typeof Toast>, keyof ModalPropsType>,
) => ModalHandle;

export const showCommonErrors = (showModal: ShowModalType, error: unknown): ModalHandle => {
  if (error instanceof AppError) {
    switch (error.code) {
      case 'INVALID_IP':
        return showModal(Toast, {
          title: 'IP invalido',
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
          title: 'Falha de comunicacao',
          message: error.message,
          variant: 'error',
        });
    }
  }

  return showModal(Toast, {
    title: 'Erro inesperado',
    message: getErrorMessage(error),
    variant: 'error',
  });
};
