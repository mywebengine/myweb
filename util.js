import {srcId, cmdPref, isAsyncTask, isAsyncAnimation, defTaskOpt} from "./config.js";
import {eval2} from "./eval2.js";
import {type_req} from "./req.js";

export const spaceRe = /\s+/g;

export const addTask = (() => {
	if (isAsyncTask) {
		return function(f, sync, opt) {
			return new Promise(resolve => {
				requestIdleCallback(() => {
					resolve(f());
				}, opt || defTaskOpt);
			});
/*
			if (!opt.deadline) {
				return sync.tasks.push(requestIdleCallback(f, opt));
			}
			return sync.tasks.push(requestIdleCallback(() => {
				if (Date.now() < o.deadline) {
					f();
				}
			}, opt));*/
		}
	}
	return function(f) {
//		return Promise.resolve(f());
		return f();
	}
})();
export const addAnimation = (() => {
	if (isAsyncAnimation) {
		return function(f) {//, sync) {//, opt) {
			return new Promise(resolve => {
				requestAnimationFrame(() => {
					resolve(f());
				});
			});
//			if (!opt || !opt.deadline) {
//				return sync.animations.push(requestAnimationFrame(f));
//			}
//			return sync.animations.push(requestAnimationFrame(() => {
//				if (Date.now() < opt.deadline) {
//					f();
//				}
//			}));
		}
	}
	return function(f) {
//		return Promise.resolve(f());
		return f();
	}
})();
export function check(res, reqOr$src, scope, fileName, lineNum, colNum) {
	if (!(res instanceof Error)) {
//todo
console.warn("check", res);
alert(222);
		return;
	}
	const $src = reqOr$src.$src || reqOr$src;
        let errMsg = ">>>Tpl error";
        if ($src.getLineNo) {
        	const pos = $src.getLineNo() || $src.parentNode.getLineNo();
        	if (pos) {
	        	errMsg += ` in ${pos}`;
	        }
        }
	errMsg += `\n${res.toString()}`;
	const params = [];
        if (reqOr$src.str) {
	        params.push(`\n${reqOr$src.str} =>`, reqOr$src.expr);
	}
	params.push(`\n$src =>`, $src, `\nsId =>`, $src[srcId]);
	if (reqOr$src.$src) {
		params.push("\nreq =>", reqOr$src);
	}
	if (scope) {
		params.push("\nscope =>", scope);
	}
	console.error(errMsg, ...params);
	if (fileName) {
		res = new Error(res, fileName, lineNum, colNum);
	}
/*
//todo error
	if ($src.dataset) {
		const onError = $src.dataset.onerror;
		if (onError) {
			try {
				new Function("err", onError).call(reqOr$src.$src, res);
			} catch (err) {
				console.error(`>>>Tpl error in onerror handler: ${onError}\n$src =>`, $src);
				return err;
			}
		}
	}*/
//alert(1);
	return res;
}

export function oset(t, n, v) {
	const o = t[n];
	if (typeof o !== "object") {// || Array.isArray(t)) {
		return Reflect.set(t, n, v);
	}
	if (typeof v !== "object" || v === null) {
		const f = Reflect.set(t, n, v);
		if (Array.isArray(o)) {
			o.splice(0, o.length);
			return f;
		}
//		if (o instanceof Set || o instanceof Map) {
//			o.clear();
//			return f;
//		}
		for (const i in o) {
			delete o[i];
		}
		return f;
	}
//	if (typeof o !== "object" || typeof v !== "object" || v === null) {
//		return Reflect.set(t, n, v);
//	}
	if (Array.isArray(o)) {
		return _osetArray(t, n, v);
	}
/*
	if (o instanceof Set) {
		return _osetSet(t, n, v);
	}
	if (o instanceof Map) {
		return _osetMap(t, n, v);
	}*/
	return _osetObject(t, n, v);
}
function _osetObject(t, n, v) {
	const o = t[n];
	for (const i in o) {
		if (!(i in v)) {
			delete o[i];
		}
	}
	for (const i in v) {
		oset(o, i, v[i]);
/*
		if (!oset(o, i, v[i])) {
			console.error("oset", o, i, v[i]);
			return false;
		}*/
	}
	return true;
}
function _osetArray(t, n, v) {
	const o = t[n],
		oLen = o.length;
	if (Array.isArray(v)) {
		const vLen = v.length;
		for (let i = 0; i < oLen && i < vLen; i++) {
//			_oset(o, v, i);
			oset(o, i, v[i]);
/*
			if (!oset(o, i, v[i])) {
				console.error("oset", o, i, v[i]);
				return false;
			}*/
		}
		const l = oLen - vLen;
		if (l > 0) {
			o.splice(vLen, l);
			return true;
		}
		for (let i = oLen; i < vLen; i++) {
			o.push(v[i]);
		}
		return true;
	}
	o.splice(0, oLen);
	return Reflect.set(t, n, v);
}
function _osetSet(t, n, v) {
	const o = t[n];
	if (v instanceof Set) {
		for (const i of o) {
			if (!v.has(i)) {
				o.delete(i);
			}
		}
		for (const i of v) {
//			if (!o.has(i)) {
				o.add(i);
//			}
		}
	}
	o.clear();
	return Reflect.set(t, n, v);
}
function _osetMap(t, n, v) {
	const o = t[n];
	if (v instanceof Map) {
		for (const [key, i] of o) {
			if (!v.has(key)) {
				o.delete(key);
			}
		}
		for (const [key, i] of v) {
			const iVal = o.get(key);
			if (iVal && typeof iVal === "object") {
				//todo wait for Reflection can Set and Map
				if (Array.isArray(iVal)) {
					iVal.splice(0, iVal.length);
				} else if (iVal instanceof Set || iVal instanceof Map) {
					iVal.clear();
				} else {
					for (const j of iVal) {
						delete iVal[j];
					}
				}
			}
			o.set(key, i);
		}
	}
	o.clear();
	return Reflect.set(t, n, v);
}
export function del(obj, prop) {
	const val = obj[prop];
	delete obj[prop];
	return val;
}
export function ocopy(val) {
	if (typeof val !== "object") {
		return val;
	}
	const cpy = {};
	for (const i in val) {
		cpy[i] = val[i];
	}
	return cpy;
}
/*
export function copy(val) {
	if (Array.isArray(val)) {
		return val.slice();
	}
	if (typeof val === "object" && val !== null) {
//		if (val instanceof Map) {
//			return new Map(val);
//		}
//		if (val instanceof Set) {
//			return new Set(val);
//		}
		//return Object.assign({}, val);
		const c = {};
		for (const key in val) {
			c[key] = val[key];
		}
		return c;
	}
	return val;
}*/
export function get$props($body, req) {
	const cmdPrefLen = cmdPref.length,
		t = {
			$body
		},
		pArr = [];
	for (const n in $body.dataset) {
		if (n.indexOf(cmdPref) == 0) {
			if (req) {
				pArr.push(eval2(type_req($body, n, $body.dataset[n], req.scope, req.sync, req.inFragment), $body, true)
					.then(val => type_get$prop(n.substr(cmdPrefLen), val)));
				continue;
			}
			try {
				pArr.push(type_get$prop(n, eval($body.dataset[n])));
			} catch (err) {
				throw check(err, type_req($body, n, $body.dataset[n], req.scope, req.sync, req.inFragment));
			}
		} else {
			t[n] = $body.dataset[n];
		}
	}
	if (!pArr.length) {
		return t;
	}
	return Promise.all(pArr)
		.then(vals => {
			for (const v of vals) {
				t[v.n] = v.val;
			}
			return t;
		});
}
function type_get$prop(n, val) {
	return {
		n,
		val
	};
}
export function kebabToCamelStyle(name) {
	if (!name) {
		return;
	}
	const ns = name.split('-'),
		nLen = ns.length;
	if (nLen > 1) {
		let n = ns[0];
		for (let i = 1; i < nLen; i++) {
			if (ns[i]) {
				n += ns[i][0].toUpperCase() + ns[i].substr(1);
			}
		}
		return n;
	}
	return name;
}

self.oset = oset;
self.del = del;
self.ocopy = ocopy;
self.get$props = get$props;
