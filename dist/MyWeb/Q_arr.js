export class Q_arr {
    $src;
    scope;
    scopePatch;
    constructor($src, scope, scopePatch) {
        this.$src = $src;
        this.scope = scope;
        this.scopePatch = scopePatch; //info если srcBy$src.get($src).scope === null, то и scopePatch === null
    }
}
