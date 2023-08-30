export class Sync {
    syncId;
    renderParam;
    local = new Map();
    beforeAnimations = new Set();
    animations = new Set();
    afterAnimations = new Set();
    scrollAnimations = new Set();
    //--this.onreadies = new Set();
    idleCallback = new Map();
    animationFrame = new Map();
    stat = 0;
    promise;
    // @ts-ignore
    resolve;
    constructor(syncId, renderParam) {
        this.syncId = syncId;
        this.renderParam = renderParam;
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        });
    }
}
