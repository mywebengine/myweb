import { CommandWithArgs } from "./CommandWithArgs.js";
import { Descr } from "./Descr.js";
import { DelayParam } from "./DelayParam.js";
import { RenderParam } from "./RenderParam.js";
import { Src } from "./Src.js";
import { Sync } from "./Sync.js";
import { CustomElementState } from "./CustomElementState.js";
export declare class Context {
    currentIdValue: number;
    commandWithArgsByStr: Map<string, CommandWithArgs | null>;
    $srcById: Map<number, HTMLElement>;
    srcById: Map<number, Src>;
    srcBy$src: WeakMap<HTMLElement, Src>;
    descrById: Map<number, Descr>;
    varIdByVar: Map<object, number>;
    varById: Map<number, object>;
    varIdByVarIdByProp: Map<number, Map<string | symbol, number>>;
    srcIdsByVarId: Map<number, Set<number>>;
    functionByExpr: Map<string, (...args: unknown[]) => Promise<unknown>>;
    customElementByKey: Map<string | Request | Response, CustomElementState>;
    renderParams: Set<RenderParam>;
    delayInMs: number;
    delayId: number;
    delayParams: Set<DelayParam>;
    syncId: number;
    _oldLocHash: string;
    syncInRender: Set<Sync>;
    currentRender: Promise<void>;
    loadingCount: Map<number, Map<string, number>>;
    document: Document;
    rootElement: HTMLElement;
}
//# sourceMappingURL=Context.d.ts.map