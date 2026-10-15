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
});
