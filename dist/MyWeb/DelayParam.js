export class DelayParam {
    srcId;
    resolve;
    reject;
    constructor(srcId, resolve, reject) {
        this.srcId = srcId;
        this.resolve = resolve;
        this.reject = reject;
    }
}
