import {check} from "../util.js";

export default {
	render,
	linker: render,
	setScope
};
function render(req) {
	if (req.expr) {
		req.scope[req.expr] = req.scope;
		return null;
	}
	throw check(new Error(">>>Tpl scope:01: Need set variable(s) name"), req);
}
function setScope(req) {
	render(req);
	return true;
}
