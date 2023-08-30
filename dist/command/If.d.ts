import { Q_arr } from "../MyWeb/Q_arr.js";
import { RenderRes } from "../MyWeb/RenderRes.js";
import { Req } from "../MyWeb/Req.js";
import { Command } from "./Command.js";
export declare class If extends Command {
    isHasScope: boolean;
    protected ifCmdName: string;
    protected elseifCmdName: string;
    protected elseCmdName: string;
    render(req: Req): Promise<RenderRes | null>;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<(RenderRes | null)[]> | null;
    get$first($src: HTMLElement, str: string, expr: string, pos: number): HTMLElement;
    get$els($src: HTMLElement, str: string, expr: string, pos: number): HTMLElement[];
    protected renderByVal(req: Req, val: unknown, testFunc?: (f: unknown) => boolean): Promise<RenderRes | null>;
    protected make$first(req: Req): void;
    private if_get$first;
    private isSingle;
    private makeShow;
    private getNextStr;
}
//# sourceMappingURL=If.d.ts.map