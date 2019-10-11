import {spaceRe} from "../../util.js";

export default {
	render: scope_get,
	linker: scope_get,
	getScope: function(req) {
		return scope_get.call(this, req);
//		return req.scope;
	}
};
function scope_get(req) {
	const varNames = req.expr.trim().split(spaceRe);
	const varNamesLen = varNames.length;
	if (!varNamesLen) {
		this.check(new Error(">>>Tpl scope:01: Need set variable(s) name"), req);
//		return;
		return false;
	}
	for (let i = 0; i < varNamesLen; i++) {
		req.scope[varNames[i]] = req.scope;
	}
	return true;
}
