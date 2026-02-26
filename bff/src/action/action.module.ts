import { Module } from '@nestjs/common';
import { ActionController } from './action.controller';
import { ActionService } from './action.service';
import { WorldModule } from '../world/world.module';
import { SseModule } from '../sse/sse.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [WorldModule, SseModule, TemplateModule],
  controllers: [ActionController],
  providers: [ActionService],
})
export class ActionModule {}
