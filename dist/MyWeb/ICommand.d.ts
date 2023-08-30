import { Req } from "./Req.js";
import { RenderRes } from "./RenderRes.js";
import { Q_arr } from "./Q_arr.js";
export interface ICommand {
    isHasScope: boolean;
    isCustomHtml: boolean;
    isAsOne: boolean;
    render(req: Req): Promise<RenderRes | null> | RenderRes | null;
    q_render(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<(RenderRes | null)[] | null> | (RenderRes | null)[] | null;
    get$first($first: HTMLElement, str: string, expr: string, pos: number): HTMLElement;
    get$els($src: HTMLElement, str: string, expr: string, pos: number): HTMLElement[];
    reset(): void;
}
//# sourceMappingURL=ICommand.d.ts.map