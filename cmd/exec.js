import {p_target} from "../config.js";
import {eval2, q_eval2} from "../eval2.js";
import {kebabToCamelCase} from "../str.js";

export default {
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => {
				exec_render(req, req.scope, val);
				return null;
			});
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						exec_render(req, arr[i].scope, vals[i]);
					}
				}
				return null;
			});
	}
};
function exec_render(req, scope, val) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		scope[p_target][kebabToCamelCase(n)] = val;
	}
}
