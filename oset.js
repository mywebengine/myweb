export function oset(t, n, v) {
	const o = t[n];
	if (typeof o !== "object" || o === null || typeof v !== "object" || v === null) {
//		return Reflect.set(t, n, v);
		t[n] = v;
		return true;
	}
	if (Array.isArray(o)) {
		return osetArray(t, n, v);
	}
	if (o instanceof Set) {
		return osetSet(t, n, v);
	}
	if (o instanceof Map) {
		return osetMap(t, n, v);
	}
	return osetObject(t, n, v);
}
function osetArray(t, n, v) {
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
function osetObject(t, n, v) {
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
function osetSet(t, n, v) {
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
function osetMap(t, n, v) {
	const o = t[n];
	if (v instanceof Map) {
		for (const [key, i] of o) {
			if (!v.has(key)) {
				o.delete(key);
			}
		}
		for (const [key, i] of v) {
			const iVal = o.get(key);
			if (typeof iVal === "object") {
				if (Array.isArray(iVal)) {
					iVal.splice(0, iVal.length);
				} else if (iVal instanceof Set || iVal instanceof Map) {
					iVal.clear();
				} else if (iVal !== null) {
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
	if (val instanceof Map) {
		return new Map(val);
	}
	if (val instanceof Set) {
		return new Set(val);
	}
	const c = {};
	for (const key in val) {
		c[key] = copy(val[key]);
	}
	return c;
}*/
