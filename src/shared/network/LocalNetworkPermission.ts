import { NativeModules, Platform } from 'react-native';
import { AppError } from '@shared/errors/AppError';
import { getLocalNetworkPermissionMessage, logUdpDiagnostic } from './UdpDiagnostics';

export type LocalNetworkPermissionStatus = 'granted' | 'denied' | 'waiting' | 'unknown';

export type LocalNetworkPermissionResult = {
  granted?: boolean;
  status: LocalNetworkPermissionStatus;
  message?: string;
};

type LocalNetworkPermissionNativeModule = {
  requestPermission?: () => Promise<LocalNetworkPermissionResult>;
};

const getNativeModule = (): LocalNetworkPermissionNativeModule | undefined => {
  if (Platform.OS !== 'ios') {
    return undefined;
  }

  return NativeModules.LocalNetworkPermission as LocalNetworkPermissionNativeModule | undefined;
};

let granted = false;
let pendingRequest: Promise<LocalNetworkPermissionResult> | undefined;

const normalizeResult = (result: Partial<LocalNetworkPermissionResult>): LocalNetworkPermissionResult => {
  const status = result.status ?? (result.granted ? 'granted' : 'unknown');
  return {
    granted: result.granted ?? status === 'granted',
    status,
    message: result.message,
  };
};

export const requestLocalNetworkPermission =
  async (): Promise<LocalNetworkPermissionResult> => {
    if (Platform.OS !== 'ios') {
      return { granted: true, status: 'granted' };
    }

    if (granted) {
      return { granted: true, status: 'granted' };
    }

    const nativeModule = getNativeModule();
    if (!nativeModule?.requestPermission) {
      logUdpDiagnostic({
        event: 'local_network_preflight_native_module_missing',
      });
      return {
        granted: true,
        status: 'granted',
        message: 'Modulo nativo LocalNetworkPermission indisponivel.',
      };
    }

    pendingRequest ??= nativeModule
      .requestPermission()
      .then(normalizeResult)
      .finally(() => {
        pendingRequest = undefined;
      });

    const result = await pendingRequest;
    granted = result.status === 'granted' || result.granted === true;

    logUdpDiagnostic({
      event: 'local_network_preflight_result',
      nativeError: result,
    });

    return result;
  };

export const ensureLocalNetworkPermission = async (): Promise<void> => {
  const result = await requestLocalNetworkPermission();

  if (result.status === 'granted' || result.granted === true) {
    return;
  }

  throw new AppError(
    'LOCAL_NETWORK_PERMISSION_DENIED',
    result.message && result.status !== 'waiting'
      ? `${getLocalNetworkPermissionMessage()} (${result.message})`
      : getLocalNetworkPermissionMessage(),
    result,
  );
};
