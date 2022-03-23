import {p_target} from "../../config/config.js";
import {eval2, q_eval2} from "../../eval2/eval2.js";
import {getProxy} from "../../proxy/proxy.js";
import {kebabToCamelCase} from "../../str/str.js";
import {type_cmd} from "../type.js";

export default type_cmd(cmd_render, cmd_q_render, null, null, false, false);

function cmd_render(req) {
	return eval2(req, req.$src, true)
		.then(val => {
			const n = getName(req);
			if (n !== undefined) {
				req.scope[p_target][n] = getProxy(val);
			}
			return null;
		});
}
function cmd_q_render(req, arr, isLast) {
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
/*
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
};*/
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		return kebabToCamelCase(n);
	}
}
