import { Q_arr } from "../MyWeb/Q_arr.js";
import { RenderRes } from "../MyWeb/RenderRes.js";
import { Command } from "./Command.js";
import { Req } from "../MyWeb/Req.js";
export declare class Foreach extends Command {
    isHasScope: boolean;
    isAsOne: boolean;
    render(req: Req): Promise<RenderRes>;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<RenderRes[]>;
    get$first($first: HTMLElement, str: string, expr: string, pos: number): HTMLElement;
    get$els($src: HTMLElement, str: string, expr: string, pos: number): HTMLElement[];
    private renderByVal;
    private getContext;
    private show$first;
    private get$elsGroupByElements;
    private q_add;
    private q_addDeferred;
    private q_addInsert;
    private get$last;
    private q_addI;
    private q_forRender;
    private q_forRenderI;
}
//# sourceMappingURL=Foreach.d.ts.map