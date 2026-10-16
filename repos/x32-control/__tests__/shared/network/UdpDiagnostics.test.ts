import { logUdpDiagnostic } from '@shared/network/UdpDiagnostics';
import { logNativeDiscovery } from '@shared/network/NativeNetworkInterfaces';

jest.mock('@shared/network/NativeNetworkInterfaces', () => ({
  logNativeDiscovery: jest.fn(),
}));

const setDevMode = (value: boolean): void => {
  (globalThis as unknown as { __DEV__: boolean }).__DEV__ = value;
};

describe('UdpDiagnostics', () => {
  const originalDev = (globalThis as unknown as { __DEV__: boolean }).__DEV__;

  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => undefined);
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    setDevMode(true);
  });

  afterEach(() => {
    setDevMode(originalDev);
    jest.restoreAllMocks();
  });

  it('logs expected UDP diagnostics without triggering LogBox warnings in dev', () => {
    logUdpDiagnostic({
      event: 'local_network_preflight_result',
      nativeError: { status: 'granted' },
    });

    expect(infoSpy).toHaveBeenCalledWith('[Tacimix UDP]', {
      event: 'local_network_preflight_result',
      nativeError: '{"status":"granted"}',
    });
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('keeps real UDP errors visible in dev', () => {
    logUdpDiagnostic({
      event: 'send_error',
      host: '192.168.88.250',
      port: 10023,
      nativeError: new Error('send failed'),
    });

    expect(errorSpy).toHaveBeenCalledWith('[Tacimix UDP]', {
      event: 'send_error',
      host: '192.168.88.250',
      port: 10023,
      nativeError: 'Error send failed',
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('suppresses non-error UDP diagnostics in production', () => {
    setDevMode(false);

    logUdpDiagnostic({
      event: 'broadcast_enabled',
      socketId: 0,
      broadcast: true,
    });

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  describe('logcat mirroring', () => {
    const mirror = logNativeDiscovery as jest.Mock;

    beforeEach(() => mirror.mockClear());

    it('mirrors every event to the native log in dev', () => {
      logUdpDiagnostic({ event: 'discovery_scan_start' });

      expect(mirror).toHaveBeenCalledTimes(1);
    });

    it('mirrors only errors in release so local IPs are not written to logcat', () => {
      setDevMode(false);

      logUdpDiagnostic({ event: 'discovery_send_batch', host: '192.168.1.10' });
      expect(mirror).not.toHaveBeenCalled();

      logUdpDiagnostic({ event: 'send_error', host: '192.168.1.10', nativeError: new Error('x') });
      expect(mirror).toHaveBeenCalledTimes(1);
    });
  });
});
