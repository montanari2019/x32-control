import { getMockConsoleDevice } from '@shared/mixer/mock/mockMixerProvider';
import { NetworkScanner } from '@shared/network/NetworkScanner';
import { ConsoleDevice } from '../types/ConsoleDevice';

export class ConsoleDiscoveryService {
  constructor(private readonly scanner = new NetworkScanner()) {}

  async scan(): Promise<ConsoleDevice[]> {
    if (!__DEV__) {
      return this.scanner.scanForConsoles();
    }

    try {
      const found = await this.scanner.scanForConsoles();
      const mock = getMockConsoleDevice();
      const hasMock = found.some((device) => device.ip === mock.ip);

      return hasMock ? found : [...found, mock];
    } catch {
      return [getMockConsoleDevice()];
    }
  }

  validateManualIp(ip: string): Promise<ConsoleDevice> {
    return this.scanner.validateConsole(ip);
  }
}
