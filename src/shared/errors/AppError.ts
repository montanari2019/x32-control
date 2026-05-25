export type AppErrorCode =
  | 'LOCAL_NETWORK_PERMISSION_DENIED'
  | 'UDP_TIMEOUT'
  | 'INVALID_IP'
  | 'CONSOLE_NOT_FOUND'
  | 'INVALID_OSC_RESPONSE'
  | 'CONNECTION_LOST'
  | 'UDP_TRANSPORT_ERROR'
  | 'LOCAL_NETWORK_PERMISSION_ERROR'
  | 'LOCAL_NETWORK_PERMISSION_DENIED';

export class AppError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Erro inesperado.';
};
