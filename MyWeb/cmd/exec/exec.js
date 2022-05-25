import {getProxy} from "../../proxy/proxy.js";
import {kebabToCamelCase} from "../../str/str.js";
import {Command} from "../Command.js";

export default class Exec extends Command {
	render(req) {
		return this.eval2(req, req.$src, true)
			.then(val => {
				const n = getName(req);
				if (n !== undefined) {
					req.scope[this.my.p_target][n] = getProxy(val);
				}
				return null;
			});
	}
	q_render(req) {
		return this.q_eval2(req, arr, isLast)
			.then(vals => {
				const n = getName(req);
				if (n === undefined) {
					return null;
				}
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						arr[i].scope[this.my.p_target][n] = getProxy(vals[i]);
					}
				}
				return null;
			});
	}
}
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		return kebabToCamelCase(n);
	}
}
