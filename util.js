//import {type_animation} from "./render/render.js";
import {isFillingName, isFillingDiv, defRequestInit, defEventInit} from "./config.js";
import {srcBy$src} from "./descr.js";
import {is$hide} from "./dom.js";
import {getUrl} from "./loc.js";
//import {getProxy} from "./proxy.js";

//--todo
//export const spaceRe = /\s+/g;

export function check(res, $src, req, scope, fileName, lineNum, colNum) {
	if (!(res instanceof Error)) {
//todo
console.warn("check", res);
alert(222);
		return;
	}
        let errMsg = ">>>Tpl error";
        if (self.getLineNo !== undefined) {
        	const pos = self.getLineNo($src) || self.getLineNo($src.parentNode);//todo зачем смотреть родителя?
        	if (pos) {
	        	errMsg += ` in ${pos}`;
	        }
        }
	errMsg += `\n${res.toString()}`;
	const params = [];
	params.push(`\n$src =>`, $src, `\nsId =>`, srcBy$src.get($src)?.id);
	if (req) {
		params.push("\nreq =>", req);
	        params.push(`\n${req.str} =>`, req.expr);
	}
	if (scope) {
		params.push("\nscope =>", scope);
	}
	if (self.Tpl_debugLevel !== 0) {
		console.info(errMsg, ...params);
	}
	if (fileName) {
		res = new Error(res, fileName, lineNum, colNum);
	}
	return res;
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
export function ocopy2(val) {
	if (typeof val !== "object" || val === null) {
		return [val, val];
	}
	const c1 = {},
		c2 = {};
	for (const i in val) {
		c1[i] = c2[i] = val[i];
	}
//todo!!	return [getProxy(c1), c2];
	return [getProxy(c1), c1];
}*/
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
export const loadingCount = new Map();
//todo
self.loadingCount = loadingCount;
function type_loading() {
	return new Map([["", 0]]);
}
export async function showLoading($e, testFunc, type = "", waitTime = -1) {
//--	req.sync.animations.add(type_animation(async () => {
		if (await testFunc()) {
console.log(1111);
			decLoading($e, type);
			return;
		}
console.log(222);
		const src = srcBy$src.get($e),
			lKey = src !== undefined ? src.id : $e;
		if (!loadingCount.has(lKey)) {
			loadingCount.set(lKey, type_loading());
		}
		const l = loadingCount.get(lKey);
		if (waitTime < 0) {
			toggleLoading($e, "", true, l);
			toggleLoading($e, type, true, l);
			return;
		}
		toggleLoading($e, "", true, l);
		if (type !== "") {
			setTimeout(async () => {
				if (!await testFunc() && loadingCount.has(lKey)) {
					toggleLoading($e, type, true, l);
				}
			}, waitTime);
		}
//	}, req.sync.local, 0));
}
function decLoading($e, type) {
	const src = srcBy$src.get($e),
		lKey = src !== undefined ? src.id : $e,
		l = loadingCount.get(lKey);
console.log(lKey, l);
	if (l === undefined) {
		return;
	}
	if (type !== "") {
		const v = l.get(type) - 1
		l.set(type, v);
		if (v <= 0) {
			toggleLoading($e, type, false, l);
		}
	}
	const v = l.get("") - 1;
	l.set("", v);
	if (v > 0) {
		return;
	}
	toggleLoading($e, "", false, l);
	for (const [key, count] of loadingCount) {
		for (const [tp, v] of count) {
			if (v > 0) {
				continue;
			}
			if (tp === "") {
				loadingCount.delete(key);
			}
		}
	}
}
function toggleLoading($e, type, f, l) {
//todo
	if (is$hide($e)) {
console.warn(43243242);
alert(1);
		return;
	}
	const lName = type === "" ? isFillingName : isFillingName + isFillingDiv + type;
	if (!f) {
		$e.removeAttribute(lName, "");
		if ($e.nodeName === "TEMPLATE") {
			$e.content.firstChild.removeAttribute(lName, "");
		}
		return;
	}
	if (type === "") {
		const c = l.get("");
		l.set("", c + 1);
	} else {
		const c = l.get(type);
		if (c === undefined) {
			l.set(type, 1);
		} else {
			l.set(type, c + 1);
		}
	}
	$e.setAttribute(lName, "");
	if ($e.nodeName === "TEMPLATE") {
		$e.content.firstChild.setAttribute(lName, "");
	}
}

self.oset = oset;
self.del = del;
self.ocopy = ocopy;
//--self.get$props = get$props;
self.showLoading = showLoading;
self.dispatchEvt = dispatchEvt;
