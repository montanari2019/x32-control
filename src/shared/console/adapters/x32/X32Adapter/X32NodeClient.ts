import { AppError } from '@shared/errors/AppError';
import { i18next } from '@shared/i18n';
import type { OscMessage } from '@shared/osc/OscMessage';
import {
  normalizeNodePath,
  oscArgToNodeValue,
  parseNodeResponseValues,
} from './x32OscValueUtils';
import { REQUEST_RETRIES, REQUEST_TIMEOUT_MS } from './X32AdapterConstants';
import { X32AdapterContext } from './X32AdapterContext';

type NodeResponseMode = 'echo' | 'noEcho';

export class X32NodeClient {
  private nodeRequestChain: Promise<void> = Promise.resolve();
  private nodeResponseMode?: NodeResponseMode;
  private nodeResponseModePromise?: Promise<NodeResponseMode>;

  constructor(private readonly context: X32AdapterContext) {}

  reset(): void {
    this.nodeResponseMode = undefined;
    this.nodeResponseModePromise = undefined;
    this.nodeRequestChain = Promise.resolve();
  }

  async requestMessage(
    path: string,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retries = REQUEST_RETRIES,
  ): Promise<OscMessage> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.context.client.request<OscMessage>(path, [], timeoutMs);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new AppError('UDP_TIMEOUT', i18next.t('errors.oscResponseTimeout', { address: path }));
  }

  async requestNodeValues(
    nodePath: string,
    timeoutMs = REQUEST_TIMEOUT_MS,
    retries = REQUEST_RETRIES,
  ): Promise<string[]> {
    const responseMode = await this.getNodeResponseMode(timeoutMs);
    if (responseMode === 'echo') {
      return this.requestNodeValuesByEcho(nodePath, timeoutMs, retries);
    }

    const request = (): Promise<string[]> =>
      this.requestNodeValuesDirect(nodePath, timeoutMs, retries);
    const nextRequest = this.nodeRequestChain.then(request, request);
    this.nodeRequestChain = nextRequest.then(
      () => undefined,
      () => undefined,
    );
    return nextRequest;
  }

  private async getNodeResponseMode(timeoutMs: number): Promise<NodeResponseMode> {
    if (this.nodeResponseMode) {
      return this.nodeResponseMode;
    }

    if (!this.nodeResponseModePromise) {
      this.nodeResponseModePromise = this.detectNodeResponseMode(timeoutMs).then(
        (mode) => {
          this.nodeResponseMode = mode;
          this.nodeResponseModePromise = undefined;
          return mode;
        },
        (error) => {
          this.nodeResponseModePromise = undefined;
          throw error;
        },
      );
    }

    return this.nodeResponseModePromise;
  }

  private async detectNodeResponseMode(timeoutMs: number): Promise<NodeResponseMode> {
    const probePath = 'ch/01/config';
    const message = await this.context.client.request<OscMessage>('/node', [probePath], timeoutMs);
    const firstValue = oscArgToNodeValue(message.args[0]);
    return firstValue !== undefined &&
      normalizeNodePath(firstValue) === probePath &&
      message.args.length > 1
      ? 'echo'
      : 'noEcho';
  }

  private async requestNodeValuesByEcho(
    nodePath: string,
    timeoutMs: number,
    retries: number,
  ): Promise<string[]> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await new Promise<string[]>((resolve, reject) => {
          let isSettled = false;
          let timeout: ReturnType<typeof setTimeout> | undefined;
          let unsubscribe = (): void => undefined;
          const cleanup = (): void => {
            if (timeout) {
              clearTimeout(timeout);
            }
            unsubscribe();
          };
          const settleResolve = (values: string[]): void => {
            if (isSettled) {
              return;
            }
            isSettled = true;
            cleanup();
            resolve(values);
          };
          const settleReject = (error: unknown): void => {
            if (isSettled) {
              return;
            }
            isSettled = true;
            cleanup();
            reject(error);
          };

          timeout = setTimeout(() => {
            settleReject(new Error(`/node timeout for ${nodePath}`));
          }, timeoutMs);

          unsubscribe = this.context.client.subscribe('/node', (message) => {
            const firstValue = oscArgToNodeValue(message.args[0]);
            if (
              firstValue === undefined ||
              normalizeNodePath(firstValue) !== normalizeNodePath(nodePath)
            ) {
              return;
            }

            const values = parseNodeResponseValues(message, nodePath);
            if (values.length === 0) {
              settleReject(new Error(`Empty /node response for ${nodePath}`));
              return;
            }

            settleResolve(values);
          });

          this.context.client.send('/node', [nodePath]).catch(settleReject);
        });
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`/node failed for ${nodePath}`);
  }

  private async requestNodeValuesDirect(
    nodePath: string,
    timeoutMs: number,
    retries: number,
  ): Promise<string[]> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const message = await this.context.client.request<OscMessage>('/node', [nodePath], timeoutMs);
        const values = parseNodeResponseValues(message, nodePath);
        if (values.length === 0) {
          throw new Error(`Empty /node response for ${nodePath}`);
        }
        return values;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error ? lastError : new Error(`/node failed for ${nodePath}`);
  }
}

