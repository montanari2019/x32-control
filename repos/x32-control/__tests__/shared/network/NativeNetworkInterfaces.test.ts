describe('NativeNetworkInterfaces', () => {
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  const loadModule = (platform: string, nativeModules: Record<string, unknown> = {}) => {
    jest.doMock('react-native', () => ({
      NativeModules: nativeModules,
      Platform: { OS: platform },
    }));

    return require('../../../src/shared/network/NativeNetworkInterfaces') as typeof import('../../../src/shared/network/NativeNetworkInterfaces');
  };

  it('returns filtered Android native broadcast addresses and interfaces', async () => {
    const module = loadModule('android', {
      TacimixNetworkInfo: {
        getBroadcastAddresses: jest
          .fn()
          .mockResolvedValue(['192.168.88.255', 'not-an-ip']),
        getNetworkInterfaces: jest.fn().mockResolvedValue([
          {
            address: '192.168.88.10',
            netmask: '255.255.255.0',
            broadcast: '192.168.88.255',
          },
          {
            address: 'bad-address',
            netmask: '255.255.255.0',
            broadcast: '192.168.88.255',
          },
          {
            address: '192.168.88.11',
            netmask: '255.255.255.0',
          },
        ]),
      },
    });

    await expect(module.getNativeBroadcastAddresses()).resolves.toEqual(['192.168.88.255']);
    await expect(module.getNativeNetworkInterfaces()).resolves.toEqual([
      {
        address: '192.168.88.10',
        netmask: '255.255.255.0',
        broadcast: '192.168.88.255',
      },
    ]);
  });

  it('returns empty arrays when the Android native module is unavailable or fails', async () => {
    const module = loadModule('android', {
      TacimixNetworkInfo: {
        getBroadcastAddresses: jest.fn().mockRejectedValue(new Error('boom')),
        getNetworkInterfaces: jest.fn().mockRejectedValue(new Error('boom')),
      },
    });

    await expect(module.getNativeBroadcastAddresses()).resolves.toEqual([]);
    await expect(module.getNativeNetworkInterfaces()).resolves.toEqual([]);
  });

  describe('Android discovery helpers', () => {
    it('calls the native multicast lock and Wi-Fi binding methods on Android', async () => {
      const native = {
        acquireMulticastLock: jest.fn().mockResolvedValue(true),
        releaseMulticastLock: jest.fn().mockResolvedValue(true),
        bindProcessToWifi: jest.fn().mockResolvedValue(true),
        unbindProcessFromWifi: jest.fn().mockResolvedValue(true),
        log: jest.fn(),
      };
      const module = loadModule('android', { TacimixNetworkInfo: native });

      await expect(module.acquireAndroidMulticastLock()).resolves.toBe(true);
      await expect(module.bindAndroidProcessToWifi()).resolves.toBe(true);
      await expect(module.unbindAndroidProcessFromWifi()).resolves.toBe(true);
      await expect(module.releaseAndroidMulticastLock()).resolves.toBe(true);
      module.logNativeDiscovery('hello');

      expect(native.acquireMulticastLock).toHaveBeenCalledTimes(1);
      expect(native.log).toHaveBeenCalledWith('hello');
    });

    it('returns false instead of throwing when the native call rejects or is missing', async () => {
      const rejecting = loadModule('android', {
        TacimixNetworkInfo: { bindProcessToWifi: jest.fn().mockRejectedValue(new Error('boom')) },
      });
      await expect(rejecting.bindAndroidProcessToWifi()).resolves.toBe(false);
      await expect(rejecting.acquireAndroidMulticastLock()).resolves.toBe(false);
    });

    it('is a no-op on iOS', async () => {
      const native = { acquireMulticastLock: jest.fn(), log: jest.fn() };
      const module = loadModule('ios', { TacimixNetworkInfo: native });

      await expect(module.acquireAndroidMulticastLock()).resolves.toBe(false);
      module.logNativeDiscovery('hello');
      expect(native.acquireMulticastLock).not.toHaveBeenCalled();
      expect(native.log).not.toHaveBeenCalled();
    });
  });
});
