import { useEffect } from 'react';
import { X32BusGroupsService } from '../services/X32BusGroupsService';

type UseOscSubscriptionParams = {
  busId: number;
  service: X32BusGroupsService;
  onMasterFader: (value: number) => void;
  onMasterMute: (isMuted: boolean) => void;
};

export const useOscSubscription = ({
  busId,
  service,
  onMasterFader,
  onMasterMute,
}: UseOscSubscriptionParams): void => {
  useEffect(() => {
    const unsubscribers = [
      service.subscribeToBusMasterFader(busId, onMasterFader),
      service.subscribeToBusMasterOn(busId, onMasterMute),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [busId, onMasterFader, onMasterMute, service]);
};
