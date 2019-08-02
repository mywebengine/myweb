import {copy} from "../../util.js";
import {inc_get$els} from "./inc.js";

export const ifCmd = {
	render(req) {
		return if_get.call(this, req, this.renderTag.bind(this), this.show.bind(this), this.hide.bind(this));
	},
	linker(req) {
		return if_get.call(this, req, this.linker.bind(this), $e => $e, $e => $e);
	},
	getScope: if_getScope
};
/*
export const elseifCmd = {
	getScope: if_getScope
};
export const elseCmd = {
	getScope: if_getScope
};*/
export const switchCmd = {
	render(req) {
		return switch_get.call(this, req, this.renderTag.bind(this));
	},
	linker(req) {
		return switch_get.call(this, req, this.linker.bind(this));
	},
	getScope: if_getScope
};
/*
export const caseCmd = {
	getScope: if_getScope
};
export const defaultCmd = {
	getScope: if_getScope
};*/
function if_getScope(req) {
	const varName = req.args[0];
	if (varName) {
		req.scope[varName] = this.eval(req);
	}
	return req.scope;
}
function if_get(req, goFunc, showFunc, hideFunc, testFunc = f => f, ifCmdName = ":if", elseifCmdName = ":elseif", elseCmdName = ":else") {
	let $e = req.$src;
//console.log(11111, $e, req);
	if (req.cmd != ifCmdName) {
		for (; $e; $e = $e.previousElementSibling) {
			let f;
			for (const [n, v] of this.getAttrs($e)) {
				const [cmdName, args] = this.getCmdArgs(n);
				if (cmdName == ifCmdName) {
					f = true;
					req.str = n;
					req.expr = v;
					req.args = args;
					break;
				}
			}
			if (f) {
				break;
			}
		}	
	}
	let isLast;
	if (req.value = testFunc(this.eval(req))) {
//console.log(4444, req);
		[$e, isLast] = if_go.call(this, req, showFunc($e), goFunc);
//console.log(4444, req, $e, isLast);
	} else {
//console.log(5555, req);
		[$e, isLast] = [hideFunc($e), true];
//console.log(5555, req, $e, isLast);
	}
//	req.$src = $e;
//alert(req.expr);
	for (let $i = $e.nextElementSibling; $i; $i = $i.nextElementSibling) {
		let f;
		for (const [n, v] of this.getAttrs($i)) {
			const [cmdName, args] = this.getCmdArgs(n);
			if (cmdName == elseifCmdName) {
				f = true;
				if (req.value) {
					$e = $i = hideFunc($i);
//console.log(cmdName, $e);
					break;
				}
				req.str = n;
				req.expr = v;
				req.args = args;
				req.$srcForErr = $i;
				if (req.value = testFunc(this.eval(req))) {
//console.log(1114444, req);
					[$i, isLast] = if_go.call(this, req, showFunc($i), goFunc);
//console.log(1114444, req, $i, isLast);
				} else {
					$i = hideFunc($i);
//console.log(1115555, req, $i);
				}
				$e = $i;
//console.log(cmdName, $e);
				break;
			} else if (cmdName == elseCmdName) {
//--				f = true;
				if (req.value) {
					$e = $i = hideFunc($i);
//console.log(cmdName, $e);
//console.log(1114444, req, $i, isLast);
					break;
				}
				req.str = n;
				req.expr = v;
				req.args = args;
				req.$srcForErr = $i;
//console.log(1115555, req);
				[$i, isLast] = if_go.call(this, req, $i = showFunc($i), goFunc);

				$e = $i;
//console.log(cmdName, $e);
				break;
			}
		}
		if (!f) {
			break;
		}
	}
//console.log("finish", $e, isLast);
	return {
		$e,
		isLast
	};
}
function if_go(req, $e, goFunc) {
	const varName = req.args[0];
//--	if (!varName) {
//		return [$e];
//	}
	const scope = copy(req.scope);
	if (varName) {
		scope[varName] = req.value;
	}
//	const attrsAfter = this.getAttrsAfter(this.getAttrs($e), req.str);
//console.log($e, attrsAfter, this.getAttrs($e), req.str);
	return [goFunc($e, scope, this.getAttrsAfter(this.getAttrs($e), req.str)), true];
}
function switch_get(req, goFunc) {
	const expression = this.eval(req);
	const showFunc = this.show.bind(this);
	const hideFunc = this.hide.bind(this);
	for (const [n, v] of this.getAttrs(req.$src)) {
		const [cmdName, args] = this.getCmdArgs(n);
		if (cmdName == ":case") {
			req.cmd = ":switch";
			req.str = n;
			req.expr = v;
			req.args = args;
			return if_get.call(this, req, goFunc, showFunc, hideFunc, f => f == expression, ":switch", ":case", ":default");
		}
	}
	this.check(new Error(">>>Tpl switch:01: Need use case cmmand"), req);
}
