"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorldModule = void 0;
const common_1 = require("@nestjs/common");
const world_controller_1 = require("./world.controller");
const world_service_1 = require("./world.service");
const template_module_1 = require("../template/template.module");
let WorldModule = class WorldModule {
};
exports.WorldModule = WorldModule;
exports.WorldModule = WorldModule = __decorate([
    (0, common_1.Module)({
        imports: [template_module_1.TemplateModule],
        controllers: [world_controller_1.WorldController],
        providers: [world_service_1.WorldService],
        exports: [world_service_1.WorldService],
    })
], WorldModule);
//# sourceMappingURL=world.module.js.map