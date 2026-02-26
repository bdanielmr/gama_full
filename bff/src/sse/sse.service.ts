import { Injectable } from '@nestjs/common';

type SseClient = {
  id: string;
  write: (chunk: string) => void;
};

@Injectable()
export class SseService {
  private clients: SseClient[] = [];

  addClient(client: SseClient) {
    this.clients.push(client);
  }

  removeClient(id: string) {
    this.clients = this.clients.filter((client) => client.id !== id);
  }

  emit(data: any) {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    this.clients.forEach((client) => client.write(payload));
  }
}
