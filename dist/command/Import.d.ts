import { CustomElementState } from "../MyWeb/CustomElementState.js";
import { Command } from "./Command.js";
import { Req } from "../MyWeb/Req.js";
import { Q_arr } from "../MyWeb/Q_arr.js";
export declare class Import extends Command {
    private importScriptCache;
    private isWaiting;
    reset(): void;
    render(req: Req): Promise<null>;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<null>;
    private renderByValue;
    getImport(req: Req, val: string | Request | Response | null | undefined): CustomElementState | null;
    private getTopUrl;
    private getAttrTopUrl;
    private createImportFragment;
    private createImportScripts;
    private createImportScript;
    private importToScope;
    private runImportScript;
    private checkScript;
    private addLinks;
    private addStyles;
}
//# sourceMappingURL=Import.d.ts.map