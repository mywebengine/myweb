import { RemoveChild } from "./RemoveChild.js";
import { Req } from "./Req.js";
export declare abstract class ShowHide extends RemoveChild {
    show(req: Req, $e: HTMLElement): void;
    hide(req: Req, $e: HTMLElement): void;
    is$visible($e: HTMLElement): boolean;
    private executeShowAnimation;
    private executeHideAnimation;
    private moveProps;
}
//# sourceMappingURL=ShowHide.d.ts.map