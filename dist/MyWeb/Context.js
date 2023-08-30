export class Context {
    currentIdValue = 0;
    commandWithArgsByStr = new Map();
    $srcById = new Map();
    srcById = new Map();
    srcBy$src = new WeakMap();
    descrById = new Map();
    varIdByVar = new Map();
    varById = new Map();
    varIdByVarIdByProp = new Map();
    srcIdsByVarId = new Map();
    functionByExpr = new Map();
    customElementByKey = new Map();
    renderParams = new Set();
    delayInMs = 0;
    delayId = 0;
    delayParams = new Set();
    syncId = 0;
    _oldLocHash = "";
    syncInRender = new Set();
    currentRender = Promise.resolve();
    //todo rename to loadingCountBySrcId
    loadingCount = new Map();
    document = document;
    rootElement = document.documentElement;
}
