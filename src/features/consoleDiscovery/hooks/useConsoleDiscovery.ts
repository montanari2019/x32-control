import { useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { ConsoleDiscoveryService } from '../services/ConsoleDiscoveryService';
import { ConsoleDevice } from '../types/ConsoleDevice';

export const useConsoleDiscovery = () => {
  const service = useMemo(() => new ConsoleDiscoveryService(), []);
  const [devices, setDevices] = useState<ConsoleDevice[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string>();

  const scan = async (): Promise<void> => {
    setIsSearching(true);
    setError(undefined);

    try {
      const found = await service.scan();
      setDevices(found);
      if (found.length === 0) {
        setError(
          'Nenhuma X32/M32 respondeu ao broadcast. Tente informar o IP manualmente.',
        );
      }
    } catch (scanError) {
      setError(getErrorMessage(scanError));
    } finally {
      setIsSearching(false);
    }
  };

  const validateManualIp = async (
    ip: string,
  ): Promise<ConsoleDevice | undefined> => {
    setIsSearching(true);
    setError(undefined);

    try {
      const device = await service.validateManualIp(ip.trim());
      setDevices((current) => [
        device,
        ...current.filter((item) => item.ip !== device.ip),
      ]);
      return device;
    } catch (manualError) {
      setError(getErrorMessage(manualError));
      return undefined;
    } finally {
      setIsSearching(false);
    }
  };

  return {
    devices,
    error,
    isSearching,
    scan,
    validateManualIp,
  };
};
