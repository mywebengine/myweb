import {/*reqCmd, */type_req} from "./render/render.js";
import {Tpl_$src, p_srcId, p_descrId/*--, p_localId*/, p_isCmd, dataVarName, cmdVarName} from "./config.js";
import {scopeCache} from "./cache.js";
import {descrById} from "./descr.js";
import {preRender} from "./dom.js";
import {ocopy} from "./util.js";
/*
if (self.Tpl_localScope) {
	for (const i in self.Tpl_localScope) {
		const l = self.Tpl_localScope[i];
		l.scope = new Proxy(l.scope, getLocalScopeProxyHandler(l.sId, l.str))
//		l[i][dataVarName] = getProxy(l[i][dataVarName]);
//		l[i][cmdVarName] = getProxy(l[i][cmdVarName]);
	}
}
export const localScope = self.Tpl_localScope || {};
export let loacIdCurVal = self.Tpl_loacIdCurVal || 0;
//todo--
self.localScope = localScope;*/

export function getNewLocalId() {
	return (++loacIdCurVal).toString();
}
export async function getScope($e, str, $top) {
//	let scope = scopeCache[$e[p_srcId]];
	const scope = scopeCache[$e[p_srcId]];
	if (!scope) {
//!!!!
console.warn(111111111, $e, $e[p_srcId], str, $top);

		$top = $top && $top.parentNode || Tpl_$src.parentNode;
		const $path = [];
//todo parentSrcId
		for (let $i = $e.parentNode; $i !== $top; $i = $i.parentSrcId ? $srcById[$i.parentSrcId] : $i.parentNode) {
//		for (let $i = $e; $i !== $top; $i = $i.parentSrcId ? $srcById[$i.parentSrcId] : $i.parentNode) {
			const s = scopeCache[$i[p_srcId]];
			if (s) {
//todo 
//console.log(4444, $i, s, $i[p_srcId], $path);
//				scope = ocopy(s);
				scope = s;
				break;
			}
			$path.push($i);
		}//нашли самый нижний с кэшем
//todo console.log(3336, $e, $path);
		if (!scope) {
			scope = {};
		}
		for (let i = $path.length - 1; i > -1; i--) {
//todo !preRender
/*
			const $p = $srcById[$path[i].id];
			if ($p.props !== null) {
				if ($p.props.localScopes[$p.props.localScopes.length - 1]) {
					setLocalScope($p.props.localScope, scope, $p.$src.id);
				}
				for (const [n, v] of $p.props.descr.attr) {
					if (!await execSetScope($p.$src, n, v, scope)) {
						break;
					}
				}
			}*/


			const $p = $path[i],
				dId = $p[p_descrId];
//??!!				dId = $p[p_descrId] || !preRender($p) || $p[p_descrId];
			if ($p[p_isCmd]) {
//--				const lId = $p[p_localId];
//				if (lId) {
//					scope = getLocalScope(localScope[lId], $p[p_srcId]);
//				}
				for (const [n, v] of descrById.get(dId).attr) {
					if (!await execSetScope($p, n, v, scope)) {
						break;
					}
				}
			}
		}
//--		const lId = $e[p_localId];
//		if (lId) {
//			scope = getLocalScope(localScope[lId], $e[p_srcId]);
//		}
	}
//	if (str) {
//todo !!! console.log(1);
/*
//поидеи нужно делать копию, а то после изменения в кэше останутся изменения - но пока и так работает//todo
//		socpe = ocopy(scope);
		const dId = $e[p_descrId] || preRender($e) && $e[p_descrId];
		if ($e[p_isCmd]) {
			for (const [n, v] of descrById.get(dId).attr) {
				if (n === str || !await execSetScope($e, n, v, scope)) {
					break;
				}
			}
		}*/
//	}
	return scope;
}
async function q_getScope(arr, $top) {
	$top = $top && $top.parentNode || Tpl_$src.parentNode;
//console.error("q_getScope", arr, $top);
	const arrLen = arr.length,
		$arr = new Array(arrLen),
		scope = new Array(arrLen),
		$path = new Array(arrLen);
	for (let i = 0; i < arrLen; i++) {
		$arr[i] = arr[i].$src.parentNode;
	}
//todo parentSrcId???
	for (let $i = arr[0].$src.parentNode; $i !== $top; $i = $i.parentNode) {
		for (let i = 0; i < arrLen; i++) {
			if (scope[i]) {
				continue;
			}
			const $aI = $arr[i],
				s = scopeCache[$aI[p_srcId]];
			if (s) {
				scope[i] = ocopy(s);
			} else if ($path[i]) {
				$path[i].push($aI);
			} else {
				$path[i] = [$aI];
			}
			$arr[i] = $aI.parentNode;
		}
	}
	for (let i = 0; i < arrLen; i++) {
		if (!scope[i]) {
			scope[i] = {};
		}
		if ($path[i]) {
			for (let j = $path[i].length - 1; j > -1; j--) {
				const $p = $path[j];
				if ($p[p_isCmd]) {
//--					const lId = $p[p_localId];
//					if (lId) {
//						scope[i] = getLocalScope(localScope[lId], $p[p_srcId]);
//					}
					for (const [n, v] of descrById.get($p[p_descrId]).attr) {
						if (!await execSetScope($p, n, v, scope[i])) {
							break;
						}
					}
				}
			}
		}
//todo а нужно ли это делать - в кэше же то же самое
//--		const $i = arr[i].$src,
//			lId = $i[p_localId];
//		if (lId) {
//			scope[i] = getLocalScope(localScope[lId], $i[p_srcId]);
//		}
	}
	return scope;
}
export async function q_setScope(arr, arrLen, sync) {
//console.time("q_setScope");
//todo parentSrcId???
	for (let $i = arr[0].$src, $j = arr[1].$src; $i.parentNode; $i = $i.parentNode, $j = $j.parentNode) {
		if ($i.parentNode !== $j.parentNode) {
			continue;
		}


//!!new		const scope = await q_getScope(arr, $i.parentNode);


//		return q_getScope(arr, $i.parentNode)
//			.then(scope => {
//console.log(scope);
				for (let i = 0; i < arrLen; i++) {
//!!new					arr[i].scope = scope[i];
					arr[i].scope = scopeCache[arr[i].$src[p_srcId]];
//todo--
					if (!arr[i].scope) {
console.warn(2222222222);
					}

/*
					const aI = arr[i],
						iId = aI.$src[p_srcId];
					aI.scope = scope[i];
					scopeCache[iId] = ocopy(aI.scope);
					sync.srcIdInRender.add(iId);*/
				}
//			});
//console.timeEnd("q_setScope");
		return;
	}
}
function execSetScope($e, str, expr, scope) {
	const req = type_req($e, str, expr, scope, null, null),
		setF = req.reqCmd.cmd.setScope;
	if (setF) {
		return setF(req);
	}
	return true;
}
/*
//todo parentSrcId
export function createLocalScope(lId, parentSrcId, sId, str) {
//	const lId = getNewLocalId();
	return localScope[lId] = type_localScope(parentSrcId, sId, str);
//	return lId;
}*/
//todo
/*
export function setLocalScope(lId, scope, sId, str) {
	const l = localScope[lId];
	scope[dataVarName] = new Proxy(l[dataVarName], getLocalScopeProxyHandler(sId, str, dataVarName));
	scope[cmdVarName] = new Proxy(l[cmdVarName], getLocalScopeProxyHandler(sId, str, cmdVarName));
}*/
/*
export function getLocalScope(scope, sId, str) {
	return new Proxy(scope, getLocalScopeProxyHandler(sId, str))
}*/
/*
export function setLocalScope(lId, scope, sId, str) {
	const l = localScope[lId] || (localScope[lId] = type_localScope());
	scope[dataVarName] = new Proxy(l[dataVarName], getLocalScopeProxyHandler(sId, str, dataVarName));
	scope[cmdVarName] = new Proxy(l[cmdVarName], getLocalScopeProxyHandler(sId, str, cmdVarName));
//сейчас можно сохранять только data и cmd что не так уж и удобно
}*/
/*
function type_localScope(parentSrcId, sId, str) {
	return {
		parentSrcId,
		sId,
		str,
		scope: new Proxy({}, getLocalScopeProxyHandler(sId, str))
//		[dataVarName]: getProxy({}),
//		[cmdVarName]: getProxy({})
	};
}*/
