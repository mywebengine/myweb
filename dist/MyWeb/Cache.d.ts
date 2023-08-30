import { AfterAnimationSyncValue } from "./AfterAnimationSyncValue.js";
export declare class Cache {
    isInits: Set<string>;
    current: Map<string, string>;
    value: Map<string, Promise<unknown>>;
    afterAnimationSyncValue: Map<string, AfterAnimationSyncValue>;
}
//# sourceMappingURL=Cache.d.ts.map