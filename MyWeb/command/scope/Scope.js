import config from "../../../config/config.js";
import kebabToCamelCase from "../../../str/kebabToCamelCase.js";
import Command from "../Command.js";

export default class Scope extends Command {
	render(req) {
		req.scope[config.p_target][this.getName(req)] = req.scope;
		return null;
	}
	q_render(req, arr, isLast) {
		const n = this.getName(req),
			arrLen = arr.length;
		for (let i = 0; i < arrLen; i++) {
			if (!isLast.has(i)) {
				arr[i].scope[config.p_target][n] = arr[i].scope;
			}
		}
		return null;
	}
	//private
	getName(req) {
		const n = req.commandWithArgs.args[0];
		if (n !== undefined && n !== "") {
			return kebabToCamelCase(n);
		}
		throw this.my.getError(new Error(">>>mw scope:render: Need set scope name"), req.$src, req);
	}
};
