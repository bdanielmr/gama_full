import { Controller, Get, Res } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SseService } from './sse.service';

@Controller('events')
export class SseController {
  constructor(private readonly sseService: SseService) {}

  @Get()
  subscribe(@Res() res: any) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const id = randomUUID();
    this.sseService.addClient({ id, write: (chunk) => res.write(chunk) });

    res.write(`data: ${JSON.stringify({ type: 'connected', id })}\n\n`);

    res.on('close', () => {
      this.sseService.removeClient(id);
      res.end();
    });
  }
}
