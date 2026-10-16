import { NativeModules, Platform } from 'react-native';

type TacimixNetworkInfoModule = {
  getBroadcastAddresses?: () => Promise<string[]>;
  getNetworkInterfaces?: () => Promise<NativeNetworkInterface[]>;
  acquireMulticastLock?: () => Promise<boolean>;
  releaseMulticastLock?: () => Promise<boolean>;
  bindProcessToWifi?: () => Promise<boolean>;
  unbindProcessFromWifi?: () => Promise<boolean>;
  log?: (message: string) => void;
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
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
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

const getAndroidNetworkInfoModule = (): TacimixNetworkInfoModule | undefined =>
  Platform.OS === 'android'
    ? (NativeModules.TacimixNetworkInfo as TacimixNetworkInfoModule | undefined)
    : undefined;

const callAndroidBooleanMethod = async (
  method: 'acquireMulticastLock' | 'releaseMulticastLock' | 'bindProcessToWifi' | 'unbindProcessFromWifi',
): Promise<boolean> => {
  const fn = getAndroidNetworkInfoModule()?.[method];
  if (!fn) {
    return false;
  }

  try {
    return (await fn()) === true;
  } catch {
    return false;
  }
};

/** Keeps the Wi-Fi chip delivering broadcast/multicast frames while discovery runs (Android only). */
export const acquireAndroidMulticastLock = (): Promise<boolean> =>
  callAndroidBooleanMethod('acquireMulticastLock');

export const releaseAndroidMulticastLock = (): Promise<boolean> =>
  callAndroidBooleanMethod('releaseMulticastLock');

/** Routes this process' sockets through the Wi-Fi network even when cellular is the default (Android only). */
export const bindAndroidProcessToWifi = (): Promise<boolean> =>
  callAndroidBooleanMethod('bindProcessToWifi');

export const unbindAndroidProcessFromWifi = (): Promise<boolean> =>
  callAndroidBooleanMethod('unbindProcessFromWifi');

/** Writes a line to `adb logcat` (tag TacimixDiscovery). No-op outside Android. */
export const logNativeDiscovery = (message: string): void => {
  try {
    getAndroidNetworkInfoModule()?.log?.(message);
  } catch {
    // Diagnostics must never break discovery.
  }
};
