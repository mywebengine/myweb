class Config {
    p_target = Symbol();
    p_topUrl = Symbol();
    visibleScreenSize = 3;
    renderBatchSize = 100;
    defIdleCallbackOpt = {
        timeout: 1000,
    };
    // globVarName = "glob";
    locVarName = "loc";
    viewVarName = "view";
    //renderStartEventName = "renderstart";
    mountEventName = "mount";
    renderEventName = "render";
    removeEventName = "remove";
    loadEventName = "load";
    okEventName = "ok";
    errorEventName = "error";
    defEventInit = {
        bubbles: true,
        cancelable: true,
        composed: false,
    };
    lazyRenderName = "lazy-render";
    commandPref = "";
    commandArgsDiv = ".";
    commandArgsDivLen = this.commandArgsDiv.length;
    descrIdName = "_did" + this.commandArgsDiv;
    asOneIdxName = "_aidx" + this.commandArgsDiv;
    idxName = "_idx" + this.commandArgsDiv;
    attrCmdName = this.commandPref + "attr";
    pushModName = "push"; //.toLowerCase();
    replaceModName = "replace";
    execCmdName = this.commandPref + "exec";
    //fillingCmdName = this.commandPref + "filling";
    foreachCmdName = this.commandPref + "foreach";
    // fetchCmdName = this.commandPref + "fetch";
    defRequestInit = {
        headers: {
            "x-requested-with": "XMLHttpRequest",
        },
    };
    resultDetailName = "res";
    errorDetailName = "err";
    htmlCmdName = this.commandPref + "html";
    textCmdName = this.htmlCmdName + this.commandArgsDiv + "t";
    ifCmdName = this.commandPref + "if";
    elseifCmdName = this.commandPref + "elseif";
    elseCmdName = this.commandPref + "else";
    switchCmdName = this.commandPref + "switch";
    caseCmdName = this.commandPref + "case";
    defaultCmdName = this.commandPref + "default";
    importCmdName = this.commandPref + "import";
    importCmdBegin = this.commandPref + "import_begin";
    importCmdEnd = this.commandPref + "import_end";
    onCmdName = this.commandPref + "on";
    preventDefaultModName = "prevent"; //.toLowerCase();
    stopModName = "stop"; //.toLowerCase();
    selfModName = "self"; //.toLowerCase();
    exactModName = "exact"; //.toLowerCase();
    //eventScopeName = "evt";
    //scopeCmdName = this.commandPref + "scope";
    //watchCmdName = this.commandPref + "watch";
    hideName = "_hide";
    isFillingName = "is_filling";
    isFillingDiv = "-";
}
export const config = new Config();
export const p_target = config.p_target;
//if (FormData.prototype[p_target] !== null) {
// @ts-ignore
FormData.prototype[p_target] = null;
// @ts-ignore
Document.prototype[p_target] = null;
// @ts-ignore
DocumentFragment.prototype[p_target] = null;
// @ts-ignore
Element.prototype[p_target] = null;
// @ts-ignore
Text.prototype[p_target] = null;
// @ts-ignore
Promise.prototype[p_target] = null;
// @ts-ignore
Date.prototype[p_target] = null;
// @ts-ignore
Request.prototype[p_target] = null;
// @ts-ignore
Response.prototype[p_target] = null;
//}
