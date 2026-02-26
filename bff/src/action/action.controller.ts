import { Body, Controller, Post } from '@nestjs/common';
import { ActionService } from './action.service';

@Controller('action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Post()
  handleAction(@Body() body: { action: string; payload?: any }) {
    return this.actionService.handleAction(body.action, body.payload || {});
  }
}
