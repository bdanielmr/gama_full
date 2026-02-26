import { Module } from '@nestjs/common';
import { TemplateModule } from './template/template.module';
import { WorldModule } from './world/world.module';
import { ActionModule } from './action/action.module';
import { SseModule } from './sse/sse.module';

@Module({
  imports: [TemplateModule, WorldModule, ActionModule, SseModule],
})
export class AppModule {}
