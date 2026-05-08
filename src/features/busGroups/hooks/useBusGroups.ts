import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { clamp } from '@shared/utils/clamp';
import { BusMixService } from '@features/busMix/services/BusMixService';
import { busMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { Channel } from '@features/busMix/types/Channel';
import { useOscSubscription } from './useOscSubscription';
import { BusGroupsSecureStoreService } from '../services/BusGroupsSecureStoreService';
import { X32BusGroupsService } from '../services/X32BusGroupsService';
import { BusGroupsState, McaAssignedChannel } from '../types/busGroups.types';

const INITIAL_STATE = (busId: number): BusGroupsState => ({
  busId,
  masterFaderRaw: 0,
  masterMuted: false,
  mcas: [],
  isConnected: false,
  isLoading: true,
  error: null,
});

const normalizeMcaName = (dcaNumber: number): string => `MCA ${dcaNumber}`;

const normalizeEditedMcaName = (dcaNumber: number, name: string): string => {
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  return normalizedName || normalizeMcaName(dcaNumber);
};

export const useBusGroups = (consoleIp: string, busId: number) => {
  const service = useMemo(() => new X32BusGroupsService(), []);
  const busMixService = useMemo(() => new BusMixService(), []);
  const secureStoreService = useMemo(() => new BusGroupsSecureStoreService(), []);
  const [state, setState] = useState<BusGroupsState>(() => INITIAL_STATE(busId));
  const [availableChannels, setAvailableChannels] = useState<Channel[]>(() =>
    busMixChannelStore.getSnapshot(consoleIp, busId),
  );

  const loadAvailableChannels = useCallback((): void => {
    busMixChannelStore
      .loadChannels(consoleIp, busId, async () => {
        await busMixService.connect(consoleIp);
        return busMixService.loadChannels(busId);
      })
      .catch(() => undefined);
  }, [busId, busMixService, consoleIp]);

  const load = useCallback(async (): Promise<void> => {
    setState((current) => ({
      ...current,
      busId,
      isLoading: true,
      error: null,
    }));

    try {
      await service.connect(consoleIp);
      service.startHeartbeat();
      const nextState = await service.fetchInitialState(busId);
      const normalizedState = {
        ...nextState,
        mcas: nextState.mcas.map((mca) => ({
          ...mca,
          name: normalizeMcaName(mca.dcaNumber),
          assignedChannels: [],
          assignedChannelIds: [],
        })),
      };
      const storedState = await secureStoreService.getDcaState(consoleIp);
      let nextBusGroupsState = normalizedState;

      if (storedState && storedState.mcas.length > 0) {
        const restoredMcas = normalizedState.mcas.map((mca) => {
          const storedMca = storedState.mcas.find((item) => item.dcaNumber === mca.dcaNumber);
          if (!storedMca) {
            return mca;
          }

          return {
            ...mca,
            faderRawValue: storedMca.faderRawValue,
            isMuted: storedMca.isMuted,
            name: normalizeEditedMcaName(
              mca.dcaNumber,
              typeof storedMca.name === 'string' ? storedMca.name : normalizeMcaName(mca.dcaNumber),
            ),
            assignedChannels: storedMca.assignedChannels ?? [],
            assignedChannelIds: (storedMca.assignedChannels ?? []).map(
              (channel) => channel.channelId,
            ),
          };
        });

        nextBusGroupsState = {
          ...normalizedState,
          mcas: restoredMcas,
        };
      }

      setState(nextBusGroupsState);
      loadAvailableChannels();

      if (storedState && storedState.mcas.length > 0) {
        nextBusGroupsState.mcas.forEach((mca) => {
          Promise.all([
            service.setDcaFader(mca.dcaNumber, mca.faderRawValue),
            service.setDcaOn(mca.dcaNumber, !mca.isMuted),
          ]).catch(() => undefined);
        });
      }
    } catch (error) {
      setState((current) => ({
        ...current,
        isConnected: false,
        isLoading: false,
        error: getErrorMessage(error),
      }));
    }
  }, [busId, consoleIp, loadAvailableChannels, secureStoreService, service]);

  useEffect(() => {
    load();
    return () => {
      service.disconnect();
      busMixService.disconnect();
    };
  }, [busMixService, load, service]);

  useEffect(
    () =>
      busMixChannelStore.subscribe(consoleIp, busId, (nextChannels) => {
        setAvailableChannels(nextChannels);
      }),
    [busId, consoleIp],
  );

  useEffect(() => {
    if (!state.isConnected || state.isLoading || state.mcas.length === 0) {
      return;
    }

    secureStoreService.saveDcaState(consoleIp, state.mcas).catch(() => undefined);
  }, [consoleIp, secureStoreService, state.isConnected, state.isLoading, state.mcas]);

  const setMcaFader = useCallback(
    (dcaNumber: number, value: number): void => {
      const nextValue = clamp(value);
      setState((current) => ({
        ...current,
        mcas: current.mcas.map((mca) =>
          mca.dcaNumber === dcaNumber ? { ...mca, faderRawValue: nextValue } : mca,
        ),
      }));
      service.setDcaFader(dcaNumber, nextValue).catch((error) => {
        setState((current) => ({ ...current, error: getErrorMessage(error) }));
      });
    },
    [service],
  );

  const toggleMcaMute = useCallback(
    (dcaNumber: number): void => {
      const currentMca = state.mcas.find((mca) => mca.dcaNumber === dcaNumber);
      if (!currentMca) {
        return;
      }

      const nextMuted = !currentMca.isMuted;
      setState((current) => ({
        ...current,
        mcas: current.mcas.map((mca) =>
          mca.dcaNumber === dcaNumber ? { ...mca, isMuted: nextMuted } : mca,
        ),
      }));

      service.setDcaOn(dcaNumber, !nextMuted).catch((error) => {
        setState((current) => ({
          ...current,
          error: getErrorMessage(error),
          mcas: current.mcas.map((mca) =>
            mca.dcaNumber === dcaNumber ? { ...mca, isMuted: currentMca.isMuted } : mca,
          ),
        }));
      });
    },
    [service, state.mcas],
  );

  const setMasterFader = useCallback(
    (value: number): void => {
      const nextValue = clamp(value);
      setState((current) => ({
        ...current,
        masterFaderRaw: nextValue,
      }));
      service.setBusMasterFader(busId, nextValue).catch((error) => {
        setState((current) => ({ ...current, error: getErrorMessage(error) }));
      });
    },
    [busId, service],
  );

  const toggleMasterMute = useCallback((): void => {
    const nextMuted = !state.masterMuted;
    setState((current) => ({
      ...current,
      masterMuted: nextMuted,
    }));
    service.setBusMasterOn(busId, !nextMuted).catch((error) => {
      setState((current) => ({
        ...current,
        error: getErrorMessage(error),
        masterMuted: state.masterMuted,
      }));
    });
  }, [busId, service, state.masterMuted]);

  const toggleMcaChannelAssignment = useCallback((dcaNumber: number, channel: Channel): void => {
    const assignedChannel: McaAssignedChannel = {
      channelId: channel.number,
      channelName: channel.name,
      channelLabel: channel.label,
      channelType: channel.kind,
    };

    setState((current) => ({
      ...current,
      mcas: current.mcas.map((mca) => {
        if (mca.dcaNumber !== dcaNumber) {
          return mca;
        }

        const isAlreadyAssigned = mca.assignedChannels.some(
          (item) => item.channelId === channel.number,
        );
        const nextAssignedChannels = isAlreadyAssigned
          ? mca.assignedChannels.filter((item) => item.channelId !== channel.number)
          : [...mca.assignedChannels, assignedChannel];

        return {
          ...mca,
          assignedChannels: nextAssignedChannels,
          assignedChannelIds: nextAssignedChannels.map((item) => item.channelId),
        };
      }),
    }));
  }, []);

  const clearMcaChannels = useCallback((dcaNumber: number): void => {
    setState((current) => ({
      ...current,
      mcas: current.mcas.map((mca) =>
        mca.dcaNumber === dcaNumber
          ? {
              ...mca,
              assignedChannels: [],
              assignedChannelIds: [],
            }
          : mca,
      ),
    }));
  }, []);

  const renameMca = useCallback((dcaNumber: number, name: string): void => {
    setState((current) => ({
      ...current,
      mcas: current.mcas.map((mca) =>
        mca.dcaNumber === dcaNumber
          ? {
              ...mca,
              name: normalizeEditedMcaName(dcaNumber, name),
            }
          : mca,
      ),
    }));
  }, []);

  useOscSubscription({
    busId,
    mcas: state.mcas,
    service,
    onDcaFader: (dcaNumber, value) => {
      setState((current) => ({
        ...current,
        mcas: current.mcas.map((mca) =>
          mca.dcaNumber === dcaNumber ? { ...mca, faderRawValue: value } : mca,
        ),
      }));
    },
    onDcaMute: (dcaNumber, isMuted) => {
      setState((current) => ({
        ...current,
        mcas: current.mcas.map((mca) => (mca.dcaNumber === dcaNumber ? { ...mca, isMuted } : mca)),
      }));
    },
    onMasterFader: (value) => {
      setState((current) => ({ ...current, masterFaderRaw: value }));
    },
    onMasterMute: (isMuted) => {
      setState((current) => ({ ...current, masterMuted: isMuted }));
    },
  });

  return {
    ...state,
    availableChannels,
    reload: load,
    setMcaFader,
    toggleMcaMute,
    setMasterFader,
    toggleMasterMute,
    toggleMcaChannelAssignment,
    clearMcaChannels,
    renameMca,
  };
};
