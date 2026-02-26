import { Controller, Get } from '@nestjs/common';
import { WorldService } from './world.service';

@Controller('state')
export class WorldController {
  constructor(private readonly worldService: WorldService) {}

  @Get()
  getState() {
    return this.worldService.getState();
  }
}
