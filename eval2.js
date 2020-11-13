import {cache, getCacheValue, setCacheValue} from "./cache.js";
import {srcId, descrId, cmdPref} from "./config.js";
import {setCur$src, setIsScoping, proxyStat, setProxyStat, proxySetInSet, setProxySetInSet, addVar} from "./proxy.js";
import {type_req} from "./req.js";
import {check} from "./util.js";

const func = Object.getPrototypeOf(async function(){}).constructor;

const _func = self.Tpl_func || {};
//self._func = _func;

export function eval2(req, ctx, isReactive, isScoping) {


const r = Math.random();
//console.error(r, req.expr, req.$src, req.scope);
	const v = getCacheValue(req, req.$src);
	if (v) {
//console.log(7777, r, req.str, req.expr, req.$src, v);
		return v;
	}
	const func = getEval2Func(req, req.expr);
	setProxyStat(0);
	setIsScoping(isScoping);
	if (isReactive) {
		setCur$src(req.$src);
		const val = callFunc(func, ctx, req, req.scope, req.$src)
			.catch(err => {
				throw check(err, req);
			});
		setCur$src();
		setIsScoping();
		return val;
	}
	const val = callFunc(func, ctx, req, req.scope, req.$src)
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
//console.log(arr[i].$src, arr[i].$src[srcId], cache[arr[i].$src[srcId]], req, arr);
		if (isLast[i]) {
			continue;
		}
/*
		const $i = arr[i].$src,
			sId = $i[srcId],
			c = cache[sId].value;
		if (req.str in c) {
//console.log("cac", sId);
			res[i] = c[req.str];
			continue;
		}*/
		const $i = arr[i].$src,
			v = getCacheValue(req, $i);
		if (v) {
			res[i] = v;
			continue;
		}
		setCur$src($i);
		setProxyStat(0);
		res[i] = callFunc(func, $i, req, arr[i].scope, $i)
			.catch(err => {
				throw check(err, req, arr[i].scope);
			});
	}
	setCur$src();
//!!	setProxyStat(0);//!!кажеться, что не обязательно
	return Promise.all(res);
}
export function getEval2Func(req, expr) {
	const f = _func[expr];
	if (f) {
		return f;
	}
	if (expr = getExpr(expr)) {
		const fBody = "with (tpl_scope) {" + expr + "}";
//console.log(fBody);
		try {
			return _func[expr] = new func("req", "tpl_scope", fBody);
		} catch (err) {
			throw check(err, req);
		}
	}
	return _func[expr] = new func();
}
function callFunc(func, ctx, req, scope, $src) {
	const val = func.apply(ctx, [req, scope]);
	if (proxyStat === 0) {
//!!		setProxyStat(0);//!!кажеться, что не обязательно
//нету гетов		setCacheValue(req, $src, val);
		return val;
	}
	const l = proxySetInSet.length;
	if (l) {
		for (let i = 0; i < l; i++) {
			const p = proxySetInSet[i];
			addVar(p.t, p.n, p.v, p.$src);
//console.log("proxySetInSet", p.t, p.n, p.v, p.$src);
		}
		setProxySetInSet([]);
//!!		setProxyStat(0);//!!кажеться, что не обязательно
	}
	setCacheValue(req, $src, val);
	return val;
}
const _e = ["if", "for", "while", "switch" , "do", "with", "var", "let", "const"];
function getExpr(expr) {
	expr = expr.trim();
	if (expr === "") {
		return;
	}
//todo нужно обарботать ситуацию "... `... return false;`;"
	if (/(^|;|\s)return(\s|;|$)/.test(expr)) {
//	if (expr.startsWith("return")) {
//	if (expr.substr(0, 6) === "return") {
		return expr;
	}
	for (let i = _e.length - 1; i > -1; i--) {
		if (!expr.startsWith(_e[i])) {
			continue;
		}
//		switch (expr.substr(_e[i].length, 1)) {
		switch (expr[_e[i].length]) {
			case " ":
			case "(":
			case "\n":
			case "\t":
			case "\r":
				return expr;
		}
		break;
	}
	return "const _tpl_res = " + expr + "; return _tpl_res;";
}
export function getVal(req, name, ctx, isReactive) {
	const val = req.$src.dataset[name];
	if (val === undefined) {
		return _getVal(req, name, ctx, isReactive);
	}
	return val;
}
export function _getVal(req, name, ctx, isReactive) {
	const str = cmdPref + name,
		expr = req.$src.dataset[str];
	if (expr) {
		return eval2(type_req(req.$src, str, expr, req.scope, req.sync, req.inFragment), ctx, isReactive);
	}
}
