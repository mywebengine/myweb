export declare class RenderParam {
    srcId: number;
    scope: Record<string | symbol, unknown> | null;
    str: string;
    isLinking: boolean;
    isLazyRender: boolean;
    srcIds: Set<number>;
    $els: HTMLElement[] | null;
    constructor(srcId: number, scope: Record<string | symbol, unknown> | null, str: string, isLinking: boolean);
}
//# sourceMappingURL=RenderParam.d.ts.map