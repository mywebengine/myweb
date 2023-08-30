export declare type WithTarget<T> = T & {
    [target: symbol]: T | null | undefined;
};
export declare class ProxyController {
    static isScalarType: Set<string>;
    static proxyStat: {
        value: number;
    };
    proxyByTarget: WeakMap<object, object>;
    p_target: symbol;
    constructor(p_target?: symbol);
    createProxy<T>(val: T): T;
    private getObjectProxyHandler;
    objectHandlerGet(target: Record<string | symbol, unknown>, name: string | symbol): unknown;
    private funcHandlerGet;
    private getChangeArrFuncHandler;
    private getEntriesFuncHandler;
    private getIteratorFuncHandler;
    private getFuncHandler;
    private getAddFuncHandler;
    private getSetFuncHandler;
    private getDeleteSetMapFuncHandler;
    private getHasFuncHandler;
    private getClearFuncHandler;
    protected isScalar(val: unknown): boolean;
    protected getTarget<T>(val: T): T;
    private getTargetObj;
    private getProxy;
    setProxy<T>(target: T, proxy: object): T;
    protected getVal(target: unknown, name: unknown, val: unknown): void;
    protected setVal(target: unknown, name: unknown, val: unknown, oldVal: unknown): void;
}
//# sourceMappingURL=ProxyController.d.ts.map