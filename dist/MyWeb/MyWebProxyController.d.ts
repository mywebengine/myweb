import { ProxyController } from "../ProxyController.js";
import { IMyWeb } from "./IMyWeb.js";
export declare class MyWebProxyController extends ProxyController {
    private myweb;
    constructor(myweb: IMyWeb, p_target: symbol);
    reset(): void;
    createScopeProxy<T>(val: T): T;
    private getScopeObjectProxyHandler;
    private scopeHandlerError;
    setCur$src($src: HTMLElement | null): void;
    getProxyStat(): {
        value: number;
    };
    protected getVal(t: object, n: string, v: unknown): void;
    protected setVal(t: object, n: string, v: unknown, oldVal: unknown): void;
    private setInnerSrcIdSetBy$src;
    private decVar;
    private delVar;
    _testVars(): void;
}
//# sourceMappingURL=MyWebProxyController.d.ts.map