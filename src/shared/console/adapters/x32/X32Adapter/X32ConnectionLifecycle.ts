import { acquireSharedOscClient } from '@shared/osc/SharedOscClient';
import { X32Protocol } from '@shared/osc/X32Protocol';
import { X32AdapterContext } from './X32AdapterContext';

export class X32ConnectionLifecycle {
  constructor(
    private readonly context: X32AdapterContext,
    private readonly clearMeterSubscriptions: () => void,
    private readonly resetNodeClient: () => void,
  ) {}

  async connect(): Promise<void> {
    const { context } = this;
    const port = context.endpoint.port ?? X32Protocol.defaultPort;
    if (context.sharedLease && context.connectedConsoleIp === context.endpoint.ip) {
      return;
    }

    context.sharedLease?.release();
    context.sharedLease = undefined;
    context.connectedConsoleIp = undefined;

    if (context.useSharedLease) {
      context.sharedLease = await acquireSharedOscClient(context.endpoint.ip, port);
      context.client = context.sharedLease.client;
    } else {
      await context.client.connect(context.endpoint.ip, port);
    }

    context.connectedConsoleIp = context.endpoint.ip;
  }

  disconnect(): void {
    const { context } = this;
    this.stopHeartbeat();
    this.clearMeterSubscriptions();
    context.sharedLease?.release();
    context.sharedLease = undefined;
    context.connectedConsoleIp = undefined;
    this.resetNodeClient();
    if (!context.useSharedLease) {
      context.client.disconnect();
    }
  }

  startHeartbeat(): void {
    this.context.client.startXRemoteKeepAlive();
  }

  stopHeartbeat(): void {
    this.context.client.stopXRemoteKeepAlive();
  }
}

