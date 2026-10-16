import { act, renderHook } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { i18next } from '@shared/i18n';
import { useConsoleDiscovery } from '@features/consoleDiscovery/hooks/useConsoleDiscovery';

const scanMock = jest.fn();

jest.mock('@features/consoleDiscovery/services/ConsoleDiscoveryService', () => ({
  ConsoleDiscoveryService: jest.fn().mockImplementation(() => ({ scan: scanMock })),
}));

describe('useConsoleDiscovery', () => {
  const originalOs = Platform.OS;

  afterEach(() => {
    (Platform as { OS: string }).OS = originalOs;
    scanMock.mockReset();
  });

  it('uses the Android-specific message when no console is found on Android', async () => {
    (Platform as { OS: string }).OS = 'android';
    scanMock.mockResolvedValue([]);
    const { result } = renderHook(() => useConsoleDiscovery());

    await act(async () => {
      await result.current.scan();
    });

    expect(result.current.error).toBe(i18next.t('consoleDiscovery.noConsoleFoundAndroid'));
    expect(result.current.error).not.toMatch(/iPhone/i);
    expect(result.current.isSearching).toBe(false);
  });

  it('keeps the iOS message (Local Network hint) on iOS', async () => {
    (Platform as { OS: string }).OS = 'ios';
    scanMock.mockResolvedValue([]);
    const { result } = renderHook(() => useConsoleDiscovery());

    await act(async () => {
      await result.current.scan();
    });

    expect(result.current.error).toBe(i18next.t('consoleDiscovery.noConsoleFound'));
  });

  it('always leaves the searching state, even when the scan rejects', async () => {
    scanMock.mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useConsoleDiscovery());

    await act(async () => {
      await result.current.scan();
    });

    expect(result.current.isSearching).toBe(false);
    expect(result.current.error).toBeDefined();
  });
});
