"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldService = void 0;
const common_1 = require("@nestjs/common");
const template_service_1 = require("../template/template.service");
let WorldService = class WorldService {
    constructor(templateService) {
        this.templateService = templateService;
        this.worldState = JSON.parse(JSON.stringify(this.templateService.getTemplate()));
    }
    getState() {
        return this.worldState;
    }
    resetState() {
        this.worldState = JSON.parse(JSON.stringify(this.templateService.getTemplate()));
        return this.worldState;
    }
    applyPatch(patch) {
        this.worldState = this.deepMerge(this.worldState, patch);
        return this.worldState;
    }
    deepMerge(target, patch) {
        if (patch === null || typeof patch !== 'object' || Array.isArray(patch)) {
            return patch;
        }
        const output = { ...target };
        Object.keys(patch).forEach((key) => {
            const patchValue = patch[key];
            const targetValue = target ? target[key] : undefined;
            if (patchValue && typeof patchValue === 'object' && !Array.isArray(patchValue)) {
                output[key] = this.deepMerge(targetValue || {}, patchValue);
            }
            else {
                output[key] = patchValue;
            }
        });
        return output;
    }
};
exports.WorldService = WorldService;
exports.WorldService = WorldService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [template_service_1.TemplateService])
], WorldService);
//# sourceMappingURL=world.service.js.map