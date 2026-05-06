import { useEffect } from 'react';
import { X32BusGroupsService } from '../services/X32BusGroupsService';
import { McaGroup } from '../types/busGroups.types';

type UseOscSubscriptionParams = {
  busId: number;
  mcas: McaGroup[];
  service: X32BusGroupsService;
  onDcaFader: (dcaNumber: number, value: number) => void;
  onDcaMute: (dcaNumber: number, isMuted: boolean) => void;
  onMasterFader: (value: number) => void;
  onMasterMute: (isMuted: boolean) => void;
};

export const useOscSubscription = ({
  busId,
  mcas,
  service,
  onDcaFader,
  onDcaMute,
  onMasterFader,
  onMasterMute,
}: UseOscSubscriptionParams): void => {
  useEffect(() => {
    if (mcas.length === 0) {
      return;
    }

    const unsubscribers = [
      ...mcas.flatMap((mca) => [
        service.subscribeToDcaFader(mca.dcaNumber, (value) => onDcaFader(mca.dcaNumber, value)),
        service.subscribeToDcaOn(mca.dcaNumber, (isMuted) => onDcaMute(mca.dcaNumber, isMuted)),
      ]),
      service.subscribeToBusMasterFader(busId, onMasterFader),
      service.subscribeToBusMasterOn(busId, onMasterMute),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [busId, mcas, onDcaFader, onDcaMute, onMasterFader, onMasterMute, service]);
};
