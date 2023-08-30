import { LocalState } from "./LocalState.js";
import { RenderParam } from "./RenderParam.js";
import { Task } from "./Task.js";
export declare class Sync {
    syncId: number;
    renderParam: RenderParam;
    local: Map<number, LocalState>;
    beforeAnimations: Set<Task>;
    animations: Set<Task>;
    afterAnimations: Set<Task>;
    scrollAnimations: Set<Task>;
    idleCallback: Map<number, Function>;
    animationFrame: Map<number, Function>;
    stat: number;
    promise: Promise<void>;
    resolve: (value: (void | PromiseLike<void>)) => void;
    constructor(syncId: number, renderParam: RenderParam);
}
//# sourceMappingURL=Sync.d.ts.map