import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@shared/errors/AppError';
import { x32RawToDb } from '@shared/utils/faderDb';
import { percentToX32Pan, x32PanToPercent } from '@shared/x32/pan';
import { busMixChannelStore } from '../services/BusMixChannelStore';
import { BusMixPresetService } from '../services/BusMixPresetService';
import { BusMixService } from '../services/BusMixService';
import { channelStructureCache } from '../services/ChannelStructureCache';
import { Channel } from '../types/Channel';
import { BusMixPreset, BusMixPresetChannel } from '../types/BusMixPreset';
import {
  applyLinkedLocalLevelUpdate,
  applyLinkedOnUpdate,
  applyLinkedRemoteLevelUpdate,
  applyPanUpdate,
  getLinkedPeerNumber,
} from '../utils/linkedChannelSync';

const FADER_SEND_INTERVAL_MS = 30;
const LOCAL_PROTECTION_WINDOW_MS = 250;
const BACKGROUND_SYNC_INTERVAL_MS = 30000;
const BACKGROUND_SYNC_JITTER_MS = 5000;
const REALTIME_SUBSCRIPTION_STALE_MS = 15000;

type BusMixRealtimeSubscriptionHealth = {
  levelEventCount: number;
  onEventCount: number;
  panEventCount: number;
  staleAfterMs: number;
  subscribedAt?: number;
  lastEventAt?: number;
  lastLevelOrOnEventAt?: number;
  lastPanEventAt?: number;
};

const waitForNextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => resolve());
  });

export const useBusMix = (consoleIp: string, busNumber: number) => {
  const service = useMemo(() => new BusMixService(), []);
  const presetService = useMemo(() => new BusMixPresetService(), []);
  const [channels, setChannels] = useState<Channel[]>(() =>
    busMixChannelStore.getSnapshot(consoleIp, busNumber),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [presets, setPresets] = useState<BusMixPreset[]>([]);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);
  const [isRestoringPreset, setIsRestoringPreset] = useState(false);
  const pendingFadersRef = useRef(new Map<number, number>());
  const pendingLocalChangeAtRef = useRef(new Map<number, number>());
  const faderFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelsRef = useRef<Channel[]>([]);
  const channelLinkMapRef = useRef(new Map<number, number>());
  const realtimeHealthRef = useRef<BusMixRealtimeSubscriptionHealth>({
    levelEventCount: 0,
    onEventCount: 0,
    panEventCount: 0,
    staleAfterMs: REALTIME_SUBSCRIPTION_STALE_MS,
  });
  const backgroundSyncDelayRef = useRef(
    BACKGROUND_SYNC_INTERVAL_MS + Math.floor(Math.random() * BACKGROUND_SYNC_JITTER_MS),
  );

  useEffect(() => {
    channelsRef.current = channels;
  }, [channels]);

  const getChannelByNumber = useCallback(
    (channelNumber: number): Channel | undefined =>
      channelsRef.current.find((channel) => channel.number === channelNumber),
    [],
  );

  const updateSharedChannels = useCallback(
    (updater: (current: Channel[]) => Channel[]): void => {
      busMixChannelStore.updateChannels(consoleIp, busNumber, updater);
    },
    [busNumber, consoleIp],
  );

  const reconcileRemoteOn = useCallback(
    (channelNumber: number, remoteOn: boolean): void => {
      updateSharedChannels((current) =>
        applyLinkedOnUpdate(current, channelNumber, remoteOn, {
          linkMap: channelLinkMapRef.current,
        }),
      );
    },
    [updateSharedChannels],
  );

  const reconcileRemoteFader = useCallback(
    (channelNumber: number, remoteLevel: number): void => {
      const now = Date.now();

      updateSharedChannels((current) =>
        applyLinkedRemoteLevelUpdate(current, channelNumber, remoteLevel, {
          linkMap: channelLinkMapRef.current,
          localProtectionWindowMs: LOCAL_PROTECTION_WINDOW_MS,
          now,
          pendingLocalChangeAt: pendingLocalChangeAtRef.current,
        }),
      );
    },
    [updateSharedChannels],
  );

  const reconcileRemotePan = useCallback(
    (channelNumber: number, remotePan: number): void => {
      updateSharedChannels((current) => applyPanUpdate(current, channelNumber, remotePan));
    },
    [updateSharedChannels],
  );

  const markRealtimeEvent = useCallback((type: 'level' | 'on' | 'pan'): void => {
    const now = Date.now();
    const current = realtimeHealthRef.current;

    realtimeHealthRef.current = {
      ...current,
      lastEventAt: now,
      lastLevelOrOnEventAt:
        type === 'level' || type === 'on' ? now : current.lastLevelOrOnEventAt,
      lastPanEventAt: type === 'pan' ? now : current.lastPanEventAt,
      levelEventCount: current.levelEventCount + (type === 'level' ? 1 : 0),
      onEventCount: current.onEventCount + (type === 'on' ? 1 : 0),
      panEventCount: current.panEventCount + (type === 'pan' ? 1 : 0),
    };
  }, []);

  const getRealtimeSubscriptionHealth = useCallback((): BusMixRealtimeSubscriptionHealth & {
    isStale: boolean;
  } => {
    const current = realtimeHealthRef.current;
    const referenceTime = current.lastEventAt ?? current.subscribedAt;
    return {
      ...current,
      isStale: referenceTime ? Date.now() - referenceTime > current.staleAfterMs : false,
    };
  }, []);

  const buildPresetChannels = useCallback(
    (sourceChannels: Channel[]): BusMixPresetChannel[] =>
      sourceChannels.map((channel) => {
        const db = x32RawToDb(channel.localFaderRaw);
        return {
          channelId: channel.number,
          channelName: channel.name,
          channelLabel: channel.label,
          kind: channel.kind,
          sourceNumber: channel.sourceNumber,
          raw: channel.localFaderRaw,
          db: typeof db === 'number' ? db : null,
          mute: !channel.on,
        };
      }),
    [],
  );

  const loadPresets = useCallback(async (): Promise<void> => {
    setIsLoadingPresets(true);

    try {
      setPresets(await presetService.listPresets(consoleIp, busNumber));
    } finally {
      setIsLoadingPresets(false);
    }
  }, [busNumber, consoleIp, presetService]);

  const flushPendingFaders = useCallback((): void => {
    const pending = Array.from(pendingFadersRef.current.entries());
    pendingFadersRef.current.clear();
    faderFlushTimerRef.current = null;

    pending.forEach(([channelNumber, level]) => {
      const channel = getChannelByNumber(channelNumber);
      if (!channel) {
        return;
      }

      service.setChannelFader(channel, busNumber, level).catch((sendError) => {
        setError(getErrorMessage(sendError));
      });
    });
  }, [busNumber, getChannelByNumber, service]);

  const enqueueFaderSend = useCallback(
    (channel: number, level: number): void => {
      pendingFadersRef.current.set(channel, level);

      if (faderFlushTimerRef.current) {
        return;
      }

      faderFlushTimerRef.current = setTimeout(flushPendingFaders, FADER_SEND_INTERVAL_MS);
    },
    [flushPendingFaders],
  );

  const sendFaderImmediately = useCallback(
    (channelNumber: number, level: number): void => {
      pendingFadersRef.current.set(channelNumber, level);

      if (faderFlushTimerRef.current) {
        clearTimeout(faderFlushTimerRef.current);
        faderFlushTimerRef.current = null;
      }

      flushPendingFaders();
    },
    [flushPendingFaders],
  );

  const sendLevelOnly = useCallback(
    (channelNumber: number, level: number): void => {
      const now = Date.now();
      const linkedPeerNumber = getLinkedPeerNumber(channelNumber, channelLinkMapRef.current);
      pendingLocalChangeAtRef.current.set(channelNumber, now);
      if (linkedPeerNumber !== undefined) {
        pendingLocalChangeAtRef.current.set(linkedPeerNumber, now);
      }
      updateSharedChannels((current) =>
        applyLinkedLocalLevelUpdate(current, channelNumber, level, {
          linkMap: channelLinkMapRef.current,
          markDirty: true,
          now,
        }),
      );
      enqueueFaderSend(channelNumber, level);
    },
    [enqueueFaderSend, updateSharedChannels],
  );

  const syncRemoteFaders = useCallback(async (): Promise<void> => {
    if (channels.length === 0) {
      return;
    }

    try {
      const faders = await service.loadChannelFaders(busNumber, channelsRef.current);
      faders.forEach(({ channel, level }) => reconcileRemoteFader(channel.number, level));
    } catch {
      // Background UDP sync is best-effort; the active control path keeps reporting errors.
    }
  }, [busNumber, channels.length, reconcileRemoteFader, service]);

  const load = useCallback(
    async (refresh = false): Promise<void> => {
      refresh ? setIsRefreshing(true) : setIsLoading(true);
      setError(undefined);

      try {
        await service.connect(consoleIp);
        // Fetch link map first (cached after first call) to avoid competing with channel load.
        const linkMap = await service.fetchChannelLinkMap();
        if (refresh) {
          await channelStructureCache.invalidate(consoleIp);
        }
        const nextChannels = await busMixChannelStore.loadChannels(
          consoleIp,
          busNumber,
          () => service.loadChannelsWithCache(consoleIp, busNumber),
          { force: refresh },
        );
        channelLinkMapRef.current = linkMap;
        channelsRef.current = nextChannels;
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        refresh ? setIsRefreshing(false) : setIsLoading(false);
      }
    },
    [busNumber, consoleIp, service],
  );

  useEffect(
    () =>
      busMixChannelStore.subscribe(consoleIp, busNumber, (nextChannels) => {
        setChannels(nextChannels);
      }),
    [busNumber, consoleIp],
  );

  useEffect(() => {
    const pendingLocalChangeAt = pendingLocalChangeAtRef.current;
    load();
    return () => {
      if (faderFlushTimerRef.current) {
        clearTimeout(faderFlushTimerRef.current);
      }
      pendingLocalChangeAt.clear();
      service.disconnect();
    };
  }, [load, service]);

  useEffect(() => {
    loadPresets().catch((loadError) => {
      setError(getErrorMessage(loadError));
    });
  }, [loadPresets]);

  const channelSourcesKey = useMemo(
    () => channels.map((channel) => channel.id).join(','),
    [channels],
  );

  useEffect(() => {
    const currentChannels = [...channelsRef.current];
    realtimeHealthRef.current = {
      ...realtimeHealthRef.current,
      subscribedAt: Date.now(),
    };
    const unsubscribers = currentChannels.flatMap((channel) => [
      service.onLevel(channel, busNumber, (returnedLevel) => {
        markRealtimeEvent('level');
        reconcileRemoteFader(channel.number, returnedLevel);
      }),
      service.onOn(channel, busNumber, (returnedOn) => {
        markRealtimeEvent('on');
        reconcileRemoteOn(channel.number, returnedOn);
      }),
      service.onPan(channel, busNumber, (returnedPan) => {
        markRealtimeEvent('pan');
        reconcileRemotePan(channel.number, returnedPan);
      }),
    ]);

    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, [
    busNumber,
    channelSourcesKey,
    markRealtimeEvent,
    reconcileRemoteFader,
    reconcileRemoteOn,
    reconcileRemotePan,
    service,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      syncRemoteFaders().catch(() => undefined);
    }, backgroundSyncDelayRef.current);

    return () => clearInterval(timer);
  }, [syncRemoteFaders]);

  const applyCommittedLevel = useCallback(
    (channelNumber: number, level: number, markPendingChanges = true): void => {
      const now = Date.now();
      const linkedPeerNumber = getLinkedPeerNumber(channelNumber, channelLinkMapRef.current);
      pendingLocalChangeAtRef.current.delete(channelNumber);
      if (linkedPeerNumber !== undefined) {
        pendingLocalChangeAtRef.current.delete(linkedPeerNumber);
      }
      updateSharedChannels((current) =>
        applyLinkedLocalLevelUpdate(current, channelNumber, level, {
          linkMap: channelLinkMapRef.current,
          markDirty: markPendingChanges,
          now,
        }),
      );

      if (markPendingChanges) {
        setHasPendingChanges(true);
      }

      sendFaderImmediately(channelNumber, level);
    },
    [sendFaderImmediately, updateSharedChannels],
  );

  const setLevel = useCallback(
    (channelNumber: number, level: number): void => {
      applyCommittedLevel(channelNumber, level, true);
    },
    [applyCommittedLevel],
  );

  const applyCommittedOn = useCallback(
    async (channelNumber: number, nextOn: boolean, markPendingChanges = true): Promise<void> => {
      const channel = getChannelByNumber(channelNumber);
      if (!channel) {
        return;
      }

      updateSharedChannels((current) =>
        applyLinkedOnUpdate(current, channelNumber, nextOn, {
          linkMap: channelLinkMapRef.current,
        }),
      );

      if (markPendingChanges) {
        setHasPendingChanges(true);
      }

      try {
        await service.setChannelOn(channel, busNumber, nextOn);
      } catch (toggleError) {
        updateSharedChannels((current) =>
          applyLinkedOnUpdate(current, channelNumber, channel.on, {
            linkMap: channelLinkMapRef.current,
          }),
        );
        setError(getErrorMessage(toggleError));
        throw toggleError;
      }
    },
    [busNumber, getChannelByNumber, service, updateSharedChannels],
  );

  const toggleOn = useCallback(
    async (channelNumber: number): Promise<void> => {
      const channel = getChannelByNumber(channelNumber);
      if (!channel) {
        return;
      }

      await applyCommittedOn(channelNumber, !channel.on, true);
    },
    [applyCommittedOn, getChannelByNumber],
  );

  const setPan = useCallback(
    (channelNumber: number, pan: number): void => {
      const channel = getChannelByNumber(channelNumber);
      if (!channel) {
        return;
      }

      const nextPan = percentToX32Pan(pan);
      updateSharedChannels((current) => applyPanUpdate(current, channelNumber, nextPan));
      setHasPendingChanges(true);
      service.setChannelPan(channel, busNumber, nextPan).catch((sendError) => {
        setError(getErrorMessage(sendError));
      });
    },
    [busNumber, getChannelByNumber, service, updateSharedChannels],
  );

  const save = useCallback(async (): Promise<void> => {
    if (!hasPendingChanges || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      setHasPendingChanges(false);
    } finally {
      setIsSaving(false);
    }
  }, [hasPendingChanges, isSaving]);

  const createPreset = useCallback(
    async (name: string): Promise<BusMixPreset[]> => {
      const capturedChannels = buildPresetChannels(channelsRef.current);
      await presetService.savePreset(consoleIp, busNumber, name, capturedChannels);
      const nextPresets = await presetService.listPresets(consoleIp, busNumber);
      setPresets(nextPresets);
      return nextPresets;
    },
    [buildPresetChannels, busNumber, consoleIp, presetService],
  );

  const overwritePreset = useCallback(
    async (presetId: string): Promise<BusMixPreset[]> => {
      const capturedChannels = buildPresetChannels(channelsRef.current);
      await presetService.overwritePreset(consoleIp, busNumber, presetId, capturedChannels);
      const nextPresets = await presetService.listPresets(consoleIp, busNumber);
      setPresets(nextPresets);
      return nextPresets;
    },
    [buildPresetChannels, busNumber, consoleIp, presetService],
  );

  const deletePreset = useCallback(
    async (presetId: string): Promise<BusMixPreset[]> => {
      const nextPresets = await presetService.deletePreset(consoleIp, busNumber, presetId);
      setPresets(nextPresets);
      return nextPresets;
    },
    [busNumber, consoleIp, presetService],
  );

  const restorePreset = useCallback(
    async (presetId: string): Promise<void> => {
      setIsRestoringPreset(true);

      try {
        await waitForNextFrame();

        const preset = await presetService.loadPreset(consoleIp, busNumber, presetId);
        if (!preset) {
          throw new Error('Preset nao encontrado.');
        }

        const byChannel = new Map(channelsRef.current.map((channel) => [channel.number, channel]));
        const channelsToRestore = preset.channels.filter((presetChannel) =>
          byChannel.has(presetChannel.channelId),
        );

        channelsToRestore.forEach((presetChannel) => {
          applyCommittedLevel(presetChannel.channelId, presetChannel.raw, false);
        });

        await Promise.all(
          channelsToRestore
            .filter((presetChannel) => presetChannel.mute !== undefined)
            .map((presetChannel) =>
              applyCommittedOn(presetChannel.channelId, !presetChannel.mute!, false),
            ),
        );

        setHasPendingChanges(false);
        updateSharedChannels((current) =>
          current.map((channel) => ({
            ...channel,
            isDirty: false,
          })),
        );
      } finally {
        setIsRestoringPreset(false);
      }
    },
    [
      applyCommittedLevel,
      applyCommittedOn,
      busNumber,
      consoleIp,
      presetService,
      updateSharedChannels,
    ],
  );

  return {
    channels,
    error,
    isLoading,
    isRefreshing,
    hasPendingChanges,
    isSaving,
    presets,
    isLoadingPresets,
    isRestoringPreset,
    refresh: () => load(true),
    refreshPresets: async () => {
      await loadPresets();
      return presetService.listPresets(consoleIp, busNumber);
    },
    setLevel,
    sendLevelOnly,
    toggleOn,
    setPan,
    getPanPercent: (value: number) => x32PanToPercent(value),
    getRealtimeSubscriptionHealth,
    save,
    createPreset,
    overwritePreset,
    deletePreset,
    restorePreset,
  };
};
