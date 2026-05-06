import { secureStore } from '@shared/storage';
import { McaGroup } from '../types/busGroups.types';

type StoredDcaGroup = Pick<
  McaGroup,
  'assignedChannelIds' | 'colorToken' | 'dcaNumber' | 'isMuted' | 'name'
> & {
  faderRawValue: number;
};

type StoredDcaPayload = {
  consoleId: string;
  savedAt: string;
  mcas: StoredDcaGroup[];
};

const DCA_STATE_KEY = 'dca-state';

const toStoredDcaGroup = (mca: McaGroup): StoredDcaGroup => ({
  assignedChannelIds: [...mca.assignedChannelIds],
  colorToken: mca.colorToken,
  dcaNumber: mca.dcaNumber,
  faderRawValue: mca.faderRawValue,
  isMuted: mca.isMuted,
  name: mca.name,
});

export class BusGroupsSecureStoreService {
  async saveDcaState(consoleId: string, mcas: McaGroup[]): Promise<void> {
    const consoleStore = secureStore.createScope(
      secureStore.buildScopedKey('console', consoleId, 'bus-groups'),
    );

    await consoleStore.setObject<StoredDcaPayload>(DCA_STATE_KEY, {
      consoleId,
      savedAt: new Date().toISOString(),
      mcas: mcas.map(toStoredDcaGroup),
    });
  }

  async getDcaState(consoleId: string): Promise<StoredDcaPayload | null> {
    const consoleStore = secureStore.createScope(
      secureStore.buildScopedKey('console', consoleId, 'bus-groups'),
    );

    return consoleStore.getObject<StoredDcaPayload>(DCA_STATE_KEY);
  }

  async clearDcaState(consoleId: string): Promise<void> {
    const consoleStore = secureStore.createScope(
      secureStore.buildScopedKey('console', consoleId, 'bus-groups'),
    );

    await consoleStore.removeItem(DCA_STATE_KEY);
  }
}
