import { ShowHide } from "./ShowHide.js";
import { Req } from "./Req.js";
import { Q_arr } from "./Q_arr.js";
export declare abstract class Eval2 extends ShowHide {
    eval2(req: Req, $src: HTMLElement, isReactive: boolean): Promise<unknown>;
    eval2Execute(req: Req, $src: HTMLElement): Promise<unknown>;
    q_eval2(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<unknown[]>;
    private getEval2Func;
    private q_getEval2Func;
    private getCacheSrcId;
}
//# sourceMappingURL=Eval2.d.ts.map