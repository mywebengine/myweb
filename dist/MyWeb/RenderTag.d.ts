import { RenderLoop } from "./RenderLoop.js";
import { Req } from "./Req.js";
import { Sync } from "./Sync.js";
export declare abstract class RenderTag extends RenderLoop {
    renderTag($src: HTMLElement, scope: Record<string | symbol, unknown>, str: string, sync: Sync): Promise<HTMLElement>;
    private attrRender;
    private renderAfterAttr;
    private renderChildren;
    createReq($src: HTMLElement, str: string, expr: string, scope: Record<string | symbol, unknown>, event: Event | null, sync: Sync): Req;
}
//# sourceMappingURL=RenderTag.d.ts.map