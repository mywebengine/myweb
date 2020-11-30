import {getCacheValue, setCacheValue} from "./cache.js";
import {p_srcId, cmdPref} from "./config.js";
import {setCur$src, setIsScoping, proxyStat, setProxyStat, proxySetInSet, setProxySetInSet, addVar} from "./proxy.js";
import {type_req} from "./req.js";
import {getScope} from "./scope.js";
import {check} from "./util.js";

const func = Object.getPrototypeOf(async function(){}).constructor;

const _func = self.Tpl_func || {};
//self._func = _func;

export function eval2(req, ctx, isReactive, isScoping) {
	const cVal = getCacheValue(req.$src, req.str);
//const r = Math.random();
	if (cVal) {
//console.log(7777, r, req.str, req.expr, req.$src, cVal.value);
		return cVal.value;
//	} else {
//console.error(6666, r, req.expr, req.$src, req.scope, cVal.value);
	}
	const func = getEval2Func(req, req.expr);
	setProxyStat(0);
	setIsScoping(isScoping);
	if (isReactive) {
		setCur$src(req.$src);
		const val = callFunc(req, func, ctx, req.scope, true)
			.catch(err => {
				throw check(err, req);
			});
		setCur$src();
		setIsScoping();
		return val;
	}
	const val = callFunc(req, func, ctx, req.scope, false)
		.catch(err => {
			throw check(err, req);
		});
	setIsScoping();
	return val;
}
export const q_eval2 = function(req, arr, isLast) {//, isReactive = true) {
	const len = arr.length,
		res = new Array(len),
		func = getEval2Func(req, req.expr);
//console.log("q", req.str, req.expr, arr);
	for (let i = 0; i < len; i++) {
//console.log(arr[i].$src, arr[i].$src[p_srcId], cache[arr[i].$src[p_srcId]], req, arr);
		if (isLast[i]) {
			continue;
		}
/*
		const $i = arr[i].$src,
			sId = $i[p_srcId],
			c = cache[sId].value;
		if (req.str in c) {
//console.log("cac", sId);
			res[i] = c[req.str];
			continue;
		}*/
		const $i = arr[i].$src,
			cVal = getCacheValue($i, req.str);
		if (cVal) {
			res[i] = cVal.value;
			continue;
		}
		setCur$src($i);
		setProxyStat(0);
		res[i] = callFunc(req, func, $i, arr[i].scope, true)
			.catch(err => {
				throw check(err, req, arr[i].scope);
			});
	}
	setCur$src();
//!!	setProxyStat(0);//!!кажеться, что не обязательно
	return Promise.all(res);
}
const _e = ["if", "for", "while", "switch" , "do", "with", "var", "let", "const"];
export function getEval2Func(req, expr) {
	const _f = _func[expr];
	if (_f) {
		return _f;
	}
	expr = expr.trim();
	if (expr === "") {
		return _func[expr] = new func();
	}
	let f = true;


//todo нужно обарботать ситуацию "... `... return false;`;"
	if (/(^|;|\s)return(\s|;|$)/.test(expr)) {
//	if (expr.startsWith("return")) {
//	if (expr.substr(0, 6) === "return") {
		f = false;
	} else {
		for (let i = _e.length - 1; i > -1; i--) {
			if (expr.indexOf(_e[i]) !== 0) {
				continue;
			}
//			switch (expr.substr(_e[i].length, 1)) {
			switch (expr[_e[i].length]) {
				case " ":
				case "(":
				case "\n":
				case "\t":
				case "\r":
					f = false;
				break;
			}
			break;
		}
	}


	if (f) {
		expr = "const _tpl_res = " + expr + "; return _tpl_res;";
	}
	const fBody = "with (tpl_scope) {" + expr + "}";
//console.log(fBody);
	try {
		return _func[expr] = new func("tpl_scope", fBody);
	} catch (err) {
		throw check(err, req);
	}
}
function callFunc(req, func, $src, scope, isReactive) {
	const val = func.apply($src, [scope]);
	if (proxyStat === 0) {
//!!		setProxyStat(0);//!!кажеться, что не обязательно
		return val;
	}
	const l = proxySetInSet.length;
	if (l) {
		for (let i = 0; i < l; i++) {
			const p = proxySetInSet[i];
			addVar(p.t, p.n, p.v, p.$src);
//console.log("proxySetInSet", p.t, p.n, p.v, p.$src, p.$src[p_srcId]);
		}
		setProxySetInSet([]);
//!!		setProxyStat(0);//!!кажеться, что не обязательно
	}
	if (isReactive) {
		setCacheValue($src, req.str, val);
	}
	return val;
}
export async function getVal($src, scope, name, isReactive) {
	const val = $src.dataset[name];
	if (val !== undefined) {
		return val;
	}
//inline	return _getVal($src, scope, name, isReactive);
	const str = cmdPref + name,
		expr = $src.dataset[str];
	if (expr) {
		if (!scope) {
			scope = await getScope($src);
		}
		return eval2(type_req($src, str, expr, scope), $src, isReactive);
	}
}
export async function _getVal($src, scope, name, isReactive) {
	const str = cmdPref + name,
		expr = $src.dataset[str];
	if (expr) {
		if (!scope) {
			scope = await getScope($src);
		}
		return eval2(type_req($src, str, expr, scope), $src, isReactive);
	}
}
