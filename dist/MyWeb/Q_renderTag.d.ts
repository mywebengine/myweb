import { Q_arr } from "./Q_arr.js";
import { RenderTag } from "./RenderTag.js";
import { Sync } from "./Sync.js";
export declare abstract class Q_renderTag extends RenderTag {
    q_renderTag(arr: Q_arr[], str: string, isLast: Set<number>, sync: Sync): Promise<Q_arr[]>;
    private q_attrRender;
    private q_addAfterAttr;
    private q_renderChildren;
    private q_renderFlow;
    private q_nextGroupByDescr;
    private q_execRender;
    private getAttrKey;
}
//# sourceMappingURL=Q_renderTag.d.ts.map