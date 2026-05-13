import { act, renderHook, waitFor } from '@testing-library/react-native';
import { acquireSharedOscClient } from '@shared/osc/SharedOscClient';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { useMeterSubscription } from '@features/busMix/hooks/useMeterSubscription';

const mockSubscribe = jest.fn();
const mockSend = jest.fn();
const mockStartXRemoteKeepAlive = jest.fn();
const mockStopXRemoteKeepAlive = jest.fn();
const mockRelease = jest.fn();

jest.mock('@shared/mixer/mock/mockMixerProvider', () => ({
  getMockProviderForIp: jest.fn(() => null),
  isMockConsoleIp: jest.fn(() => false),
}));

jest.mock('@shared/osc/SharedOscClient', () => ({
  acquireSharedOscClient: jest.fn(),
}));

describe('useMeterSubscription', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSubscribe.mockReturnValue(jest.fn());
    mockSend.mockResolvedValue(undefined);
    (acquireSharedOscClient as jest.Mock).mockResolvedValue({
      client: {
        send: mockSend,
        startXRemoteKeepAlive: mockStartXRemoteKeepAlive,
        stopXRemoteKeepAlive: mockStopXRemoteKeepAlive,
        subscribe: mockSubscribe,
      },
      release: mockRelease,
    });
  });

  it('requests X32 meter streams through /meters with the meter id as a string', async () => {
    const { result, unmount } = renderHook(() => useMeterSubscription('192.168.0.10', true));

    await waitFor(() => expect(acquireSharedOscClient).toHaveBeenCalledWith('192.168.0.10'));

    act(() => {
      result.current.registerMeterListener(17, jest.fn());
      result.current.registerMeterListener(33, jest.fn());
    });

    expect(mockSend).toHaveBeenCalledWith(X32Protocol.getMetersSubscribePath(), [
      X32Protocol.getMeters1Path(),
    ]);
    expect(mockSend).toHaveBeenCalledWith(X32Protocol.getMetersSubscribePath(), [
      X32Protocol.getMeters13Path(),
    ]);
    expect(mockSubscribe).toHaveBeenCalledWith(X32Protocol.getMeters1Path(), expect.any(Function));
    expect(mockSubscribe).toHaveBeenCalledWith(X32Protocol.getMeters13Path(), expect.any(Function));

    unmount();
  });
});
