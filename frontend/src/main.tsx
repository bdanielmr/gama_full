import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { RutaCasinoApp, setRutaCasinoConfig } from './lib-index';

setRutaCasinoConfig({
  connection: {
    baseUrl: import.meta.env.VITE_BFF_URL,
  },
  auth: {
    bearerToken: import.meta.env.VITE_BEARER_TOKEN,
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ width: '100%', minHeight: 420, height: '70vh' }}>
      <RutaCasinoApp />
    </div>
  </React.StrictMode>,
);
