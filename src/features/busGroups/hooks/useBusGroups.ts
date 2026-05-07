import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { clamp } from '@shared/utils/clamp';
import { BusMixService } from '@features/busMix/services/BusMixService';
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

export const useBusGroups = (consoleIp: string, busId: number) => {
  const service = useMemo(() => new X32BusGroupsService(), []);
  const busMixService = useMemo(() => new BusMixService(), []);
  const secureStoreService = useMemo(() => new BusGroupsSecureStoreService(), []);
  const [state, setState] = useState<BusGroupsState>(() => INITIAL_STATE(busId));
  const [availableChannels, setAvailableChannels] = useState<Channel[]>([]);

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
      await busMixService.connect(consoleIp);
      const [nextState, loadedChannels] = await Promise.all([
        service.fetchInitialState(busId),
        busMixService.loadChannels(busId),
      ]);
      const normalizedState = {
        ...nextState,
        mcas: nextState.mcas.map((mca) => ({
          ...mca,
          name: normalizeMcaName(mca.dcaNumber),
        })),
      };
      setAvailableChannels(loadedChannels);
      const storedState = await secureStoreService.getDcaState(consoleIp);

      if (!storedState || storedState.mcas.length === 0) {
        setState(normalizedState);
        return;
      }

      const restoredMcas = normalizedState.mcas.map((mca) => {
        const storedMca = storedState.mcas.find((item) => item.dcaNumber === mca.dcaNumber);
        if (!storedMca) {
          return mca;
        }

        return {
          ...mca,
          faderRawValue: storedMca.faderRawValue,
          isMuted: storedMca.isMuted,
          name: normalizeMcaName(mca.dcaNumber),
          assignedChannels: storedMca.assignedChannels ?? mca.assignedChannels,
          assignedChannelIds: (storedMca.assignedChannels ?? mca.assignedChannels).map(
            (channel) => channel.channelId,
          ),
        };
      });

      await Promise.all(
        restoredMcas.map(async (mca) => {
          await Promise.all([
            service.setDcaFader(mca.dcaNumber, mca.faderRawValue),
            service.setDcaOn(mca.dcaNumber, !mca.isMuted),
          ]);
        }),
      );

      setState({
        ...normalizedState,
        mcas: restoredMcas,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        isConnected: false,
        isLoading: false,
        error: getErrorMessage(error),
      }));
    }
  }, [busId, busMixService, consoleIp, secureStoreService, service]);

  useEffect(() => {
    load();
    return () => {
      service.disconnect();
      busMixService.disconnect();
    };
  }, [busMixService, load, service]);

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

  const toggleMcaChannelAssignment = useCallback(
    (dcaNumber: number, channel: Channel): void => {
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
    },
    [],
  );

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
  };
};
