export class Command {
    myweb;
    isHasScope = false;
    isCustomHtml = false;
    isAsOne = false;
    constructor(myweb) {
        this.myweb = myweb;
    }
    q_render(req, arr, isLast) {
        throw new Error("Need to implement");
    }
    get$first($first, str, expr, pos) {
        throw new Error("Need to implement");
    }
    get$els($src, str, expr, pos) {
        throw new Error("Need to implement");
    }
    //нужен для ssr
    reset() { }
}
