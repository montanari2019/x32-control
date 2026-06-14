import { Buffer } from 'buffer';
import { NativeModules, Platform } from 'react-native';
import { AppError } from '@shared/errors/AppError';
import { i18next } from '@shared/i18n';
import { ensureLocalNetworkPermission } from './LocalNetworkPermission';
import { logUdpDiagnostic, toUdpAppError } from './UdpDiagnostics';

type UdpSocket = {
  _id?: number;
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

type UdpSocketsNativeModule = {
  setBroadcast?: (socketId: number, enabled: boolean, callback: (error?: unknown) => void) => void;
};

type BindOptions = {
  broadcast?: boolean;
};

export type UdpMessage = {
  data: Buffer;
  remoteAddress: string;
  remotePort: number;
};

export type UdpMessageHandler = (message: UdpMessage) => void;
export type UdpErrorHandler = (error: AppError) => void;

const SEND_TIMEOUT_MS = 5000;
const IOS_BROADCAST_DELAY_MS = 500;

export class UdpTransport {
  private socket?: UdpSocket;
  private messageHandlers = new Set<UdpMessageHandler>();
  private errorHandlers = new Set<UdpErrorHandler>();
  private boundPort = 0;
  private bindPromise?: Promise<void>;
  private broadcastConfigured = false;
  private isBound = false;
  private isClosing = false;

  async bind(localPort = 0, options: BindOptions = {}): Promise<void> {
    if (this.socket && this.isBound) {
      return;
    }

    if (this.bindPromise) {
      return this.bindPromise;
    }

    this.isClosing = false;
    this.boundPort = localPort;

    await ensureLocalNetworkPermission();

    const dgram = require('react-native-udp') as DgramModule;
    this.socket = dgram.createSocket({ type: 'udp4', reusePort: true });

    this.bindPromise = new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new AppError('UDP_TRANSPORT_ERROR', i18next.t('errors.udpSocketNotInitialized')));
        return;
      }

      this.socket.on('listening', () => {
        this.isBound = true;
        this.configureBroadcastOnce(options.broadcast).then(resolve).catch(reject);
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
        this.isBound = false;
        this.socket?.close();
        this.socket = undefined;
        logUdpDiagnostic({
          event: 'socket_error',
          nativeError: error,
        });
        const appError = toUdpAppError('UDP_TRANSPORT_ERROR', i18next.t('errors.udpTransport'), error);
        this.errorHandlers.forEach((handler) => handler(appError));
        reject(appError);
      });

      this.socket.bind(localPort);
    });

    try {
      await this.bindPromise;
    } finally {
      this.bindPromise = undefined;
    }
  }

  async send(data: Buffer, ip: string, port: number): Promise<void> {
    if (this.isClosing) {
      throw new AppError('CONNECTION_LOST', i18next.t('errors.udpTransportClosing'));
    }

    if (!this.socket || !this.isBound) {
      await this.bind(this.boundPort);
    }

    await this.sendNow(data, ip, port);
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
    if (this.isClosing) {
      return;
    }

    this.isClosing = true;
    this.isBound = false;
    this.bindPromise = undefined;
    this.broadcastConfigured = false;
    this.socket?.close();
    this.socket = undefined;
  }

  private async configureBroadcastOnce(enabled?: boolean): Promise<void> {
    const socket = this.socket;
    const setBroadcast = socket?.setBroadcast;

    if (!enabled || this.broadcastConfigured || !socket || !setBroadcast) {
      return;
    }

    this.broadcastConfigured = true;
    try {
      const socketId = socket._id;
      const nativeUdpSockets = NativeModules.UdpSockets as UdpSocketsNativeModule | undefined;
      const delayMs = Platform.OS === 'ios' ? IOS_BROADCAST_DELAY_MS : 0;

      if (delayMs > 0) {
        await new Promise<void>((resolve) => {
          setTimeout(resolve, delayMs);
        });
      }

      if (this.isClosing || socket !== this.socket) {
        return;
      }

      if (typeof socketId === 'number' && nativeUdpSockets?.setBroadcast) {
        await new Promise<void>((resolve, reject) => {
          nativeUdpSockets.setBroadcast?.(socketId, true, (error) => {
            if (error) {
              reject(error);
              return;
            }

            resolve();
          });
        });
        logUdpDiagnostic({
          event: 'broadcast_enabled',
          socketId,
          broadcast: true,
        });
        return;
      }

      setBroadcast.call(socket, true);
      logUdpDiagnostic({
        event: 'broadcast_enabled',
        socketId,
        broadcast: true,
      });
    } catch (error) {
      logUdpDiagnostic({
        event: 'broadcast_enable_error',
        broadcast: true,
        nativeError: error,
      });
      const appError = toUdpAppError(
        'UDP_TRANSPORT_ERROR',
        i18next.t('errors.udpBroadcastFailure'),
        error,
      );
      this.errorHandlers.forEach((handler) => handler(appError));
      throw appError;
    }
  }

  private async sendNow(data: Buffer, ip: string, port: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (!this.socket) {
        reject(new AppError('CONNECTION_LOST', i18next.t('errors.udpSocketNotInitialized')));
        return;
      }

      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        const appError = new AppError(
          'UDP_TIMEOUT',
          i18next.t('errors.udpSendTimeout', { endpoint: `${ip}:${port}` }),
        );
        logUdpDiagnostic({
          event: 'send_timeout',
          host: ip,
          port,
          timeoutMs: SEND_TIMEOUT_MS,
        });
        reject(appError);
      }, SEND_TIMEOUT_MS);

      this.socket.send(data, 0, data.length, port, ip, (error) => {
        if (settled) {
          return;
        }

        settled = true;
        clearTimeout(timeout);

        if (error) {
          logUdpDiagnostic({
            event: 'send_error',
            host: ip,
            port,
            nativeError: error,
          });
          reject(toUdpAppError('UDP_TRANSPORT_ERROR', i18next.t('errors.udpSendFailure'), error));
          return;
        }

        resolve();
      });
    });
  }
}
