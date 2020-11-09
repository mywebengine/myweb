import {eval2, q_eval2} from "../eval2.js";
import {check, kebabToCamelStyle} from "../util.js";

export default {
	async render(req) {
		setValue(req, req.scope, await eval2(req, req.$src, true));
		return null;
	},
	async q_render(req, arr, isLast) {
		const val = await q_eval2(req, arr, isLast),
			len = arr.length;
		for (let i = 0; i < len; i++) {
			if (!isLast[i]) {
				setValue(req, arr[i].scope, val[i]);
			}
		}
		return null;
	},
	linker(req) {
		return eval2(req, req.$src, true);
	},
	async setScope(req) {
		setValue(req, req.scope, await eval2(req, req.$src, true, true));
		return true;
	}
};
function setValue(req, scope, v) {
	const n = req.reqCmd.args[0];
	if (n) {
		scope[kebabToCamelStyle(n)] = v;
	}
}
