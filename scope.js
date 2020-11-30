import {Tpl_$src, p_descrId, p_localId, p_isCmd, dataVarName, cmdVarName} from "./config.js";
import {descrById} from "./descr.js";
import {preRender, getLocalId} from "./dom.js";
import {getProxy, getLocalScopeProxyHandler} from "./proxy.js";
import {type_req} from "./req.js";
import {ocopy} from "./util.js";

if (!self.localScope) {
	self.localScope = {};
}
if (!self.loacIdCurVal) {
	self.loacIdCurVal = 0;
}
export function getNewLocalId() {
	return (++self.loacIdCurVal).toString();
}

export async function getScope($e, str, $top = Tpl_$src.parentNode, top) {
//console.log("getScope", $e, str, $top, top);
	const scope = top && ocopy(top) || {},
		$path = [];
	for (let $i = (str || str === "") && $e.parentNode || $e; $i !== $top; $path.push($i), $i = $i.parentNode);
	for (let i = $path.length - 1; i > -1; i--) {
		const $i = $path[i],
			dId = $i[p_descrId] || preRender($i) && $i[p_descrId];
		if ($i[p_isCmd]) {
			const lId = $i[p_localId];
			if (lId) {
				setLocalScope(lId, scope, $i);
			}
			for (const [n, v] of descrById.get(dId).attr) {
				if (!await execSetScope($i, n, v, scope)) {
					break;
				}
			}
		}
	}
	const lId = $e[p_localId];
	if (lId) {
		setLocalScope(lId, scope, $e);
	}
	if (str) {
		const dId = $e[p_descrId] || preRender($e) && $e[p_descrId];
		if ($e[p_isCmd]) {
			for (const [n, v] of descrById.get(dId).attr) {
				if (n === str || !await execSetScope($e, n, v, scope)) {
					break;
				}
			}
		}
	}
	return scope;
}
function execSetScope($e, str, expr, scope) {
	const lId = getLocalId($e, str);
	if (lId) {
		setLocalScope(lId, scope, $e, str);
	}
	const req = type_req($e, str, expr, scope, null, false),
		setF = req.reqCmd.cmd.setScope;
	if (setF) {
		return setF(req);
	}
	return true;
}
export function setLocalScope(lId, scope, $e, str) {
/*--
	if ($e[p_localId] !== lId) {
		while (!$e[p_isCmd]) {
			$e = $e.nextSibling;
		}
	}*/
	const l = self.localScope[lId] || (self.localScope[lId] = type_localScope());
	scope[dataVarName] = new Proxy(getProxy(l[dataVarName]), getLocalScopeProxyHandler($e, str, dataVarName));
	scope[cmdVarName] = new Proxy(getProxy(l[cmdVarName]), getLocalScopeProxyHandler($e, str, cmdVarName));
}
function type_localScope() {
	return {
		[dataVarName]: {},
		[cmdVarName]: {}
	};
}
