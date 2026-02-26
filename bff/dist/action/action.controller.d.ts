import { ActionService } from './action.service';
export declare class ActionController {
    private readonly actionService;
    constructor(actionService: ActionService);
    handleAction(body: {
        action: string;
        payload?: any;
    }): {
        ok: boolean;
        patch: any;
    };
}
