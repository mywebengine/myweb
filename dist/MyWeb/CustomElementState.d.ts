declare type CustomElementReadyState = "loading" | "complete";
export declare type CustomElementType = "open" | "close" | "include";
export declare class CustomElementState {
    type: CustomElementType;
    key: string | Request | Response;
    readyState: CustomElementReadyState;
    url: string | null;
    req: Request | null;
    res: Response | null;
    $fr: DocumentFragment | null;
    $tags: HTMLElement[] | null;
    scope: Record<string | symbol, unknown>;
    constructor(readyState: CustomElementReadyState, type: CustomElementType | undefined, url: string | null, req: Request | null, res: Response | null, scope: Record<string | symbol, unknown>);
}
export {};
//# sourceMappingURL=CustomElementState.d.ts.map