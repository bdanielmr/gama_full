import { useEffect, useMemo, useState } from 'react';
import { createGameClient } from './api/client';
import { getRutaCasinoConfig, subscribeRutaCasinoConfig, type RutaCasinoConfig } from './configStore';
import { applyPatch } from './engine/applyPatch';
import RenderEngine from './engine/renderEngine';
import type { GameEventMessage, PatchMessage, WorldTemplate } from './types';

function stableKey(value: unknown) {
  try {
    return JSON.stringify(value || {});
  } catch {
    return String(Date.now());
  }
}

export default function App() {
  const [config, setConfig] = useState<RutaCasinoConfig>(() => getRutaCasinoConfig());
  const configKey = useMemo(() => stableKey(config), [config]);
  const client = useMemo(() => createGameClient({ config }), [configKey]);

  const [template, setTemplate] = useState<WorldTemplate | null>(null);
  const [worldState, setWorldState] = useState<WorldTemplate | null>(null);
  const [events, setEvents] = useState<GameEventMessage[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    const unsubscribe = subscribeRutaCasinoConfig((nextConfig) => {
      setConfig((prev) => {
        const prevKey = stableKey(prev);
        const nextKey = stableKey(nextConfig);
        return prevKey === nextKey ? prev : nextConfig;
      });
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    let mounted = true;
    setError('');
    setTemplate(null);
    setWorldState(null);
    setEvents([]);

    async function bootstrap() {
      try {
        const [templateData, stateData] = await Promise.all([client.loadTemplate(), client.loadState()]);
        if (!mounted) {
          return;
        }
        setTemplate(templateData);
        setWorldState(stateData);
      } catch (err: any) {
        setError(err?.message || 'Fallo de inicializacion');
      }
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, [client]);

  useEffect(() => {
    if (!worldState) {
      return;
    }

    const disconnect = client.subscribeEvents((message) => {
      if (message?.type === 'patch') {
        const patchMessage = message as PatchMessage;
        setWorldState((prev) => (prev ? applyPatch(prev, patchMessage.patch) : prev));
      }

      if (message?.type === 'event') {
        setEvents((prev) => [...prev, message as GameEventMessage]);
      }
    });

    return disconnect;
  }, [client, worldState?.player?.id]);

  const onAction = async (action: string, payload?: any) => {
    try {
      const response = await client.sendAction({ action, payload });
      if (response?.patch) {
        setWorldState((prev: any) => (prev ? applyPatch(prev, response.patch) : prev));
      }
    } catch (err: any) {
      setError(err?.message || 'Accion rechazada');
    }
  };

  if (error) {
    return (
      <div className="rcg-app rcg-app-error">
        <p className="rcg-error">{error}</p>
      </div>
    );
  }

  if (!template || !worldState) {
    return (
      <div className="rcg-app rcg-app-error">
        <p>Cargando mundo...</p>
      </div>
    );
  }

  const isLevelTwoOrMore = Number(worldState.player?.nivel || 1) >= 2;
  const overlayGradient = isLevelTwoOrMore
    ? 'linear-gradient(rgba(8, 34, 23, 0.62), rgba(8, 34, 23, 0.82))'
    : 'linear-gradient(rgba(2,6,18,0.58), rgba(2,6,18,0.8))';

  return (
    <div
      className="rcg-app"
      style={{
        width: '100%',
        minHeight: '420px',
        height: '100%',
        backgroundImage: `${overlayGradient}, url(${template.assets.background})`,
      }}
    >
      <RenderEngine worldState={worldState} onAction={onAction} runtimeEvents={events} />
    </div>
  );
}
