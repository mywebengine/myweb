export class Req {
    $src;
    str;
    expr;
    scope;
    event;
    sync;
    commandWithArgs;
    constructor($src, str, expr, scope, event, sync, commandWithArgs) {
        this.$src = $src;
        this.str = str;
        this.expr = expr;
        this.scope = scope;
        this.event = event;
        this.sync = sync;
        this.commandWithArgs = commandWithArgs;
    }
}
