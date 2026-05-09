import { useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { DEMO_CONSOLE_ID, DEMO_CONSOLE_IP } from '@shared/mixer/mock/mockMixerProvider';
import { ConsoleDiscoveryService } from '../services/ConsoleDiscoveryService';
import { ConsoleDevice } from '../types/ConsoleDevice';

const DEMO_DEVICE: ConsoleDevice = {
  id: DEMO_CONSOLE_ID,
  ip: DEMO_CONSOLE_IP,
  port: 10023,
  name: 'Demo - X32 Control',
  model: 'Console de Demonstracao',
  status: 'connected',
  firmware: 'demo-1.0',
};

export const useConsoleDiscovery = () => {
  const service = useMemo(() => new ConsoleDiscoveryService(), []);
  const [devices, setDevices] = useState<ConsoleDevice[]>([DEMO_DEVICE]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>();

  const scan = async (): Promise<void> => {
    setIsSearching(true);
    setError(undefined);

    try {
      const found = await service.scan();
      setDevices([DEMO_DEVICE, ...found]);
      if (found.length === 0) {
        setError('Nenhuma X32/M32 respondeu ao broadcast. Verifique a rede e tente novamente.');
      }
    } catch (scanError) {
      setError(getErrorMessage(scanError));
      setDevices([DEMO_DEVICE]);
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
