export const RUTA_CASINO_CONFIG_EVENT = 'ruta-casino:config';

export type RutaCasinoConfig = {
  bffUrl?: string;
};

declare global {
  interface Window {
    __RUTA_CASINO_CONFIG__?: RutaCasinoConfig;
  }
}

export function getRutaCasinoConfig(): RutaCasinoConfig {
  if (typeof window === 'undefined') {
    return {};
  }
  return window.__RUTA_CASINO_CONFIG__ || {};
}

export function emitRutaCasinoConfig(config: RutaCasinoConfig) {
  if (typeof window === 'undefined') {
    return;
  }

  const nextConfig = {
    ...(window.__RUTA_CASINO_CONFIG__ || {}),
    ...config,
  };

  window.__RUTA_CASINO_CONFIG__ = nextConfig;
  window.dispatchEvent(
    new CustomEvent<RutaCasinoConfig>(RUTA_CASINO_CONFIG_EVENT, {
      detail: nextConfig,
    }),
  );
}

export function subscribeRutaCasinoConfig(listener: (config: RutaCasinoConfig) => void) {
  if (typeof window === 'undefined') {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<RutaCasinoConfig>;
    listener(customEvent.detail || {});
  };

  window.addEventListener(RUTA_CASINO_CONFIG_EVENT, handler as EventListener);
  return () => window.removeEventListener(RUTA_CASINO_CONFIG_EVENT, handler as EventListener);
}
