import { Cache } from "./Cache.js";
import { Context } from "./Context.js";
import { Descr } from "./Descr.js";
import { Q_I } from "./Q_$i.js";
import { Req } from "./Req.js";
import { Sync } from "./Sync.js";
interface IMyWeb {
    context: Context;
    createSrc($e: HTMLElement, descr: Descr | null, asOneIdx: Map<string, number> | null, idx: Map<string, number> | null): Src;
    createReq($src: HTMLElement, str: string, expr: string, scope: Record<string | symbol, unknown>, event: Event | null, sync: Sync): Req;
    getNewId(): number;
    getError(err: Error, $src: Node, req?: Req, scope?: Record<string, unknown>, fileName?: string, lineNum?: number, colNum?: number): Error;
}
export declare class Src {
    myweb: IMyWeb;
    id: number;
    descr: Descr;
    isCmd: boolean;
    isHide: boolean;
    scope: Record<string | symbol, unknown> | null;
    asOneIdx: Map<string, number> | null;
    idx: Map<string, number> | null;
    cache: Cache | null;
    isMounted: boolean;
    isCustomElementConnected: boolean;
    save: Map<string, Map<string, string>> | null;
    constructor(myweb: IMyWeb, id: number, descr: Descr, isCmd: boolean, isHide: boolean, scope: Record<string, unknown> | null, asOneIdx: Map<string, number> | null, idx: Map<string, number> | null, cache: Cache | null);
    getScope<T extends Record<string | symbol, unknown>>(scope: T): Record<string | symbol, unknown>;
    q_cloneNode(req: Req, beginIdx: number, len: number): Q_I[];
    private q_cloneNodeCreateChildren;
    private q_cloneNodeCreate;
    private q_cloneNodeChangeAsOne;
    setAttribute(name: string, value: string, $src?: HTMLElement): void;
    setAttributeValue(name: string, value: string, $src?: HTMLInputElement): void;
    removeAttribute(name: string): void;
    setAsOneIdx(str: string, idx: number): void;
    getIdx(str: string): number | undefined;
    setIdx(str: string, idx: number): void;
    get$first(str: string): HTMLElement;
    get$els(str: string): HTMLElement[];
    getNextStr(str: string): string;
    getAttrAfter(name: string): Map<string, string>;
    getAttrAfterEntries(name: string): IterableIterator<[string, string]>;
    getAttrAfterKeys(name: string): IterableIterator<string>;
    is$hide(): boolean;
}
export {};
//# sourceMappingURL=Src.d.ts.map