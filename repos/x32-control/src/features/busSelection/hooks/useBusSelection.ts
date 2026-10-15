import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { BusService } from '../services/BusService';
import { Bus } from '../types/Bus';

export const useBusSelection = (consoleIp: string) => {
  const service = useMemo(() => new BusService(), []);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(undefined);

    try {
      await service.connect(consoleIp);
      setBuses(await service.getBuses());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [consoleIp, service]);

  useEffect(() => {
    load();
    return () => service.disconnect();
  }, [load, service]);

  return {
    buses,
    error,
    isLoading,
    reload: load,
  };
};
