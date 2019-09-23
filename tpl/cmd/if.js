import {ifCmdName, elseifCmdName, elseCmdName, switchCmdName, caseCmdName, defaultCmdName} from "../const.js";
import {copy} from "../../util.js";
import {inc_isInc, inc_get$els, inc_getFirstElement} from "./inc.js";

export const ifCmd = {
	render(req) {
		return if_get.call(this, req, this.renderTag.bind(this), this.show.bind(this), this.hide.bind(this), f => f, ifCmdName, elseifCmdName, elseCmdName);
	},
	linker(req) {
		return if_get.call(this, req, this.linker.bind(this), $e => $e, $e => $e, ifCmdName, elseifCmdName, elseCmdName);
	},
	getScope: if_getScope
};
export const switchCmd = {
	render(req) {
		return switch_get.call(this, req, this.renderTag.bind(this));
	},
	linker(req) {
		return switch_get.call(this, req, this.linker.bind(this));
	},
	getScope: if_getScope
};
function if_getScope(req) {
	const varName = req.args[0];
	if (varName) {
		req.scope[varName] = this.eval(req);
	}
	return req.scope;
}
function if_get(req, renderFunc, showFunc, hideFunc, testFunc = f => f, ifCmdName, elseifCmdName, elseCmdName, $e) {
	if (!$e) {
		$e = if_make$first.call(this, req, ifCmdName, elseifCmdName, elseCmdName);
	}
	let isLast;
	if (req.value = testFunc(this.eval(req))) {
		[$e, isLast] = if_render.call(this, req, showFunc($e), renderFunc);
	} else {
		$e = hideFunc($e);
		isLast = true;
	}
//	for (const n of this.getAttrsBefore(this.getAttrs($e), req.str).keys()) {
	for (const n of this.getAttrs($e instanceof HTMLElement ? $e : $e.previousElementSibling).keys()) {
		if (n == req.str) {
			break;
		}
		const [cmdName] = this.getCmdArgs(n);
		if ((cmdName == ifCmdName && ifCmdName != switchCmdName) || cmdName == elseifCmdName || cmdName == elseCmdName) {
			//is single
			return {
				$e,
				isLast
			};
		}
	}
	for (let $i = $e.nextElementSibling; $i; $i = $i.nextElementSibling) {
		let isElse;
		for (const [n, v] of this.getAttrs($i)) {
			const [cmdName, args] = this.getCmdArgs(n);
			if (cmdName == ifCmdName) {
				isElse = true;
				break;//следующий это новый ИФ
			}
			isElse = cmdName == elseCmdName;
			if (!isElse && cmdName != elseifCmdName) {
				continue;//еще нельзя понять, что делать
			}
			if (req.value) {
				[$i, $e] = if_apply.call(this, $i, n, hideFunc);
				isLast = true;
				break;
			}
			req.cmdName = cmdName;
			req.str = n;
			req.expr = v;
			req.args = args;
			req.$srcForErr = $i;
			if (isElse || (req.value = testFunc(this.eval(req)))) {
				[$i, $e] = if_apply.call(this, $i, n, showFunc);
				[$i, isLast] = if_render.call(this, req, $i, renderFunc);
			} else {
				[$i, $e] = if_apply.call(this, $i, n, hideFunc);
				isLast = true;
			}
			break;
		}
		if (isElse) {
			break;
		}
	}
	return {
		$e,
		isLast
	};
}
function if_make$first(req, ifCmdName, elseifCmdName, elseCmdName) {
	if (req.cmdName == ifCmdName) {
		return req.$src;
	}
	for (let $i = req.$src.previousElementSibling; $i; $i = $i.previousElementSibling) {
		let isNext;
		for (const [n, v] of this.getAttrs($i)) {
			const [cmdName, args] = this.getCmdArgs(n);
			if (cmdName == elseifCmdName) {// || cmdName == elseCmdName) {
				isNext = true;
				break;
			}
			if (cmdName == ifCmdName) {
				req.cmdName = cmdName;
				req.str = n;
				req.expr = v;
				req.args = args;
				return $i;
			}
		}
		if (!isNext) {
			req.$srcForErr = $i;
			this.check(new Error(">>>Tpl if:01:Invalid structure: if or elseif-comand not found"), req);
			return;
		}
	}
	this.check(new Error(">>>Tpl if:02:Invalid structure: if-command not found"), req);
}
function if_render(req, $e, renderFunc) {
	const varName = req.args[0];
	const scope = copy(req.scope);
	if (varName) {
		scope[varName] = req.value;
	}
	return [renderFunc($e, scope, this.getAttrsAfter(this.getAttrs($e), req.str)), true];
}
function if_apply($i, n, applyFunc) {
	if (inc_isInc.call(this, $i, n)) {
		const $els = inc_get$els.call(this, $i);
		const $elsLen = $els.length;
		for (let i = 0; i < $elsLen; i++) {
			if (!($els[i] instanceof Comment)) {
				$i = applyFunc($els[i]);
			}
		}
		return [$i, $els[$elsLen - 1]];
	}
	$i = applyFunc($i);
	return [$i, $i];
}
function switch_get(req, renderFunc) {
	const $first = if_make$first.call(this, req, switchCmdName, caseCmdName, defaultCmdName);
//	for (const [n, v] of this.getAttrsAfter(this.getAttrs($first), req.str)) {
	let f;
	for (const [n, v] of this.getAttrs($first)) {
		if (!f) {
			if (n == req.str) {
				f = true;
			}
			continue;
		}
		const [cmdName, args] = this.getCmdArgs(n);
		if (cmdName == caseCmdName) {
			const expression = this.eval(req);
			req.str = n;
			req.expr = v;
			req.args = args;
			return if_get.call(this, req, renderFunc, this.show.bind(this), this.hide.bind(this), f => f == expression, switchCmdName, caseCmdName, defaultCmdName, $first);
		}
	}
	this.check(new Error(">>>Tpl switch:01:Invalide structure: case-cmmand not found"), req);
}
