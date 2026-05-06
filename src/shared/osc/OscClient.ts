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

export class OscClient {
  private ip?: string;
  private port = X32Protocol.defaultPort;
  private keepAlive?: ReturnType<typeof setInterval>;
  private pending = new Set<PendingRequest<unknown>>();
  private subscriptions = new Map<string, Set<(message: OscMessage) => void>>();
  private unsubscribeTransport?: () => void;

  constructor(private readonly transport = new UdpTransport()) {}

  async connect(ip: string, port = X32Protocol.defaultPort): Promise<void> {
    if (!this.isValidIp(ip)) {
      throw new AppError('INVALID_IP', 'IP inválido. Use um endereço IPv4 da rede da mesa.');
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
    this.stopXRemoteKeepAlive();
    this.pending.forEach((request) => {
      clearTimeout(request.timeout);
      request.reject(new AppError('CONNECTION_LOST', 'Conexão encerrada.'));
    });
    this.pending.clear();
    this.unsubscribeTransport?.();
    this.transport.close();
    this.ip = undefined;
  }

  async send(address: string, args: OscArg[] = []): Promise<void> {
    if (!this.ip) {
      throw new AppError('CONNECTION_LOST', 'Cliente OSC não conectado.');
    }

    await this.transport.send(OscEncoder.encode({ address, args }), this.ip, this.port);
  }

  async request<T>(address: string, args: OscArg[] = [], timeoutMs = 1500): Promise<T> {
    await this.send(address, args);

    return new Promise<T>((resolve, reject) => {
      const pending: PendingRequest<T> = {
        address,
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.pending.delete(pending as PendingRequest<unknown>);
          reject(new AppError('UDP_TIMEOUT', `Timeout aguardando resposta de ${address}.`));
        }, timeoutMs),
      };

      this.pending.add(pending as PendingRequest<unknown>);
    });
  }

  startXRemoteKeepAlive(): void {
    this.stopXRemoteKeepAlive();
    this.send(X32Protocol.getXRemotePath()).catch(() => undefined);
    this.keepAlive = setInterval(() => {
      this.send(X32Protocol.getXRemotePath()).catch(() => undefined);
    }, 9000);
  }

  stopXRemoteKeepAlive(): void {
    if (this.keepAlive) {
      clearInterval(this.keepAlive);
      this.keepAlive = undefined;
    }
  }

  subscribe(address: string, listener: (message: OscMessage) => void): () => void {
    const listeners = this.subscriptions.get(address) ?? new Set<(message: OscMessage) => void>();
    listeners.add(listener);
    this.subscriptions.set(address, listeners);
    return () => listeners.delete(listener);
  }

  private handlePacket(data: Uint8Array): void {
    let message: OscMessage;

    try {
      message = OscDecoder.decode(data);
    } catch {
      return;
    }

    this.subscriptions.get(message.address)?.forEach((listener) => listener(message));

    const matchingRequest = [...this.pending].find(
      (request) => request.address === message.address,
    );
    if (!matchingRequest) {
      return;
    }

    clearTimeout(matchingRequest.timeout);
    this.pending.delete(matchingRequest);
    matchingRequest.resolve(message as unknown);
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
