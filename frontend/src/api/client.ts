import type { RutaCasinoConfig } from '../configStore';
import type { ActionRequest, GameEventMessage, PatchMessage, WorldTemplate } from '../types';

type GameClientOptions = {
  config?: RutaCasinoConfig;
};

export type GameClient = {
  loadTemplate: () => Promise<WorldTemplate>;
  loadState: () => Promise<WorldTemplate>;
  sendAction: (request: ActionRequest) => Promise<any>;
  subscribeEvents: (onMessage: (message: PatchMessage | GameEventMessage | any) => void) => () => void;
};

function normalizeBaseUrl(config?: RutaCasinoConfig) {
  const resolved = config?.connection?.baseUrl;

  if (!resolved) {
    return '';
  }

  return resolved.replace(/\/$/, '');
}

function buildPath(
  config: RutaCasinoConfig | undefined,
  key: 'templatePath' | 'statePath' | 'actionPath' | 'eventsPath',
  fallback: string,
) {
  const raw = config?.connection?.[key] || fallback;
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function appendQuery(url: string, query?: Record<string, string | number | boolean | undefined>) {
  if (!query) {
    return url;
  }

  const output = new URL(url);
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    output.searchParams.set(key, String(value));
  });

  return output.toString();
}

function buildHeaders(config?: RutaCasinoConfig, includeContentType = false) {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  if (config?.auth?.bearerToken) {
    headers.Authorization = `Bearer ${config.auth.bearerToken}`;
  }

  if (config?.auth?.apiKey) {
    headers[config.auth.apiKeyHeader || 'x-api-key'] = config.auth.apiKey;
  }

  if (config?.auth?.subscriptionKey) {
    headers[config.auth.subscriptionKeyHeader || 'x-subscription-key'] = config.auth.subscriptionKey;
  }

  const session = config?.session || {};
  if (session.sessionId) headers['x-session-id'] = session.sessionId;
  if (session.userId) headers['x-user-id'] = session.userId;
  if (session.tenantId) headers['x-tenant-id'] = session.tenantId;
  if (session.deviceId) headers['x-device-id'] = session.deviceId;
  if (session.correlationId) headers['x-correlation-id'] = session.correlationId;
  if (session.traceId) headers['x-trace-id'] = session.traceId;

  Object.entries(config?.headers || {}).forEach(([key, value]) => {
    if (value) {
      headers[key] = value;
    }
  });

  Object.entries(config?.auth?.customHeaders || {}).forEach(([key, value]) => {
    if (value) {
      headers[key] = value;
    }
  });

  return headers;
}

export function createGameClient(options: GameClientOptions = {}): GameClient {
  const config = options.config;
  const baseUrl = normalizeBaseUrl(config);

  if (!baseUrl) {
    throw new Error('Falta connection.baseUrl en RutaCasinoConfig');
  }

  const url = (path: string) => appendQuery(`${baseUrl}${path}`, config?.connection?.query);

  const loadTemplate = async (): Promise<WorldTemplate> => {
    const response = await fetch(url(buildPath(config, 'templatePath', '/template')), {
      headers: buildHeaders(config),
      credentials: config?.connection?.credentials,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }

    return response.json();
  };

  const loadState = async (): Promise<WorldTemplate> => {
    const response = await fetch(url(buildPath(config, 'statePath', '/state')), {
      headers: buildHeaders(config),
      credentials: config?.connection?.credentials,
    });

    if (!response.ok) {
      throw new Error('Failed to fetch state');
    }

    return response.json();
  };

  const sendAction = async (request: ActionRequest) => {
    const response = await fetch(url(buildPath(config, 'actionPath', '/action')), {
      method: 'POST',
      headers: buildHeaders(config, true),
      credentials: config?.connection?.credentials,
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Action failed: ${text}`);
    }

    return response.json();
  };

  const subscribeEvents = (onMessage: (message: PatchMessage | GameEventMessage | any) => void) => {
    const eventPath = buildPath(config, 'eventsPath', '/events');
    let eventUrl = `${baseUrl}${eventPath}`;

    if (config?.connection?.includeContextInEventsQuery) {
      eventUrl = appendQuery(eventUrl, {
        ...(config.connection?.query || {}),
        ...(config.identifiers || {}),
        sessionId: config.session?.sessionId,
        userId: config.session?.userId,
        tenantId: config.session?.tenantId,
      });
    }

    const source = new EventSource(eventUrl, {
      withCredentials: config?.connection?.credentials === 'include',
    });

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    return () => source.close();
  };

  return {
    loadTemplate,
    loadState,
    sendAction,
    subscribeEvents,
  };
}
