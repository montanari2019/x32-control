describe('LocalNetworkPermission', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  const loadModule = (platform: string, nativeModules: Record<string, unknown> = {}) => {
    jest.doMock('react-native', () => ({
      NativeModules: nativeModules,
      Platform: { OS: platform },
    }));

    return require('../../../src/shared/network/LocalNetworkPermission') as typeof import('../../../src/shared/network/LocalNetworkPermission');
  };

  it('keeps the iOS native preflight flow intact', async () => {
    const requestPermission = jest.fn().mockResolvedValue({
      status: 'granted',
    });
    const module = loadModule('ios', {
      LocalNetworkPermission: {
        requestPermission,
      },
    });

    await expect(module.requestLocalNetworkPermission()).resolves.toEqual({
      granted: true,
      message: undefined,
      status: 'granted',
    });
    await expect(module.ensureLocalNetworkPermission()).resolves.toBeUndefined();
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });

  it('keeps Android as an auto-granted no-op path', async () => {
    const module = loadModule('android');

    await expect(module.requestLocalNetworkPermission()).resolves.toEqual({
      granted: true,
      status: 'granted',
    });
  });
});
