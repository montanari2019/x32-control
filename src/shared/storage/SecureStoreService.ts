import AsyncStorage from '@react-native-async-storage/async-storage';

type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

type SecureStoreServiceOptions = {
  namespace?: string;
};

const normalizeScopeSegment = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

export class SecureStoreService {
  private readonly namespace: string;

  constructor(options: SecureStoreServiceOptions = {}) {
    this.namespace = options.namespace ?? 'x32-control';
  }

  async getItem(key: string): Promise<string | null> {
    return AsyncStorage.getItem(this.getScopedKey(key));
  }

  async setItem(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(this.getScopedKey(key), value);
  }

  async getObject<T extends JsonValue>(key: string): Promise<T | null> {
    const rawValue = await this.getItem(key);
    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue) as T;
  }

  async setObject<T extends JsonValue>(key: string, value: T): Promise<void> {
    await this.setItem(key, JSON.stringify(value));
  }

  async hasItem(key: string): Promise<boolean> {
    const value = await this.getItem(key);
    return value !== null;
  }

  async removeItem(key: string): Promise<void> {
    await AsyncStorage.removeItem(this.getScopedKey(key));
  }

  async clearNamespace(): Promise<void> {
    const keys = await AsyncStorage.getAllKeys();
    const scopedKeys = keys.filter((key) => key.startsWith(`${this.namespace}:`));

    if (scopedKeys.length === 0) {
      return;
    }

    await Promise.all(scopedKeys.map((key) => AsyncStorage.removeItem(key)));
  }

  createScope(scope: string): SecureStoreService {
    const normalizedScope = normalizeScopeSegment(scope);
    if (!normalizedScope) {
      throw new Error('scope precisa conter pelo menos um caractere valido.');
    }

    return new SecureStoreService({
      namespace: `${this.namespace}:${normalizedScope}`,
    });
  }

  buildScopedKey(...segments: string[]): string {
    const normalizedSegments = segments
      .map((segment) => normalizeScopeSegment(segment))
      .filter(Boolean);

    if (normalizedSegments.length === 0) {
      throw new Error('E necessario informar ao menos um segmento para a chave.');
    }

    return normalizedSegments.join(':');
  }

  private getScopedKey(key: string): string {
    return `${this.namespace}:${key}`;
  }
}

export const secureStore = new SecureStoreService();
