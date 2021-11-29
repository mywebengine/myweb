import {p_target} from "../config.js";
import {eval2, q_eval2} from "../eval2.js";
import {getProxy} from "../proxy.js";
import {kebabToCamelCase} from "../str.js";

export default {
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => {
				const n = getName(req);
				if (n !== undefined) {
					req.scope[p_target][n] = getProxy(val);
				}
				return null;
			});
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const n = getName(req);
				if (n === undefined) {
					return null;
				}
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						arr[i].scope[p_target][n] = getProxy(vals[i]);
					}
				}
				return null;
			});
	}
};
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		return kebabToCamelCase(n);
	}
}
