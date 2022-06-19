export default class Req {
	constructor($src, str, expr, scope, sync, commandWithArgs) {
		this.$src = $src;
		this.str = str;
		this.expr = expr;
		this.scope = scope;
		this.sync = sync;
		this.commandWithArgs = commandWithArgs;// || null;
	}
};
