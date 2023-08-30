export default function oset(t, n, v) {
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
const osetArray = (t, n, v) => {
	if (!Array.isArray(v)) {
//		return Reflect.set(t, n, v);
		t[n] = v;
		return true;
	}
	const o = t[n],
		oLen = o.length,
		vLen = v.length;
	for (let i = 0; i < oLen && i < vLen; ++i) {
		oset(o, i, v[i]);
	}
	const l = oLen - vLen;
	if (l > 0) {
		o.splice(vLen, l);
		return true;
	}
	for (let i = oLen; i < vLen; ++i) {
		o.push(v[i]);
	}
	return true;
}
const osetObject = (t, n, v) => {
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
const osetSet = (t, n, v) => {
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
const osetMap = (t, n, v) => {
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
