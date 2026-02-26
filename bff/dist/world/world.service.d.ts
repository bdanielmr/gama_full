import { TemplateService } from '../template/template.service';
export declare class WorldService {
    private readonly templateService;
    private worldState;
    constructor(templateService: TemplateService);
    getState(): any;
    resetState(): any;
    applyPatch(patch: any): any;
    private deepMerge;
}
