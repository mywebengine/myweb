import config from "../../../config/config.js";
import If from "./If.js";

export default class Switch extends If {
	constructor(my) {
		super(my);
		this.ifCmdName = config.switchCmdName;
		this.elseifCmdName = config.caseCmdName;
		this.elseCmdName = config.defaultCmdName;
	}
	render(req) {
//console.log("switch", req);
		this.make$first(req);
		let f = true;
		for (const [n, v] of this.my.context.srcBy$src.get(req.$src).descr.attr) {
			if (f) {
				if (n === req.str) {
					f = false;
				}
				continue;
			}
			const rc = this.my.context.commandWithArgsByStr.get(n);
			if (rc.commandName !== config.caseCmdName) {
				continue;
			}
			return this.my.eval2(req, req.$src, true)
				.then(expression => {
					req.commandWithArgs = rc;
					req.str = n;
					req.expr = v;
					return this.my.eval2(req, req.$src, true)
						.then(val => this.renderByVal(req, val, f => f === expression));
/*
.then(async val => {
	const r = await renderByVal(req, val, f => f === expression);
	console.log("witch-res", expression, req.str, req.expr, val, r, req);
	alert(1);
	return r;
});*/
				});
		}
		throw this.my.getError(new Error(">>>mw switch:01:Invalide structure: case-cmmand not found"), req.$src, req);
	}
	//todo	q_render(req, arr, isLast) {}
};
