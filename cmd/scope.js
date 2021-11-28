import {p_target} from "../config.js";
import {getErr} from "../err.js";
import {kebabToCamelCase} from "../str.js";

export default {
	render(req) {
		req.scope[p_target][getName(req)] = req.scope;
		return null;
	},
	q_render(req, arr, isLast) {
		const n = getName(req),
			arrLen = arr.length;
		for (let i = 0; i < arrLen; i++) {
			if (!isLast.has(i)) {
				arr[i].scope[p_target][n] = arr[i].scope;
			}
		}
		return null;
	}
};
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		return kebabToCamelCase(n);
	}
	throw getErr(new Error(">>>mw scope:render: Need set scope name"), req.$src, req);
}
