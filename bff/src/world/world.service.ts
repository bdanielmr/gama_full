import { Injectable } from '@nestjs/common';
import { TemplateService } from '../template/template.service';

@Injectable()
export class WorldService {
  private worldState: any;

  constructor(private readonly templateService: TemplateService) {
    this.worldState = JSON.parse(JSON.stringify(this.templateService.getTemplate()));
  }

  getState() {
    return this.worldState;
  }

  resetState() {
    this.worldState = JSON.parse(JSON.stringify(this.templateService.getTemplate()));
    return this.worldState;
  }

  applyPatch(patch: any) {
    this.worldState = this.deepMerge(this.worldState, patch);
    return this.worldState;
  }

  private deepMerge(target: any, patch: any): any {
    if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
      return patch;
    }

    const output = { ...target };

    Object.keys(patch).forEach((key) => {
      const patchValue = patch[key];
      const targetValue = target ? target[key] : undefined;

      if (patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue)) {
        output[key] = this.deepMerge(targetValue || {}, patchValue);
      } else {
        output[key] = patchValue;
      }
    });

    return output;
  }
}
