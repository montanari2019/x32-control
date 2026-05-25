import { Buffer } from 'buffer';
import { AppError } from '@shared/errors/AppError';
import { UdpTransport } from '@shared/network/UdpTransport';
import { OscArg, OscMessage } from './OscMessage';
import { OscDecoder } from './OscDecoder';
import { OscEncoder } from './OscEncoder';
import { X32Protocol } from './X32Protocol';

type PendingRequest<T> = {
  address: string;
  resolve: (value: T) => void;
  reject: (error: AppError) => void;
  timeout: ReturnType<typeof setTimeout>;
};

type ScalarSubscriptionState = {
  refCount: number;
  renewTimer: ReturnType<typeof setInterval>;
  onSubscribeCallbacks: Set<() => void>;
  onRenewCallbacks: Set<() => void>;
};

export type OscScalarSubscriptionOptions = {
  address: string;
  timeFactor?: number;
  renewIntervalMs?: number;
  listener: (message: OscMessage) => void;
  onSubscribe?: () => void;
  onRenew?: () => void;
};

const XREMOTE_RENEW_INTERVAL_MS = 5000;

const pad4 = (length: number): number => (4 - (length % 4)) % 4;

const encodeAddressOnly = (address: string): Buffer => {
  const content = Buffer.from(`${address}\0`, 'utf8');
  return Buffer.concat([content, Buffer.alloc(pad4(content.length))]);
};

export class OscClient {
  private ip?: string;
  private port = X32Protocol.defaultPort;
  private keepAlive?: ReturnType<typeof setInterval>;
  private keepAliveRefCount = 0;
  private pending = new Set<PendingRequest<unknown>>();
  private pendingByAddress = new Map<string, Set<PendingRequest<unknown>>>();
  private subscriptions = new Map<string, Set<(message: OscMessage) => void>>();
  private scalarSubscriptions = new Map<string, ScalarSubscriptionState>();
  private unsubscribeTransport?: () => void;

  constructor(private readonly transport = new UdpTransport()) {}

  async connect(ip: string, port = X32Protocol.defaultPort): Promise<void> {
    if (!this.isValidIp(ip)) {
      throw new AppError('INVALID_IP', 'IP invalido. Use um endereco IPv4 da rede da mesa.');
    }

    this.ip = ip;
    this.port = port;
    await this.transport.bind();
    this.unsubscribeTransport?.();
    this.unsubscribeTransport = this.transport.onMessage((message) =>
      this.handlePacket(message.data),
    );
  }

  disconnect(): void {
    this.clearXRemoteKeepAlive();
    this.clearScalarSubscriptions();
    this.pending.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(new AppError('CONNECTION_LOST', 'Conexao encerrada.'));
    });
    this.pending.clear();
    this.pendingByAddress.clear();
    this.subscriptions.clear();
    this.unsubscribeTransport?.();
    this.transport.close();
    this.ip = undefined;
  }

  async send(address: string, args: OscArg[] = []): Promise<void> {
    if (!this.ip) {
      throw new AppError('CONNECTION_LOST', 'Cliente OSC nao conectado.');
    }

    await this.transport.send(OscEncoder.encode({ address, args }), this.ip, this.port);
  }

  async sendRaw(address: string): Promise<void> {
    if (!this.ip) {
      throw new AppError('CONNECTION_LOST', 'Cliente OSC nao conectado.');
    }

    await this.transport.send(encodeAddressOnly(address), this.ip, this.port);
  }

  async request<T>(address: string, args: OscArg[] = [], timeoutMs = 800): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      let isSettled = false;
      const pending: PendingRequest<T> = {
        address,
        resolve: (value) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          resolve(value);
        },
        reject: (error) => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          reject(error);
        },
        timeout: setTimeout(() => {
          if (isSettled) {
            return;
          }

          isSettled = true;
          this.removePendingRequest(pending as PendingRequest<unknown>);
          reject(new AppError('UDP_TIMEOUT', `Timeout aguardando resposta de ${address}.`));
        }, timeoutMs),
      };

      this.addPendingRequest(pending as PendingRequest<unknown>);

      this.send(address, args).catch((error) => {
        if (isSettled) {
          return;
        }

        clearTimeout(pending.timeout);
        this.removePendingRequest(pending as PendingRequest<unknown>);
        pending.reject(
          error instanceof AppError
            ? error
            : new AppError('UDP_TRANSPORT_ERROR', `Falha ao enviar request ${address}.`, error),
        );
      });
    });
  }

  startXRemoteKeepAlive(): void {
    this.keepAliveRefCount += 1;
    if (this.keepAlive) {
      return;
    }

    this.send(X32Protocol.getXRemotePath()).catch(() => undefined);
    this.keepAlive = setInterval(() => {
      this.send(X32Protocol.getXRemotePath()).catch(() => undefined);
    }, XREMOTE_RENEW_INTERVAL_MS);
  }

  stopXRemoteKeepAlive(): void {
    this.keepAliveRefCount = Math.max(0, this.keepAliveRefCount - 1);
    if (this.keepAliveRefCount > 0) {
      return;
    }

    this.clearXRemoteKeepAlive();
  }

  subscribe(address: string, listener: (message: OscMessage) => void): () => void {
    const listeners = this.subscriptions.get(address) ?? new Set<(message: OscMessage) => void>();
    listeners.add(listener);
    this.subscriptions.set(address, listeners);
    return () => listeners.delete(listener);
  }

  subscribeScalarValue({
    address,
    timeFactor = X32Protocol.defaultScalarSubscriptionTimeFactor,
    renewIntervalMs = X32Protocol.defaultScalarSubscriptionRenewIntervalMs,
    listener,
    onSubscribe,
    onRenew,
  }: OscScalarSubscriptionOptions): () => void {
    const unsubscribeLocal = this.subscribe(address, listener);
    let state = this.scalarSubscriptions.get(address);

    if (!state) {
      state = {
        refCount: 0,
        renewTimer: setInterval(() => {
          this.notifyCallbacks(state?.onRenewCallbacks);
          this.send(X32Protocol.getRenewPath(), [{ type: 's', value: address }]).catch(
            () => undefined,
          );
        }, renewIntervalMs),
        onSubscribeCallbacks: new Set(),
        onRenewCallbacks: new Set(),
      };
      this.scalarSubscriptions.set(address, state);
      this.notifyCallbacks(state.onSubscribeCallbacks);
      this.send(X32Protocol.getSubscribePath(), [
        { type: 's', value: address },
        { type: 'i', value: timeFactor },
      ]).catch(() => undefined);
    }

    state.refCount += 1;
    if (onSubscribe) {
      state.onSubscribeCallbacks.add(onSubscribe);
      onSubscribe();
    }
    if (onRenew) {
      state.onRenewCallbacks.add(onRenew);
    }

    let isUnsubscribed = false;
    return () => {
      if (isUnsubscribed) {
        return;
      }

      isUnsubscribed = true;
      unsubscribeLocal();
      if (onSubscribe) {
        state?.onSubscribeCallbacks.delete(onSubscribe);
      }
      if (onRenew) {
        state?.onRenewCallbacks.delete(onRenew);
      }

      const current = this.scalarSubscriptions.get(address);
      if (!current) {
        return;
      }

      current.refCount -= 1;
      if (current.refCount > 0) {
        return;
      }

      clearInterval(current.renewTimer);
      this.scalarSubscriptions.delete(address);
      this.send(X32Protocol.getUnsubscribePath(), [{ type: 's', value: address }]).catch(
        () => undefined,
      );
    };
  }

  private handlePacket(data: Uint8Array): void {
    let message: OscMessage;

    try {
      message = OscDecoder.decode(data);
    } catch {
      return;
    }

    this.subscriptions.get(message.address)?.forEach((listener) => listener(message));

    const byAddress = this.pendingByAddress.get(message.address);
    const matchingRequest = byAddress?.values().next().value as PendingRequest<unknown> | undefined;
    if (!matchingRequest) {
      return;
    }

    clearTimeout(matchingRequest.timeout);
    this.removePendingRequest(matchingRequest);
    matchingRequest.resolve(message as unknown);
  }

  private addPendingRequest(request: PendingRequest<unknown>): void {
    this.pending.add(request);
    const byAddress =
      this.pendingByAddress.get(request.address) ?? new Set<PendingRequest<unknown>>();
    byAddress.add(request);
    this.pendingByAddress.set(request.address, byAddress);
  }

  private removePendingRequest(request: PendingRequest<unknown>): void {
    this.pending.delete(request);
    const byAddress = this.pendingByAddress.get(request.address);
    if (!byAddress) {
      return;
    }

    byAddress.delete(request);
    if (byAddress.size === 0) {
      this.pendingByAddress.delete(request.address);
    }
  }

  private clearXRemoteKeepAlive(): void {
    this.keepAliveRefCount = 0;
    if (!this.keepAlive) {
      return;
    }

    clearInterval(this.keepAlive);
    this.keepAlive = undefined;
  }

  private clearScalarSubscriptions(): void {
    this.scalarSubscriptions.forEach((subscription) => {
      clearInterval(subscription.renewTimer);
    });
    this.scalarSubscriptions.clear();
  }

  private notifyCallbacks(callbacks?: Set<() => void>): void {
    callbacks?.forEach((callback) => callback());
  }

  private isValidIp(ip: string): boolean {
    const parts = ip.split('.');
    return (
      parts.length === 4 &&
      parts.every((part) => {
        const value = Number(part);
        return Number.isInteger(value) && value >= 0 && value <= 255 && part === String(value);
      })
    );
  }
}
