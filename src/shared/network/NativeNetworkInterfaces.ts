import { NativeModules, Platform } from 'react-native';

type TacimixNetworkInfoModule = {
  getBroadcastAddresses?: () => Promise<string[]>;
  getNetworkInterfaces?: () => Promise<NativeNetworkInterface[]>;
};

export type NativeNetworkInterface = {
  address: string;
  netmask: string;
  broadcast: string;
};

const isIpv4Address = (value: string): boolean => {
  const parts = value.split('.');
  return (
    parts.length === 4 &&
    parts.every((part) => {
      const number = Number(part);
      return Number.isInteger(number) && number >= 0 && number <= 255 && part === String(number);
    })
  );
};

const isNativeNetworkInterface = (value: unknown): value is NativeNetworkInterface => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<NativeNetworkInterface>;
  return (
    typeof candidate.address === 'string' &&
    typeof candidate.netmask === 'string' &&
    typeof candidate.broadcast === 'string' &&
    isIpv4Address(candidate.address) &&
    isIpv4Address(candidate.netmask) &&
    isIpv4Address(candidate.broadcast)
  );
};

const getNetworkInfoModule = (): TacimixNetworkInfoModule | undefined => {
  if (Platform.OS !== 'ios') {
    return undefined;
  }

  return NativeModules.TacimixNetworkInfo as TacimixNetworkInfoModule | undefined;
};

export const getNativeBroadcastAddresses = async (): Promise<string[]> => {
  const networkInfo = getNetworkInfoModule();
  if (!networkInfo?.getBroadcastAddresses) {
    return [];
  }

  try {
    const addresses = await networkInfo.getBroadcastAddresses();
    return addresses.filter(isIpv4Address);
  } catch {
    return [];
  }
};

export const getNativeNetworkInterfaces = async (): Promise<NativeNetworkInterface[]> => {
  const networkInfo = getNetworkInfoModule();
  if (!networkInfo?.getNetworkInterfaces) {
    return [];
  }

  try {
    const networkInterfaces = await networkInfo.getNetworkInterfaces();
    return networkInterfaces.filter(isNativeNetworkInterface);
  } catch {
    return [];
  }
};
