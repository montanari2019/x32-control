declare module 'react-native-udp' {
  import { Buffer } from 'buffer';

  type RemoteInfo = {
    address: string;
    port: number;
  };

  type UdpSocket = {
    bind(port: number): void;
    close(): void;
    send(
      data: Buffer,
      offset: number,
      length: number,
      port: number,
      address: string,
      callback?: (error?: Error) => void,
    ): void;
    on(event: 'message', listener: (message: Buffer, remote: RemoteInfo) => void): void;
    on(event: 'error', listener: (error: Error) => void): void;
    on(event: 'listening', listener: () => void): void;
    setBroadcast(enabled: boolean): void;
  };

  export function createSocket(options: { type: 'udp4'; reusePort?: boolean }): UdpSocket;
}
