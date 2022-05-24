export default class Req {
	constructor($src, str, expr, scope, sync, reqCmd) {
		this.$src = $src;
		this.str = str;
		this.expr = expr;
		this.scope = scope;
		this.sync = sync;
		this.reqCmd = reqCmd;// || null;
	}
};
