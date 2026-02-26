import type { ActionRequest, GameEventMessage, PatchMessage, WorldTemplate } from '../types';

const BASE_URL = (import.meta.env.VITE_BFF_URL || 'http://localhost:3001').replace(/\/$/, '');

export class GameClient {
  async loadTemplate(): Promise<WorldTemplate> {
    const response = await fetch(`${BASE_URL}/template`);
    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }
    return response.json();
  }

  async loadState(): Promise<WorldTemplate> {
    const response = await fetch(`${BASE_URL}/state`);
    if (!response.ok) {
      throw new Error('Failed to fetch state');
    }
    return response.json();
  }

  async sendAction(request: ActionRequest) {
    const response = await fetch(`${BASE_URL}/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Action failed: ${text}`);
    }

    return response.json();
  }

  subscribeEvents(onMessage: (message: PatchMessage | GameEventMessage | any) => void) {
    const source = new EventSource(`${BASE_URL}/events`);

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        onMessage(parsed);
      } catch {
        // ignore malformed messages
      }
    };

    return () => source.close();
  }
}
