import {copy} from "../../util.js";

export default {
	render: function(req) {
/*
		if (!isOnWarn) {
			isOnWarn = true;
			console.warn(`Do not use it:\n\t${req.str} => ${req.expr}\nBetter use :attr, because you can not do a simple render on the server.`);
		}*/
		req = copy(req);
		const scope = copy(req.scope);
		for (const i in req.scope) {
			if (req.scope[i] == req.scope) {
				scope[i] = scope;
			}
		}
		req.scope = scope;
		Reflect.set(req.$src, "on" + req.args[0], (evt) => {
			return this.eval(req);
		});
	}
};
