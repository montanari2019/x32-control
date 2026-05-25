import { NativeModules, Platform } from 'react-native';
import { AppError } from '@shared/errors/AppError';

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
    throw new AppError('LOCAL_NETWORK_PERMISSION_ERROR', 'Falha ao solicitar acesso a Rede Local.', error);
  }

  if (!granted) {
    throw new AppError(
      'LOCAL_NETWORK_PERMISSION_DENIED',
      'Permita o acesso a Rede Local em Ajustes > Tacimix para encontrar e controlar a X32/M32.',
    );
  }

  hasGrantedLocalNetworkAccess = true;
};
