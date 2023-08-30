export class RenderParam {
    srcId;
    scope;
    str;
    isLinking;
    isLazyRender = false;
    srcIds = new Set();
    $els = null;
    constructor(srcId, scope, str, isLinking) {
        this.srcId = srcId;
        this.scope = scope;
        this.str = str;
        this.isLinking = isLinking;
    }
}
