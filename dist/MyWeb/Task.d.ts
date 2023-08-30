import { LocalState } from "./LocalState.js";
export declare class Task {
    handler: () => unknown;
    local: Map<number, LocalState>;
    viewedSrcId: number;
    constructor(handler: () => unknown, local: Map<number, LocalState>, viewedSrcId: number);
    execute(): unknown;
}
//# sourceMappingURL=Task.d.ts.map