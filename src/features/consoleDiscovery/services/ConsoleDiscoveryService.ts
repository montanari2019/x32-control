import { NetworkScanner } from '@shared/network/NetworkScanner';
import { ConsoleDevice } from '../types/ConsoleDevice';

export class ConsoleDiscoveryService {
  constructor(private readonly scanner = new NetworkScanner()) {}

  scan(): Promise<ConsoleDevice[]> {
    return this.scanner.scanForConsoles();
  }

  validateManualIp(ip: string): Promise<ConsoleDevice> {
    return this.scanner.validateConsole(ip);
  }
}
