export type Primitive = string | number | boolean;

export type RutaCasinoConfig = {
  connection?: {
    baseUrl?: string;
    templatePath?: string;
    statePath?: string;
    actionPath?: string;
    eventsPath?: string;
    credentials?: RequestCredentials;
    query?: Record<string, Primitive | undefined>;
    includeContextInEventsQuery?: boolean;
  };

  auth?: {
    bearerToken?: string;
    apiKey?: string;
    apiKeyHeader?: string;
    subscriptionKey?: string;
    subscriptionKeyHeader?: string;
    customHeaders?: Record<string, string | undefined>;
  };

  session?: {
    sessionId?: string;
    userId?: string;
    tenantId?: string;
    deviceId?: string;
    correlationId?: string;
    traceId?: string;
  };

  identifiers?: Record<string, Primitive | undefined>;
  headers?: Record<string, string | undefined>;
};

type ConfigListener = (config: RutaCasinoConfig) => void;

let currentConfig: RutaCasinoConfig = {};
const listeners = new Set<ConfigListener>();

function isObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDeep<T extends Record<string, any>>(target: T, source: T): T {
  const result = { ...(target || {}) } as Record<string, any>;

  Object.keys(source || {}).forEach((key) => {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = mergeDeep(targetValue, sourceValue);
      return;
    }

    result[key] = sourceValue;
  });

  return result as T;
}

function snapshot() {
  return Object.freeze({ ...currentConfig });
}

export function getRutaCasinoConfig(): RutaCasinoConfig {
  return { ...currentConfig };
}

export function setRutaCasinoConfig(next: RutaCasinoConfig) {
  currentConfig = mergeDeep(currentConfig, next);

  const frozen = snapshot();
  listeners.forEach((listener) => listener(frozen));

  return frozen;
}

export function subscribeRutaCasinoConfig(listener: ConfigListener) {
  listeners.add(listener);
  listener(snapshot());

  return () => {
    listeners.delete(listener);
  };
}

export function resetRutaCasinoConfig() {
  currentConfig = {};
  const frozen = snapshot();
  listeners.forEach((listener) => listener(frozen));
  return frozen;
}

export const emitRutaCasinoConfig = setRutaCasinoConfig;
