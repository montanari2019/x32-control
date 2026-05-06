import { Buffer } from 'buffer';
import { AppError } from '@shared/errors/AppError';

type UdpSocket = {
  bind: (port: number) => void;
  close: () => void;
  send: (
    data: Buffer,
    offset: number,
    length: number,
    port: number,
    address: string,
    callback?: (error?: Error) => void,
  ) => void;
  on: (event: 'message' | 'error' | 'listening', listener: (...args: unknown[]) => void) => void;
  setBroadcast?: (enabled: boolean) => void;
};

type DgramModule = {
  createSocket: (options: { type: 'udp4'; reusePort: boolean }) => UdpSocket;
};

export type UdpMessage = {
  data: Buffer;
  remoteAddress: string;
  remotePort: number;
};

export type UdpMessageHandler = (message: UdpMessage) => void;
export type UdpErrorHandler = (error: AppError) => void;

export class UdpTransport {
  private socket?: UdpSocket;
  private messageHandlers = new Set<UdpMessageHandler>();
  private errorHandlers = new Set<UdpErrorHandler>();
  private boundPort = 0;

  async bind(localPort = 0): Promise<void> {
    if (this.socket) {
      return;
    }

    const dgram = require('react-native-udp') as DgramModule;
    this.socket = dgram.createSocket({ type: 'udp4', reusePort: true });
    this.boundPort = localPort;

    await new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new AppError('UDP_TRANSPORT_ERROR', 'Socket UDP não inicializado.'));
        return;
      }

      this.socket.on('listening', () => {
        this.socket?.setBroadcast?.(true);
        resolve();
      });

      this.socket.on('message', (payload: unknown, remote: unknown) => {
        const remoteInfo = remote as { address?: string; port?: number };
        this.messageHandlers.forEach((handler) =>
          handler({
            data: Buffer.from(payload as Uint8Array),
            remoteAddress: remoteInfo.address ?? '',
            remotePort: remoteInfo.port ?? 0,
          }),
        );
      });

      this.socket.on('error', (error) => {
        const appError = new AppError('UDP_TRANSPORT_ERROR', 'Erro no transporte UDP.', error);
        this.errorHandlers.forEach((handler) => handler(appError));
        reject(appError);
      });

      this.socket.bind(localPort);
    });
  }

  async send(data: Buffer, ip: string, port: number): Promise<void> {
    if (!this.socket) {
      await this.bind(this.boundPort);
    }

    await new Promise<void>((resolve, reject) => {
      this.socket?.send(data, 0, data.length, port, ip, (error) => {
        if (error) {
          reject(new AppError('UDP_TRANSPORT_ERROR', 'Falha ao enviar pacote UDP.', error));
          return;
        }

        resolve();
      });
    });
  }

  onMessage(handler: UdpMessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onError(handler: UdpErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  close(): void {
    this.socket?.close();
    this.socket = undefined;
  }
}
