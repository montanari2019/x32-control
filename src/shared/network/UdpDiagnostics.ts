import { AppError } from '@shared/errors/AppError';

const LOCAL_NETWORK_PERMISSION_MESSAGE =
  'Permissão de rede local negada ou bloqueada. Vá em Ajustes > Privacidade e Segurança > Rede Local e ative o acesso para este app.';

const LOCAL_NETWORK_ERROR_HINTS = [
  'local network prohibited',
  'kcferrordomaincfnetwork',
  'code=-1009',
  'posix',
  'operation not permitted',
  'network is unreachable',
  'no route to host',
  'policydenied',
  'permission denied',
  'eperm',
];

export type UdpDiagnosticContext = {
  event: string;
  host?: string;
  port?: number;
  socketId?: number;
  broadcast?: boolean;
  timeoutMs?: number;
  nativeError?: unknown;
};

const UDP_ERROR_EVENTS = new Set(['socket_error', 'broadcast_enable_error', 'send_error']);

const stringifyUnknown = (value: unknown, depth = 0): string => {
  if (value == null || depth > 3) {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value instanceof Error) {
    const errorWithCause = value as Error & { cause?: unknown };
    return [value.name, value.message, stringifyUnknown(errorWithCause.cause, depth + 1)]
      .filter(Boolean)
      .join(' ');
  }

  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return [
      record.code,
      record.domain,
      record.message,
      record.description,
      record.localizedDescription,
      stringifyUnknown(record.error, depth + 1),
      stringifyUnknown(record.cause, depth + 1),
      JSON.stringify(value),
    ]
      .filter((part): part is string => typeof part === 'string' && part.length > 0)
      .join(' ');
  }

  return String(value);
};

export const isLocalNetworkBlockedError = (error: unknown): boolean => {
  const normalized = stringifyUnknown(error).toLowerCase();
  return LOCAL_NETWORK_ERROR_HINTS.some((hint) => normalized.includes(hint));
};

export const toUdpAppError = (
  fallbackCode: AppError['code'],
  fallbackMessage: string,
  error?: unknown,
): AppError => {
  if (isLocalNetworkBlockedError(error)) {
    return new AppError('LOCAL_NETWORK_PERMISSION_DENIED', LOCAL_NETWORK_PERMISSION_MESSAGE, error);
  }

  return new AppError(fallbackCode, fallbackMessage, error);
};

export const logUdpDiagnostic = (context: UdpDiagnosticContext): void => {
  const details = {
    ...context,
    nativeError: stringifyUnknown(context.nativeError),
  };

  if (__DEV__) {
    if (UDP_ERROR_EVENTS.has(context.event)) {
      console.error('[Tacimix UDP]', details);
      return;
    }

    console.info('[Tacimix UDP]', details);
    return;
  }

  if (UDP_ERROR_EVENTS.has(context.event)) {
    console.error('[Tacimix UDP]', details);
  }
};

export const getLocalNetworkPermissionMessage = (): string => LOCAL_NETWORK_PERMISSION_MESSAGE;
