"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateService = void 0;
const common_1 = require("@nestjs/common");
const world_template_json_1 = __importDefault(require("../data/world-template.json"));
let TemplateService = class TemplateService {
    getTemplate(worldId = 'world_1') {
        const template = JSON.parse(JSON.stringify(world_template_json_1.default));
        if (worldId !== 'world_2') {
            return template;
        }
        const world2Stages = [
            { id: 1, x: 130, y: 350, estado: 'active', tipo: 'vip_desafio', enCurso: false, cofre: 'none' },
            { id: 2, x: 240, y: 320, estado: 'locked', tipo: 'vip_recompensa', enCurso: false, cofre: 'closed' },
            { id: 3, x: 350, y: 292, estado: 'locked', tipo: 'vip_promo', enCurso: false, cofre: 'none' },
            { id: 4, x: 460, y: 260, estado: 'locked', tipo: 'vip_desafio', enCurso: false, cofre: 'none' },
            { id: 5, x: 570, y: 280, estado: 'locked', tipo: 'vip_recompensa', enCurso: false, cofre: 'closed' },
            { id: 6, x: 680, y: 315, estado: 'locked', tipo: 'vip_promo', enCurso: false, cofre: 'none' },
            { id: 7, x: 770, y: 286, estado: 'locked', tipo: 'vip_final', enCurso: false, cofre: 'none' },
        ];
        template.narrativa.titulo = 'Distrito Nocturno';
        template.world = {
            id: 'world_2',
            stages: world2Stages,
            currentStage: 1,
            stageEnCurso: false,
            casino: { x: 915, y: 208, estado: 'locked' },
            props: {
                pathCurvePoints: [
                    { x: 130, y: 350 },
                    { x: 240, y: 320 },
                    { x: 350, y: 292 },
                    { x: 460, y: 260 },
                    { x: 570, y: 280 },
                    { x: 680, y: 315 },
                    { x: 770, y: 286 },
                    { x: 848, y: 250 },
                    { x: 915, y: 208 },
                ],
            },
            npc: { x: 540, y: 384, nombre: 'Guia VIP' },
            board: { x: 952, y: 116 },
            book: { x: 92, y: 114 },
        };
        template.player.currentStage = 1;
        template.player.retoDelDia = {
            descripcion: 'Completa 2 etapas VIP',
            progreso: 0,
            total: 2,
            reclamado: false,
        };
        template.misiones.activas = [
            {
                id: 'mision-vip',
                titulo: 'Circuito VIP',
                descripcion: 'Completa las 7 etapas del Distrito Nocturno',
                progreso: 0,
                total: 7,
                reclamada: false,
            },
        ];
        return template;
    }
};
exports.TemplateService = TemplateService;
exports.TemplateService = TemplateService = __decorate([
    (0, common_1.Injectable)()
], TemplateService);
//# sourceMappingURL=template.service.js.map