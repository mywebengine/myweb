import { Get$elsByStr } from "./Get$elsByStr.js";
export declare class Descr {
    id: number;
    srcId: number;
    attr: Map<string, string> | null;
    varIds: Set<number> | null;
    srcIds: Set<number>;
    isHasScope: boolean;
    isCustomHtml: boolean;
    asOnes: Set<string> | null;
    get$elsByStr: Map<string, Get$elsByStr> | null;
    constructor(id: number, srcId: number, attr: Map<string, string> | null, varIds: Set<number> | null);
}
//# sourceMappingURL=Descr.d.ts.map