export default function ocopy(val) {
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
