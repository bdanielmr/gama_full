import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { RutaCasinoApp, resetRutaCasinoConfig, setRutaCasinoConfig } from './lib-index';

setRutaCasinoConfig({
  connection: {
    baseUrl: import.meta.env.VITE_BFF_URL,
  },
  auth: {
    bearerToken: import.meta.env.VITE_BEARER_TOKEN,
  },
});

type HostMessage =
  | {
      source?: string;
      type?: 'config:set';
      payload?: Parameters<typeof setRutaCasinoConfig>[0];
    }
  | {
      source?: string;
      type?: 'config:reset';
    };

const allowedOriginsEnv = import.meta.env.VITE_IFRAME_ALLOWED_ORIGINS?.trim();
const allowAllOrigins = !allowedOriginsEnv || allowedOriginsEnv === '*';
const allowedOrigins = new Set(
  (allowedOriginsEnv || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

function canAcceptOrigin(origin: string) {
  return allowAllOrigins || allowedOrigins.has(origin);
}

function postToParent(message: Record<string, unknown>, targetOrigin: string) {
  if (window.parent === window) {
    return;
  }

  window.parent.postMessage(message, targetOrigin);
}

window.addEventListener('message', (event: MessageEvent<HostMessage>) => {
  if (!canAcceptOrigin(event.origin)) {
    return;
  }

  const message = event.data;
  if (!message || message.source !== 'host') {
    return;
  }

  if (message.type === 'config:set' && message.payload) {
    const current = setRutaCasinoConfig(message.payload);
    postToParent(
      {
        source: 'gama',
        type: 'config:applied',
        payload: current,
      },
      event.origin,
    );
    return;
  }

  if (message.type === 'config:reset') {
    const current = resetRutaCasinoConfig();
    postToParent(
      {
        source: 'gama',
        type: 'config:reset:done',
        payload: current,
      },
      event.origin,
    );
  }
});

postToParent(
  {
    source: 'gama',
    type: 'ready',
    payload: {
      allowAllOrigins,
      allowedOrigins: [...allowedOrigins],
    },
  },
  '*',
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ width: '100%', minHeight: 420, height: '90vh' }}>
      <RutaCasinoApp />
    </div>
  </React.StrictMode>,
);
