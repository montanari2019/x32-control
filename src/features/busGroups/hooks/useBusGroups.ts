import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import {
  getMockProviderForIp,
  isDemoConsoleIp,
  isMockConsoleIp,
} from '@shared/mixer/mock/mockMixerProvider';
import { clamp } from '@shared/utils/clamp';
import { x32RawToDb } from '@shared/utils/faderDb';
import { BusMixService } from '@features/busMix/services/BusMixService';
import { busMixChannelStore } from '@features/busMix/services/BusMixChannelStore';
import { Channel } from '@features/busMix/types/Channel';
import { clampMeterValue, METER_MIN_DBFS } from '@features/busMix/utils/meterDecoder';
import { useOscSubscription } from './useOscSubscription';
import { MCA_DEFAULT_RAW_VALUE, McaChannelFaderService } from '../services/McaChannelFaderService';
import { BusGroupsSecureStoreService } from '../services/BusGroupsSecureStoreService';
import { BusGroupsService } from '../services/BusGroupsService';
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
const MCA_FADER_SEND_INTERVAL_MS = 30;
const MCA_LOCAL_PROTECTION_WINDOW_MS = 250;
const MASTER_METER_UPDATE_THRESHOLD_DB = 0.35;

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
  if (isDemoConsoleIp(consoleIp) && normalizedName === LEGACY_DEMO_MCA_NAMES[dcaNumber]) {
    return normalizeMcaName(dcaNumber);
  }

  return normalizedName;
};

const clearInitialMcaAssignments = (mcas: McaGroup[]): McaGroup[] =>
  mcas.map((mca) => ({
    ...mca,
    assignedChannels: [],
    assignedChannelIds: [],
    isMuted: false,
    name: normalizeMcaName(mca.dcaNumber),
  }));

type DemoWritableProvider = {
  renameMca?: (dcaNumber: number, name: string) => void;
  setMcaAssignedChannels?: (dcaNumber: number, assignedChannels: McaAssignedChannel[]) => void;
  setMcaFaderValue?: (dcaNumber: number, value: number) => void;
  setMcaMuted?: (dcaNumber: number, isMuted: boolean) => void;
};

type UseBusGroupsOptions = {
  isMasterMeterActive?: boolean;
};

export const useBusGroups = (
  consoleIp: string,
  busId: number,
  options: UseBusGroupsOptions = {},
) => {
  const { isMasterMeterActive = true } = options;
  const service = useMemo(() => new BusGroupsService(), []);
  const busMixService = useMemo(() => new BusMixService(), []);
  const mcaFaderService = useMemo(() => new McaChannelFaderService(busMixService), [busMixService]);
  const secureStoreService = useMemo(() => new BusGroupsSecureStoreService(), []);
  const isDemoConsole = isDemoConsoleIp(consoleIp);
  const isMockConsole = isMockConsoleIp(consoleIp);
  const demoProvider = useMemo<DemoWritableProvider | null>(
    () => (isMockConsole ? (getMockProviderForIp(consoleIp) as DemoWritableProvider) : null),
    [consoleIp, isMockConsole],
  );
  const [state, setState] = useState<BusGroupsState>(() => INITIAL_STATE(busId));
  const [masterMeterDbfs, setMasterMeterDbfs] = useState(METER_MIN_DBFS);
  const [availableChannels, setAvailableChannels] = useState<Channel[]>(() =>
    busMixChannelStore.getSnapshot(consoleIp, busId),
  );
  const availableChannelsSourcesKey = useMemo(
    () => availableChannels.map((ch) => ch.id).join(','),
    [availableChannels],
  );
  const availableChannelsRef = useRef<Channel[]>([]);
  const persistTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistableMcasRef = useRef<McaGroup[]>([]);
  const mcasRef = useRef<McaGroup[]>([]);
  const canPersistRef = useRef(false);
  const mcaFaderTimerRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const pendingMcaBaseRawRef = useRef<Map<number, number>>(new Map());
  const mcaFaderValuesRef = useRef<Map<number, number>>(new Map());
  const mcaLastLocalChangeAtRef = useRef<Map<number, number>>(new Map());
  const masterMeterDbfsRef = useRef(METER_MIN_DBFS);

  useEffect(() => {
    mcasRef.current = state.mcas;
    mcaFaderValuesRef.current = new Map(
      state.mcas.map((mca) => [mca.dcaNumber, mca.faderRawValue]),
    );
  }, [state.mcas]);

  const updateMasterMeterDbfs = useCallback((dbfs: number): void => {
    const nextDbfs = clampMeterValue(dbfs);
    if (Math.abs(nextDbfs - masterMeterDbfsRef.current) < MASTER_METER_UPDATE_THRESHOLD_DB) {
      return;
    }

    masterMeterDbfsRef.current = nextDbfs;
    setMasterMeterDbfs(nextDbfs);
  }, []);

  useEffect(() => {
    masterMeterDbfsRef.current = METER_MIN_DBFS;
    setMasterMeterDbfs(METER_MIN_DBFS);
  }, [busId, consoleIp]);

  const computeMcaFaderValue = useCallback(
    (assignedChannels: McaAssignedChannel[]): number =>
      mcaFaderService.computeAverageRaw(consoleIp, busId, assignedChannels),
    [busId, consoleIp, mcaFaderService],
  );

  const computeMcaMutedValue = useCallback(
    (assignedChannels: McaAssignedChannel[], fallback = false): boolean => {
      if (assignedChannels.length === 0) {
        return false;
      }

      const assignedIds = new Set(assignedChannels.map((channel) => channel.channelId));
      const matchedChannels = busMixChannelStore
        .getSnapshot(consoleIp, busId)
        .filter((channel) => assignedIds.has(channel.number));

      if (matchedChannels.length === 0) {
        return fallback;
      }

      return matchedChannels.every((channel) => !channel.on);
    },
    [busId, consoleIp],
  );

  const clearPendingMcaFader = useCallback((dcaNumber: number): void => {
    const existingTimer = mcaFaderTimerRef.current.get(dcaNumber);
    if (existingTimer) {
      clearTimeout(existingTimer);
      mcaFaderTimerRef.current.delete(dcaNumber);
    }

    pendingMcaBaseRawRef.current.delete(dcaNumber);
  }, []);

  const applyAssignedChannelsToMca = useCallback(
    (dcaNumber: number, assignedChannels: McaAssignedChannel[]): void => {
      const currentMca = mcasRef.current.find((mca) => mca.dcaNumber === dcaNumber);
      if (!currentMca) {
        return;
      }

      clearPendingMcaFader(dcaNumber);
      mcaLastLocalChangeAtRef.current.delete(dcaNumber);

      const nextFaderRawValue = computeMcaFaderValue(assignedChannels);
      const nextMuted = computeMcaMutedValue(assignedChannels, currentMca.isMuted);
      const nextMcas = mcasRef.current.map((mca) =>
        mca.dcaNumber === dcaNumber
          ? {
              ...mca,
              assignedChannels,
              assignedChannelIds: assignedChannels.map((channel) => channel.channelId),
              faderRawValue: nextFaderRawValue,
              isMuted: nextMuted,
            }
          : mca,
      );

      mcasRef.current = nextMcas;
      mcaFaderValuesRef.current.set(
        dcaNumber,
        assignedChannels.length === 0 ? MCA_DEFAULT_RAW_VALUE : nextFaderRawValue,
      );

      setState((current) => ({
        ...current,
        mcas: current.mcas.map((mca) =>
          mca.dcaNumber === dcaNumber
            ? {
                ...mca,
                assignedChannels,
                assignedChannelIds: assignedChannels.map((channel) => channel.channelId),
                faderRawValue: nextFaderRawValue,
                isMuted: nextMuted,
              }
            : mca,
        ),
      }));

      demoProvider?.setMcaAssignedChannels?.(dcaNumber, assignedChannels);
      demoProvider?.setMcaFaderValue?.(dcaNumber, nextFaderRawValue);
      demoProvider?.setMcaMuted?.(dcaNumber, nextMuted);
    },
    [clearPendingMcaFader, computeMcaFaderValue, computeMcaMutedValue, demoProvider],
  );

  const syncDemoProviderMcas = useCallback(
    (mcas: McaGroup[]): void => {
      if (!demoProvider) {
        return;
      }

      mcas.forEach((mca) => {
        demoProvider.renameMca?.(mca.dcaNumber, mca.name);
        demoProvider.setMcaAssignedChannels?.(mca.dcaNumber, mca.assignedChannels);
        demoProvider.setMcaFaderValue?.(mca.dcaNumber, mca.faderRawValue);
        demoProvider.setMcaMuted?.(mca.dcaNumber, mca.isMuted);
      });
    },
    [demoProvider],
  );

  const loadAvailableChannels = useCallback(async (): Promise<Channel[]> => {
    try {
      await busMixService.connect(consoleIp);
      const nextChannels = await busMixChannelStore.loadChannels(consoleIp, busId, () =>
        busMixService.loadChannels(busId),
      );
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
      let nextBusGroupsState: BusGroupsState = {
        ...normalizedState,
        mcas: clearInitialMcaAssignments(normalizedState.mcas),
      };

      if (storedState && storedState.mcas.length > 0) {
        const restoredMcas = normalizedState.mcas.map((mca) => {
          const storedMca = storedState.mcas.find((item) => item.dcaNumber === mca.dcaNumber);
          if (!storedMca) {
            return mca;
          }

          const assignedChannels = storedMca.assignedChannels ?? [];

          return {
            ...mca,
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
      nextBusGroupsState = {
        ...nextBusGroupsState,
        mcas: nextBusGroupsState.mcas.map((mca) => ({
          ...mca,
          faderRawValue: computeMcaFaderValue(mca.assignedChannels),
          isMuted: computeMcaMutedValue(mca.assignedChannels, mca.isMuted),
        })),
      };
      syncDemoProviderMcas(nextBusGroupsState.mcas);
      setState(nextBusGroupsState);
    } catch (error) {
      setState((current) => ({
        ...current,
        isConnected: false,
        isLoading: false,
        error: getErrorMessage(error),
      }));
    }
  }, [
    busId,
    computeMcaFaderValue,
    consoleIp,
    loadAvailableChannels,
    secureStoreService,
    service,
    syncDemoProviderMcas,
  ]);

  useEffect(() => {
    load();
    return () => {
      mcaFaderTimerRef.current.forEach((timerId) => clearTimeout(timerId));
      mcaFaderTimerRef.current.clear();
      pendingMcaBaseRawRef.current.clear();
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
        availableChannelsRef.current = nextChannels;
        setAvailableChannels(nextChannels);
        setState((current) => {
          const now = Date.now();
          let hasChanged = false;

          const nextMcas = current.mcas.map((mca) => {
            const lastLocalChangeAt = mcaLastLocalChangeAtRef.current.get(mca.dcaNumber) ?? 0;
            const isWithinLocalProtectionWindow =
              now - lastLocalChangeAt < MCA_LOCAL_PROTECTION_WINDOW_MS;
            if (isWithinLocalProtectionWindow) {
              return mca;
            }

            const nextFaderRawValue = computeMcaFaderValue(mca.assignedChannels);
            const nextMuted = computeMcaMutedValue(mca.assignedChannels, mca.isMuted);
            if (mca.faderRawValue === nextFaderRawValue && mca.isMuted === nextMuted) {
              return mca;
            }

            hasChanged = true;
            return {
              ...mca,
              faderRawValue: nextFaderRawValue,
              isMuted: nextMuted,
            };
          });

          return hasChanged ? { ...current, mcas: nextMcas } : current;
        });
      }),
    [busId, computeMcaFaderValue, computeMcaMutedValue, consoleIp],
  );

  useEffect(() => {
    const channels = availableChannelsRef.current;
    if (channels.length === 0) {
      return;
    }

    if (typeof busMixService.onLevel !== 'function' || typeof busMixService.onOn !== 'function') {
      return;
    }

    const unsubscribers = channels.flatMap((channel) => [
      busMixService.onLevel(channel, busId, (remoteLevel) => {
        const level = clamp(remoteLevel);
        const faderDb = x32RawToDb(level);
        busMixChannelStore.updateChannels(consoleIp, busId, (current) =>
          current.map((ch) =>
            ch.number === channel.number
              ? {
                  ...ch,
                  faderRaw: level,
                  faderDb,
                  localFaderRaw: level,
                  remoteFaderRaw: level,
                  level,
                  isDirty: false,
                }
              : ch,
          ),
        );
      }),
      busMixService.onOn(channel, busId, (remoteOn) => {
        busMixChannelStore.updateChannels(consoleIp, busId, (current) =>
          current.map((ch) => (ch.number === channel.number ? { ...ch, on: remoteOn } : ch)),
        );
      }),
    ]);

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [availableChannelsSourcesKey, busId, busMixService, consoleIp]);

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

  useEffect(() => {
    if (!isMasterMeterActive || !state.isConnected || state.isLoading) {
      updateMasterMeterDbfs(METER_MIN_DBFS);
      return undefined;
    }

    return service.subscribeToBusMasterMeter(busId, updateMasterMeterDbfs);
  }, [
    busId,
    isMasterMeterActive,
    service,
    state.isConnected,
    state.isLoading,
    updateMasterMeterDbfs,
  ]);

  const setMcaFader = useCallback(
    (dcaNumber: number, value: number): void => {
      const nextValue = clamp(value);
      const currentMca = state.mcas.find((mca) => mca.dcaNumber === dcaNumber);
      if (!currentMca || currentMca.assignedChannels.length === 0) {
        return;
      }

      const previousValue = mcaFaderValuesRef.current.get(dcaNumber) ?? currentMca.faderRawValue;
      if (previousValue === nextValue) {
        return;
      }

      if (!pendingMcaBaseRawRef.current.has(dcaNumber)) {
        pendingMcaBaseRawRef.current.set(dcaNumber, previousValue);
      }

      mcaLastLocalChangeAtRef.current.set(dcaNumber, Date.now());
      mcaFaderValuesRef.current.set(dcaNumber, nextValue);
      setState((current) => ({
        ...current,
        mcas: current.mcas.map((mca) =>
          mca.dcaNumber === dcaNumber
            ? {
                ...mca,
                faderRawValue: nextValue,
              }
            : mca,
        ),
      }));

      demoProvider?.setMcaFaderValue?.(dcaNumber, nextValue);

      const existingTimer = mcaFaderTimerRef.current.get(dcaNumber);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timerId = setTimeout(() => {
        mcaFaderTimerRef.current.delete(dcaNumber);
        const baseValue = pendingMcaBaseRawRef.current.get(dcaNumber) ?? currentMca.faderRawValue;
        const targetValue = mcaFaderValuesRef.current.get(dcaNumber) ?? nextValue;
        pendingMcaBaseRawRef.current.delete(dcaNumber);

        mcaFaderService
          .applyProportionalFader(
            consoleIp,
            busId,
            currentMca.assignedChannels,
            baseValue,
            targetValue,
          )
          .catch((error) => {
            setState((current) => ({ ...current, error: getErrorMessage(error) }));
          });
      }, MCA_FADER_SEND_INTERVAL_MS);

      mcaFaderTimerRef.current.set(dcaNumber, timerId);
    },
    [busId, consoleIp, demoProvider, mcaFaderService, state.mcas],
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
      demoProvider?.setMcaMuted?.(dcaNumber, nextMuted);

      mcaFaderService
        .applyMuteToChannels(consoleIp, busId, currentMca.assignedChannels, nextMuted)
        .catch((error) => {
          setState((current) => ({
            ...current,
            error: getErrorMessage(error),
            mcas: current.mcas.map((mca) =>
              mca.dcaNumber === dcaNumber ? { ...mca, isMuted: currentMca.isMuted } : mca,
            ),
          }));
          demoProvider?.setMcaMuted?.(dcaNumber, currentMca.isMuted);
        });
    },
    [busId, consoleIp, demoProvider, mcaFaderService, state.mcas],
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
      const currentMca = mcasRef.current.find((mca) => mca.dcaNumber === dcaNumber);
      if (!currentMca) {
        return;
      }

      const assignedChannel: McaAssignedChannel = {
        channelId: channel.number,
        channelName: channel.name,
        channelLabel: channel.label,
        channelType: channel.kind,
      };
      const isAlreadyAssigned = currentMca.assignedChannels.some(
        (item) => item.channelId === channel.number,
      );
      const nextAssignedChannels = isAlreadyAssigned
        ? currentMca.assignedChannels.filter((item) => item.channelId !== channel.number)
        : [...currentMca.assignedChannels, assignedChannel];
      applyAssignedChannelsToMca(dcaNumber, nextAssignedChannels);
    },
    [applyAssignedChannelsToMca],
  );

  const clearMcaChannels = useCallback(
    (dcaNumber: number): void => {
      applyAssignedChannelsToMca(dcaNumber, []);
    },
    [applyAssignedChannelsToMca],
  );

  const renameMca = useCallback(
    (dcaNumber: number, name: string): void => {
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
    },
    [demoProvider],
  );

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
    service,
    onMasterFader: handleRemoteMasterFader,
    onMasterMute: handleRemoteMasterMute,
  });

  return {
    ...state,
    masterMeterDbfs,
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
