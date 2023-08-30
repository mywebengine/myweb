import { ICommand } from "../MyWeb/ICommand.js";
import { IMyWeb } from "../MyWeb/IMyWeb.js";
import { Req } from "../MyWeb/Req.js";
import { Q_arr } from "../MyWeb/Q_arr.js";
import { RenderRes } from "../MyWeb/RenderRes.js";
export declare abstract class Command implements ICommand {
    protected myweb: IMyWeb;
    isHasScope: boolean;
    isCustomHtml: boolean;
    isAsOne: boolean;
    constructor(myweb: IMyWeb);
    abstract render(req: Req): Promise<RenderRes | null> | RenderRes | null;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<(RenderRes | null)[] | null> | (RenderRes | null)[] | null;
    get$first($first: HTMLElement, str: string, expr: string, pos: number): HTMLElement;
    get$els($src: HTMLElement, str: string, expr: string, pos: number): HTMLElement[];
    reset(): void;
}
//# sourceMappingURL=Command.d.ts.map