declare class Config {
    p_target: symbol;
    p_topUrl: symbol;
    visibleScreenSize: number;
    renderBatchSize: number;
    defIdleCallbackOpt: {
        timeout: number;
    };
    locVarName: string;
    viewVarName: string;
    mountEventName: string;
    renderEventName: string;
    removeEventName: string;
    loadEventName: string;
    okEventName: string;
    errorEventName: string;
    defEventInit: {
        bubbles: boolean;
        cancelable: boolean;
        composed: boolean;
    };
    lazyRenderName: string;
    commandPref: string;
    commandArgsDiv: string;
    commandArgsDivLen: number;
    descrIdName: string;
    asOneIdxName: string;
    idxName: string;
    attrCmdName: string;
    pushModName: string;
    replaceModName: string;
    execCmdName: string;
    foreachCmdName: string;
    defRequestInit: {
        headers: {
            "x-requested-with": string;
        };
    };
    resultDetailName: string;
    errorDetailName: string;
    htmlCmdName: string;
    textCmdName: string;
    ifCmdName: string;
    elseifCmdName: string;
    elseCmdName: string;
    switchCmdName: string;
    caseCmdName: string;
    defaultCmdName: string;
    importCmdName: string;
    importCmdBegin: string;
    importCmdEnd: string;
    onCmdName: string;
    preventDefaultModName: string;
    stopModName: string;
    selfModName: string;
    exactModName: string;
    hideName: string;
    isFillingName: string;
    isFillingDiv: string;
}
export declare const config: Config;
export declare const p_target: symbol;
export {};
//# sourceMappingURL=config.d.ts.map