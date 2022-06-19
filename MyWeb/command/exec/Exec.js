import config from "../../../config/config.js"
import kebabToCamelCase from "../../../str/kebabToCamelCase.js";
import Command from "../Command.js";

export default class Exec extends Command {
	render(req) {
		return this.my.eval2(req, req.$src, true)
			.then(val => {
				const n = this.getName(req);
				if (n !== undefined) {
					req.scope[config.p_target][n] = this.my.getReact(val);
				}
				return null;
			});
	}
	q_render(req, arr, isLast) {
		return this.my.q_eval2(req, arr, isLast)
			.then(vals => {
				const n = this.getName(req);
				if (n === undefined) {
					return null;
				}
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						arr[i].scope[config.p_target][n] = this.my.getReact(vals[i]);
					}
				}
				return null;
			});
	}
	//private
	getName(req) {
		const n = req.commandWithArgs.args[0];
		if (n !== undefined && n !== "") {
			return kebabToCamelCase(n);
		}
	}
};
