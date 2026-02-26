import { useEffect, useMemo, useState } from 'react';
import { GameClient } from './api/client';
import { applyPatch } from './engine/applyPatch';
import RenderEngine from './engine/renderEngine';
import type { GameEventMessage, PatchMessage, WorldTemplate } from './types';

export default function App() {
  const client = useMemo(() => new GameClient(), []);
  const [template, setTemplate] = useState<WorldTemplate | null>(null);
  const [worldState, setWorldState] = useState<WorldTemplate | null>(null);
  const [events, setEvents] = useState<GameEventMessage[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

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
        setEvents((prev) => [...prev.slice(-20), message as GameEventMessage]);
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
      <div className="app app-error">
        <p className="error">{error}</p>
      </div>
    );
  }

  if (!template || !worldState) {
    return (
      <div className="app app-error">
        <p>Cargando mundo...</p>
      </div>
    );
  }

  return (
    <div
      className="app"
      style={{
        backgroundImage: `linear-gradient(rgba(2,6,18,0.58), rgba(2,6,18,0.8)), url(${template.assets.background})`,
      }}
    >
      <RenderEngine worldState={worldState} onAction={onAction} runtimeEvents={events} />
    </div>
  );
}
