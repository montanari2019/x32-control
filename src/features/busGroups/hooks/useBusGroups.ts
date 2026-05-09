import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import {
  getMockProviderForIp,
  isDemoConsoleIp,
} from '@shared/mixer/mock/mockMixerProvider';
import { clamp } from '@shared/utils/clamp';
import { BusMixService } from '@features/busMix/services/BusMixService';
import { busMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { Channel } from '@features/busMix/types/Channel';
import { useOscSubscription } from './useOscSubscription';
import { BusGroupsSecureStoreService } from '../services/BusGroupsSecureStoreService';
import { X32BusGroupsService } from '../services/X32BusGroupsService';
import { BusGroupsState, McaAssignedChannel, McaGroup } from '../types/busGroups.types';

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

const PERSIST_DEBOUNCE_MS = 250;

const LEGACY_DEMO_MCA_NAMES: Record<number, string> = {
  1: 'Bateria',
  2: 'Baixo e Guitarra',
  3: 'Vocais',
  4: 'Keys e Playback',
  5: 'FX e Aux',
};

const normalizeStoredMcaName = (
  consoleIp: string,
  dcaNumber: number,
  storedName: string | undefined,
): string => {
  if (typeof storedName !== 'string') {
    return normalizeMcaName(dcaNumber);
  }

  const normalizedName = normalizeEditedMcaName(dcaNumber, storedName);
  if (
    isDemoConsoleIp(consoleIp) &&
    normalizedName === LEGACY_DEMO_MCA_NAMES[dcaNumber]
  ) {
    return normalizeMcaName(dcaNumber);
  }

  return normalizedName;
};

type DemoWritableProvider = {
  renameMca?: (dcaNumber: number, name: string) => void;
  setMcaAssignedChannels?: (dcaNumber: number, assignedChannels: McaAssignedChannel[]) => void;
};

export const useBusGroups = (consoleIp: string, busId: number) => {
  const service = useMemo(() => new X32BusGroupsService(), []);
  const busMixService = useMemo(() => new BusMixService(), []);
  const secureStoreService = useMemo(() => new BusGroupsSecureStoreService(), []);
  const isDemoConsole = isDemoConsoleIp(consoleIp);
  const demoProvider = useMemo<DemoWritableProvider | null>(
    () => (isDemoConsole ? (getMockProviderForIp(consoleIp) as DemoWritableProvider) : null),
    [consoleIp, isDemoConsole],
  );
  const [state, setState] = useState<BusGroupsState>(() => INITIAL_STATE(busId));
  const [availableChannels, setAvailableChannels] = useState<Channel[]>(() =>
    busMixChannelStore.getSnapshot(consoleIp, busId),
  );
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistableMcasRef = useRef<McaGroup[]>([]);
  const canPersistRef = useRef(false);

  const syncDemoProviderMcas = useCallback(
    (mcas: McaGroup[]): void => {
      if (!demoProvider) {
        return;
      }

      mcas.forEach((mca) => {
        demoProvider.renameMca?.(mca.dcaNumber, mca.name);
        demoProvider.setMcaAssignedChannels?.(mca.dcaNumber, mca.assignedChannels);
      });
    },
    [demoProvider],
  );

  const loadAvailableChannels = useCallback(async (): Promise<Channel[]> => {
    try {
      const nextChannels = await busMixChannelStore.loadChannels(consoleIp, busId, async () => {
        await busMixService.connect(consoleIp);
        return busMixService.loadChannels(busId);
      });
      setAvailableChannels(nextChannels);
      return nextChannels;
    } catch {
      return busMixChannelStore.getSnapshot(consoleIp, busId);
    }
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
      const normalizedState: BusGroupsState = {
        ...nextState,
        mcas: nextState.mcas.map((mca) => ({
          ...mca,
          name: normalizeEditedMcaName(mca.dcaNumber, mca.name),
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

          const assignedChannels = storedMca.assignedChannels ?? mca.assignedChannels;

          return {
            ...mca,
            faderRawValue: storedMca.faderRawValue,
            isMuted: storedMca.isMuted,
            name: normalizeStoredMcaName(consoleIp, mca.dcaNumber, storedMca.name),
            assignedChannels,
            assignedChannelIds: assignedChannels.map((channel) => channel.channelId),
          };
        });

        nextBusGroupsState = {
          ...normalizedState,
          mcas: restoredMcas,
        };
      }

      const nextAvailableChannels = await loadAvailableChannels();
      setAvailableChannels(nextAvailableChannels);
      syncDemoProviderMcas(nextBusGroupsState.mcas);
      setState(nextBusGroupsState);

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
  }, [busId, consoleIp, loadAvailableChannels, secureStoreService, service, syncDemoProviderMcas]);

  useEffect(() => {
    load();
    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
      if (canPersistRef.current && persistableMcasRef.current.length > 0) {
        secureStoreService
          .saveDcaState(consoleIp, persistableMcasRef.current)
          .catch(() => undefined);
      }
      service.disconnect();
      busMixService.disconnect();
    };
  }, [busMixService, consoleIp, load, secureStoreService, service]);

  useEffect(
    () =>
      busMixChannelStore.subscribe(consoleIp, busId, (nextChannels) => {
        setAvailableChannels(nextChannels);
      }),
    [busId, consoleIp],
  );

  useEffect(() => {
    canPersistRef.current = state.isConnected && !state.isLoading && state.mcas.length > 0;
    if (canPersistRef.current) {
      persistableMcasRef.current = state.mcas;
    }
  }, [state.isConnected, state.isLoading, state.mcas]);

  useEffect(() => {
    if (!state.isConnected || state.isLoading || state.mcas.length === 0) {
      return;
    }

    if (persistTimeoutRef.current) {
      clearTimeout(persistTimeoutRef.current);
    }

    persistTimeoutRef.current = setTimeout(() => {
      secureStoreService.saveDcaState(consoleIp, state.mcas).catch(() => undefined);
      persistTimeoutRef.current = null;
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimeoutRef.current) {
        clearTimeout(persistTimeoutRef.current);
        persistTimeoutRef.current = null;
      }
    };
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
    let nextAssignedChannels: McaAssignedChannel[] | null = null;

    setState((current) => ({
      ...current,
      mcas: current.mcas.map((mca) => {
        if (mca.dcaNumber !== dcaNumber) {
          return mca;
        }

        const isAlreadyAssigned = mca.assignedChannels.some(
          (item) => item.channelId === channel.number,
        );
        nextAssignedChannels = isAlreadyAssigned
          ? mca.assignedChannels.filter((item) => item.channelId !== channel.number)
          : [...mca.assignedChannels, assignedChannel];

        return {
          ...mca,
          assignedChannels: nextAssignedChannels,
          assignedChannelIds: nextAssignedChannels.map((item) => item.channelId),
        };
      }),
    }));

    if (nextAssignedChannels) {
      demoProvider?.setMcaAssignedChannels?.(dcaNumber, nextAssignedChannels);
    }
  }, [demoProvider]);

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
    demoProvider?.setMcaAssignedChannels?.(dcaNumber, []);
  }, [demoProvider]);

  const renameMca = useCallback((dcaNumber: number, name: string): void => {
    const nextName = normalizeEditedMcaName(dcaNumber, name);
    setState((current) => ({
      ...current,
      mcas: current.mcas.map((mca) =>
        mca.dcaNumber === dcaNumber
          ? {
              ...mca,
              name: nextName,
            }
          : mca,
      ),
    }));
    demoProvider?.renameMca?.(dcaNumber, nextName);
  }, [demoProvider]);

  const handleRemoteDcaFader = useCallback((dcaNumber: number, value: number): void => {
    setState((current) => {
      let hasChanged = false;

      const nextMcas = current.mcas.map((mca) => {
        if (mca.dcaNumber !== dcaNumber || mca.faderRawValue === value) {
          return mca;
        }

        hasChanged = true;
        return { ...mca, faderRawValue: value };
      });

      return hasChanged ? { ...current, mcas: nextMcas } : current;
    });
  }, []);

  const handleRemoteDcaMute = useCallback((dcaNumber: number, isMuted: boolean): void => {
    setState((current) => {
      let hasChanged = false;

      const nextMcas = current.mcas.map((mca) => {
        if (mca.dcaNumber !== dcaNumber || mca.isMuted === isMuted) {
          return mca;
        }

        hasChanged = true;
        return { ...mca, isMuted };
      });

      return hasChanged ? { ...current, mcas: nextMcas } : current;
    });
  }, []);

  const handleRemoteMasterFader = useCallback((value: number): void => {
    setState((current) =>
      current.masterFaderRaw === value ? current : { ...current, masterFaderRaw: value },
    );
  }, []);

  const handleRemoteMasterMute = useCallback((isMuted: boolean): void => {
    setState((current) =>
      current.masterMuted === isMuted ? current : { ...current, masterMuted: isMuted },
    );
  }, []);

  useOscSubscription({
    busId,
    mcas: state.mcas,
    service,
    onDcaFader: handleRemoteDcaFader,
    onDcaMute: handleRemoteDcaMute,
    onMasterFader: handleRemoteMasterFader,
    onMasterMute: handleRemoteMasterMute,
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
