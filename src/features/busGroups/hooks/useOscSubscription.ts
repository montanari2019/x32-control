import { useEffect } from 'react';
import { BusGroupsService } from '../services/BusGroupsService';

type UseOscSubscriptionParams = {
  busId: number;
  service: BusGroupsService;
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
