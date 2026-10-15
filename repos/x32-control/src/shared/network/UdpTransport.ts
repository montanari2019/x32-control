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

type UdpSocketSetBroadcast = NonNullable<UdpSocket['setBroadcast']>;

export type UdpMessage = {
  data: Buffer;
  remoteAddress: string;
  remotePort: number;
};

export type UdpMessageHandler = (message: UdpMessage) => void;
export type UdpErrorHandler = (error: AppError) => void;

const SEND_TIMEOUT_MS = 5000;
const ANDROID_BROADCAST_CONFIRM_TIMEOUT_MS = 250;
const ANDROID_BROADCAST_FALLBACK_SETTLE_MS = 50;
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
    logUdpDiagnostic({
      event: 'bind_start',
      port: localPort,
      broadcast: options.broadcast,
    });

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
        logUdpDiagnostic({
          event: 'bind_listening',
          socketId: this.socket?._id,
          port: localPort,
          broadcast: options.broadcast,
        });
        this.configureBroadcastOnce(options.broadcast)
          .then(() => {
            logUdpDiagnostic({
              event: 'bind_ready',
              socketId: this.socket?._id,
              port: localPort,
              broadcast: options.broadcast,
            });
            resolve();
          })
          .catch(reject);
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
      logUdpDiagnostic({
        event: 'broadcast_enable_start',
        socketId,
        broadcast: true,
      });

      if (delayMs > 0) {
        await this.delay(delayMs);
      }

      if (this.isClosing || socket !== this.socket) {
        return;
      }

      if (Platform.OS === 'android') {
        await this.configureAndroidBroadcast(socket, setBroadcast, socketId, nativeUdpSockets);
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
      this.broadcastConfigured = false;
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

  private async configureAndroidBroadcast(
    socket: UdpSocket,
    setBroadcast: UdpSocketSetBroadcast,
    socketId: number | undefined,
    nativeUdpSockets: UdpSocketsNativeModule | undefined,
  ): Promise<void> {
    const requestAsyncFallback = async (event: string, context?: { nativeError?: unknown; timeoutMs?: number }) => {
      logUdpDiagnostic({
        event,
        socketId,
        broadcast: true,
        nativeError: context?.nativeError,
        timeoutMs: context?.timeoutMs,
      });

      try {
        setBroadcast.call(socket, true);
        logUdpDiagnostic({
          event: 'broadcast_enable_async_requested',
          socketId,
          broadcast: true,
        });
      } catch (fallbackError) {
        logUdpDiagnostic({
          event: 'broadcast_enable_async_error',
          socketId,
          broadcast: true,
          nativeError: fallbackError,
        });
      }

      await this.delay(ANDROID_BROADCAST_FALLBACK_SETTLE_MS);
    };

    if (typeof socketId !== 'number' || !nativeUdpSockets?.setBroadcast) {
      await requestAsyncFallback('broadcast_enable_native_unavailable');
      return;
    }

    const nativeAttempt = new Promise<void>((resolve, reject) => {
      nativeUdpSockets.setBroadcast?.(socketId, true, (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });

    try {
      const result = await Promise.race([
        nativeAttempt.then(() => 'success' as const),
        this.delay(ANDROID_BROADCAST_CONFIRM_TIMEOUT_MS).then(() => 'timeout' as const),
      ]);

      if (result === 'success') {
        logUdpDiagnostic({
          event: 'broadcast_enabled',
          socketId,
          broadcast: true,
        });
        return;
      }
    } catch (error) {
      await requestAsyncFallback('broadcast_enable_fallback_after_error', {
        nativeError: error,
      });
      return;
    }

    logUdpDiagnostic({
      event: 'broadcast_enable_timeout',
      socketId,
      broadcast: true,
      timeoutMs: ANDROID_BROADCAST_CONFIRM_TIMEOUT_MS,
    });

    void nativeAttempt
      .then(() => {
        logUdpDiagnostic({
          event: 'broadcast_enable_late_success',
          socketId,
          broadcast: true,
        });
      })
      .catch((error) => {
        logUdpDiagnostic({
          event: 'broadcast_enable_late_error',
          socketId,
          broadcast: true,
          nativeError: error,
        });
      });

    await requestAsyncFallback('broadcast_enable_fallback_after_timeout', {
      timeoutMs: ANDROID_BROADCAST_CONFIRM_TIMEOUT_MS,
    });
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

  private async delay(delayMs: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, delayMs);
    });
  }
}
