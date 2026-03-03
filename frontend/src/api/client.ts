import type { ActionRequest, GameEventMessage, PatchMessage, WorldTemplate } from '../types';

type GameClientOptions = {
  baseUrl?: string;
};

function normalizeBaseUrl(value?: string) {
  return (value || 'http://localhost:3001').replace(/\/$/, '');
}

export class GameClient {
  private readonly baseUrl: string;

  constructor(options: GameClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl);
  }

  async loadTemplate(): Promise<WorldTemplate> {
    const response = await fetch(`${this.baseUrl}/template`);
    if (!response.ok) {
      throw new Error('Failed to fetch template');
    }
    return response.json();
  }

  async loadState(): Promise<WorldTemplate> {
    const response = await fetch(`${this.baseUrl}/state`);
    if (!response.ok) {
      throw new Error('Failed to fetch state');
    }
    return response.json();
  }

  async sendAction(request: ActionRequest) {
    const response = await fetch(`${this.baseUrl}/action`, {
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
    const source = new EventSource(`${this.baseUrl}/events`);

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
