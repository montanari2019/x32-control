import { useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { i18next } from '@shared/i18n';
import { DEMO_CONSOLE_ID, DEMO_CONSOLE_IP } from '@shared/mixer/mock/mockMixerProvider';
import { ConsoleDiscoveryService } from '../services/ConsoleDiscoveryService';
import { ConsoleDevice } from '../types/ConsoleDevice';

const DEMO_DEVICE: ConsoleDevice = {
  id: DEMO_CONSOLE_ID,
  ip: DEMO_CONSOLE_IP,
  port: 10023,
  name: 'Demo - X32 Control',
  model: 'Demo Console',
  status: 'connected',
  firmware: 'demo-1.0',
};

const getInitialDevices = (): ConsoleDevice[] => [DEMO_DEVICE];

const appendDemoDevice = (devices: ConsoleDevice[]): ConsoleDevice[] =>
  devices.some((device) => device.id === DEMO_CONSOLE_ID) ? devices : [...devices, DEMO_DEVICE];

export const useConsoleDiscovery = () => {
  const service = useMemo(() => new ConsoleDiscoveryService(), []);
  const [devices, setDevices] = useState<ConsoleDevice[]>(getInitialDevices);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>();

  const scan = async (): Promise<void> => {
    setIsSearching(true);
    setError(undefined);

    try {
      const found = await service.scan();
      setDevices(appendDemoDevice(found));
      if (found.length === 0) {
        setError(
          i18next.t('consoleDiscovery.noConsoleFound'),
        );
      }
    } catch (scanError) {
      setError(getErrorMessage(scanError));
      setDevices(getInitialDevices());
    } finally {
      setIsSearching(false);
    }
  };

  return {
    devices,
    error,
    isSearching,
    scan,
  };
};
