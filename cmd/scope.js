import {p_target} from "../config.js";
import {check} from "../util.js";

export default {
	render
};
function render(req) {
	if (req.expr === "") {
		throw check(new Error(">>>Tpl scope:render: Need set scope name"), req.$src, req);
	}
	req.scope[p_target][req.expr] = req.scope;
	return null;
}
