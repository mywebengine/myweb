import {p_target} from "../config.js";
import {check} from "../util.js";

export default {
	render(req) {
		scope_render(req, req.scope);
		return null;
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						scope_render(req, arr[i].scope);
					}
				}
				return null;
			});
	}
};
function scope_render(req, scope) {
	if (req.expr === "") {
		throw check(new Error(">>>mw scope:render: Need set scope name"), req.$src, req);
	}
	scope[p_target][req.expr] = req.scope;
}
