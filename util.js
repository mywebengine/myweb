import {defRequestInit, defEventInit} from "./config.js";
import {srcBy$src} from "./descr.js";
import {getUrl} from "./loc.js";
//import {getProxy} from "./proxy.js";

export function check(err, $src, req, scope, fileName, lineNum, colNum) {
        let errMsg = ">>>mw error";
        if (self.mw_getLineNo !== undefined) {
        	const pos = self.mw_getLineNo($src) || self.mw_getLineNo($src.parentNode);//todo зачем смотреть родителя?
        	if (pos) {
	        	errMsg += ` in ${pos}`;
	        }
        }
	errMsg += "\n" + err.toString();
	const params = [];
	params.push("\n$src =>", $src, "\nsId =>", srcBy$src.get($src)?.id);
	if (req) {
		params.push("\nreq =>", req);
	        params.push("\n" + req.str + " =>", req.expr);
	}
	if (scope) {
		params.push("\nscope =>", scope);
	}
	if (self.mw_debugLevel !== 0) {
		console.info(errMsg, ...params);
	}
	return fileName ? new Error(err, fileName, lineNum, colNum) : err;
}
export function getRequest(val, topUrl) {
	if (typeof val === "string") {
		return val !== "" ? new Request(getUrl(val, topUrl), defRequestInit) : null;
	}
	return val instanceof Request || val instanceof Response ? val : null;
}
export function dispatchEvt($src, evtName, detail) {
	const p = {
		detail
	};
	for (const i in defEventInit) {
		p[i] = defEventInit[i];
	}
	$src.dispatchEvent(new CustomEvent(evtName, p));
}
export function kebabToCamelStyle(str) {
	if (!str) {
		return str;
	}
	const words = str.split('-'),
		wordsLen = words.length;
	if (wordsLen == 1) {
		return str;
	}
	str = words[0];
	for (let i = 1; i < wordsLen; i++) {
		if (words[i] !== "") {
			str += words[i][0].toUpperCase() + words[i].substr(1);
		}
	}
	return str;
}
export function oset(t, n, v) {
	const o = t[n];
	if (typeof o !== "object" || o === null || typeof v !== "object" || v === null) {
//		return Reflect.set(t, n, v);
		t[n] = v;
		return true;
	}
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
function _osetArray(t, n, v) {
	if (!Array.isArray(v)) {
//		return Reflect.set(t, n, v);
		t[n] = v;
		return true;
	}
	const o = t[n],
		oLen = o.length,
		vLen = v.length;
	for (let i = 0; i < oLen && i < vLen; i++) {
		oset(o, i, v[i]);
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
function _osetObject(t, n, v) {
	if (typeof v !== "object" || v === null) {
//		return Reflect.set(t, n, v);
		t[n] = v;
		return true;
	}
	const o = t[n];
	for (const i in o) {
		if (!(i in v)) {
			delete o[i];
		}
	}
	for (const i in v) {
		oset(o, i, v[i]);
	}
	return true;
}
/*
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
}*/
export function del(obj, prop) {
	const val = obj[prop];
	delete obj[prop];
	return val;
}
export function ocopy(val) {
//	if (typeof val !== "object" || val === null) {
//		return val;
//	}
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
	if (typeof val !== "object" || val === null) {
		return val;
	}
//	if (val instanceof Map) {
//		return new Map(val);
//	}
//	if (val instanceof Set) {
//		return new Set(val);
//	}
	//return Object.assign({}, val);
	const c = {};
	for (const key in val) {
		c[key] = copy(val[key]);
	}
	return c;
}*/
/*
//todo--
export function get$props($body, req) {
	const cmdPrefLen = cmdPref.length,
		t = {
			$body
		},
		pArr = [];
	for (const n in $body.dataset) {
		const str = n.indexOf(cmdPref) == 0 && n.substr(cmdPrefLen) || n;
		pArr.push(getVal($body, req.scope, str, true)
			.then(val => type_get$prop(str, val)));
	}
	if (pArr.length === 0) {
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
}*/
//API
self.mw_oset = oset;
self.mw_del = del;
//self.mw_ocopy = ocopy;
//--self.get$props = get$props;
self.mw_dispatchEvt = dispatchEvt;
