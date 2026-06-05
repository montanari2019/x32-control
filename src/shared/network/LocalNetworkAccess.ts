import { NativeModules, Platform } from 'react-native';
import { AppError } from '@shared/errors/AppError';
import { i18next } from '@shared/i18n';

type TacimixNetworkInfoModule = {
  requestLocalNetworkAccess?: () => Promise<boolean>;
};

let hasGrantedLocalNetworkAccess = false;
let pendingLocalNetworkRequest: Promise<boolean> | undefined;

const getNetworkInfoModule = (): TacimixNetworkInfoModule | undefined => {
  if (Platform.OS !== 'ios') {
    return undefined;
  }

  return NativeModules.TacimixNetworkInfo as TacimixNetworkInfoModule | undefined;
};

const requestLocalNetworkAccess = async (): Promise<boolean> => {
  const networkInfo = getNetworkInfoModule();
  if (!networkInfo?.requestLocalNetworkAccess) {
    return true;
  }

  pendingLocalNetworkRequest ??= networkInfo.requestLocalNetworkAccess().finally(() => {
    pendingLocalNetworkRequest = undefined;
  });

  return pendingLocalNetworkRequest;
};

export const ensureLocalNetworkAccess = async (): Promise<void> => {
  if (Platform.OS !== 'ios' || hasGrantedLocalNetworkAccess) {
    return;
  }

  let granted = false;
  try {
    granted = await requestLocalNetworkAccess();
  } catch (error) {
    throw new AppError(
      'LOCAL_NETWORK_PERMISSION_ERROR',
      i18next.t('errors.localNetworkPermissionError'),
      error,
    );
  }

  if (!granted) {
    throw new AppError(
      'LOCAL_NETWORK_PERMISSION_DENIED',
      i18next.t('errors.localNetworkPermissionDenied'),
    );
  }

  hasGrantedLocalNetworkAccess = true;
};
