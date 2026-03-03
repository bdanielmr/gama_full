import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { RutaCasinoApp } from './lib-index';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ width: '100%', minHeight: 420, height: '70vh' }}>
    <RutaCasinoApp bffUrl={import.meta.env.VITE_BFF_URL} />
    </div>
  </React.StrictMode>,
);
