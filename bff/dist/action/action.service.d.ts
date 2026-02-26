import { SseService } from '../sse/sse.service';
import { TemplateService } from '../template/template.service';
import { WorldService } from '../world/world.service';
export declare class ActionService {
    private readonly worldService;
    private readonly templateService;
    private readonly sseService;
    constructor(worldService: WorldService, templateService: TemplateService, sseService: SseService);
    handleAction(action: string, payload: any): {
        ok: boolean;
        patch: any;
    };
    private iniciarStage;
    private completarStage;
    private abrirCofre;
    private togglePopup;
    private reclamarMision;
    private entrarCasino;
    private reiniciarJuego;
    private applyEnergyRegen;
    private addToast;
    private pushToast;
    private findStage;
    private randomInt;
    private computeLevel;
    private pickRareza;
    private publishPatch;
    private emitEvent;
}
