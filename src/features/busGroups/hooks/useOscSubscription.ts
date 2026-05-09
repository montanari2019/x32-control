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
  const mcaNumbersKey = mcas.map((mca) => mca.dcaNumber).join(',');

  useEffect(() => {
    if (mcas.length === 0) {
      return;
    }

    const dcaNumbers = mcas.map((mca) => mca.dcaNumber);
    const unsubscribers = [
      ...dcaNumbers.flatMap((dcaNumber) => [
        service.subscribeToDcaFader(dcaNumber, (value) => onDcaFader(dcaNumber, value)),
        service.subscribeToDcaOn(dcaNumber, (isMuted) => onDcaMute(dcaNumber, isMuted)),
      ]),
      service.subscribeToBusMasterFader(busId, onMasterFader),
      service.subscribeToBusMasterOn(busId, onMasterMute),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [busId, mcaNumbersKey, onDcaFader, onDcaMute, onMasterFader, onMasterMute, service]);
};
