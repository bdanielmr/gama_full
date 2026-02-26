import { Controller, Get, Query } from '@nestjs/common';
import { TemplateService } from './template.service';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get()
  getTemplate(@Query('worldId') worldId?: string) {
    return this.templateService.getTemplate(worldId || 'world_1');
  }
}
