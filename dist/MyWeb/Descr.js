export class Descr {
    id;
    srcId;
    attr;
    varIds;
    srcIds;
    isHasScope = false;
    isCustomHtml = false;
    asOnes = null;
    get$elsByStr = null;
    constructor(id, srcId, attr, varIds) {
        this.id = id;
        this.srcId = srcId;
        this.attr = attr;
        this.varIds = varIds;
        this.srcIds = new Set([srcId]);
    }
}
