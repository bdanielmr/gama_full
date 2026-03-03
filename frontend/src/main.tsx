import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles.css';
import { RutaCasinoApp, emitRutaCasinoConfig } from './lib-index';

emitRutaCasinoConfig({ bffUrl: import.meta.env.VITE_BFF_URL });

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ width: '100%', minHeight: 420, height: '70vh' }}>
      <RutaCasinoApp />
    </div>
  </React.StrictMode>,
);
