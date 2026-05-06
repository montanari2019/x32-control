import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { debounce } from '@shared/utils/debounce';
import { percentToX32Pan, x32PanToPercent } from '@shared/x32/pan';
import { BusMixService } from '../services/BusMixService';
import { Channel } from '../types/Channel';

export const useBusMix = (consoleIp: string, busNumber: number) => {
  const service = useMemo(() => new BusMixService(), []);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const debouncedSend = useMemo(
    () =>
      debounce((channel: number, level: number) => {
        service.setChannelFader(channel, busNumber, level).catch((sendError) => {
          setError(getErrorMessage(sendError));
        });
      }, 80),
    [busNumber, service],
  );

  const load = useCallback(
    async (refresh = false): Promise<void> => {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      setError(undefined);

      try {
        await service.connect(consoleIp);
        const nextChannels = await service.loadChannels(busNumber);
        setChannels(nextChannels);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        refresh ? setIsRefreshing(false) : setIsLoading(false);
      }
    },
    [busNumber, consoleIp, service],
  );

  useEffect(() => {
    load();
    return () => service.disconnect();
  }, [load, service]);

  useEffect(() => {
    const unsubscribers = channels.map((channel) =>
      service.onLevel(channel.number, busNumber, (returnedLevel) => {
        setChannels((current) =>
          current.map((item) =>
            item.number === channel.number ? { ...item, level: returnedLevel } : item,
          ),
        );
      }),
    );

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [busNumber, channels, service]);

  const setLevel = (channelNumber: number, level: number): void => {
    setChannels((current) =>
      current.map((channel) =>
        channel.number === channelNumber ? { ...channel, level } : channel,
      ),
    );
    setHasPendingChanges(true);
    debouncedSend(channelNumber, level);
  };

  const toggleOn = async (channelNumber: number): Promise<void> => {
    const channel = channels.find((item) => item.number === channelNumber);
    if (!channel) {
      return;
    }

    const nextOn = !channel.on;
    setChannels((current) =>
      current.map((item) => (item.number === channelNumber ? { ...item, on: nextOn } : item)),
    );
    setHasPendingChanges(true);

    try {
      await service.setChannelOn(channelNumber, busNumber, nextOn);
    } catch (toggleError) {
      setChannels((current) =>
        current.map((item) => (item.number === channelNumber ? { ...item, on: channel.on } : item)),
      );
      setError(getErrorMessage(toggleError));
    }
  };

  const setPan = (channelNumber: number, pan: number): void => {
    const nextPan = percentToX32Pan(pan);
    setChannels((current) =>
      current.map((channel) =>
        channel.number === channelNumber ? { ...channel, pan: nextPan } : channel,
      ),
    );
    setHasPendingChanges(true);
    service.setChannelPan(channelNumber, busNumber, nextPan).catch((sendError) => {
      setError(getErrorMessage(sendError));
    });
  };

  const save = useCallback(async (): Promise<void> => {
    if (!hasPendingChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
      setHasPendingChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [hasPendingChanges, isSaving]);

  return {
    channels,
    error,
    isLoading,
    isRefreshing,
    hasPendingChanges,
    isSaving,
    refresh: () => load(true),
    setLevel,
    toggleOn,
    setPan,
    getPanPercent: (value: number) => x32PanToPercent(value),
    save,
  };
};
