import {p_target} from "../config.js";
import {check, kebabToCamelStyle} from "../util.js";

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
	const n = req.reqCmd.args[0];
	if (n === undefined || n === "") {
		throw check(new Error(">>>mw scope:render: Need set scope name"), req.$src, req);
	}
	scope[p_target][kebabToCamelStyle(n)] = scope;
}
