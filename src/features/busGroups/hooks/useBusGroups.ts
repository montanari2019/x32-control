import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { clamp } from '@shared/utils/clamp';
import { useOscSubscription } from './useOscSubscription';
import { BusGroupsSecureStoreService } from '../services/BusGroupsSecureStoreService';
import { X32BusGroupsService } from '../services/X32BusGroupsService';
import { BusGroupsState } from '../types/busGroups.types';

const INITIAL_STATE = (busId: number): BusGroupsState => ({
  busId,
  masterFaderRaw: 0,
  masterMuted: false,
  mcas: [],
  isConnected: false,
  isLoading: true,
  error: null,
});

export const useBusGroups = (consoleIp: string, busId: number) => {
  const service = useMemo(() => new X32BusGroupsService(), []);
  const secureStoreService = useMemo(() => new BusGroupsSecureStoreService(), []);
  const [state, setState] = useState<BusGroupsState>(() => INITIAL_STATE(busId));

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
      const storedState = await secureStoreService.getDcaState(consoleIp);

      if (!storedState || storedState.mcas.length === 0) {
        setState(nextState);
        return;
      }

      const restoredMcas = nextState.mcas.map((mca) => {
        const storedMca = storedState.mcas.find((item) => item.dcaNumber === mca.dcaNumber);
        if (!storedMca) {
          return mca;
        }

        return {
          ...mca,
          faderRawValue: storedMca.faderRawValue,
          isMuted: storedMca.isMuted,
          name: storedMca.name || mca.name,
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
        ...nextState,
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
  }, [busId, consoleIp, secureStoreService, service]);

  useEffect(() => {
    load();
    return () => service.disconnect();
  }, [load, service]);

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
    reload: load,
    setMcaFader,
    toggleMcaMute,
    setMasterFader,
    toggleMasterMute,
  };
};
