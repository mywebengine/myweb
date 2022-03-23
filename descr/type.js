import {getProxy} from "../proxy/proxy.js";

export function type_src(id, descr, isCmd, isHide, asOneIdx, idx, cache) {
	return {
		id,
//		descrId: 0,
		descr,
		isCmd,//: false,
		isHide,
		asOneIdx,
		idx,
		save: null,
		cache,
		scopeCache: getProxy({}),
		isMounted: false
	};
}
export function type_descr(id, sId, attr, varIds) {
	return {
		id,
		sId,
		attr,
		varIds,
		srcIds: new Set([sId]),
		isCustomHtml: false,
		asOnes: null,
		get$elsByStr: null
	};
}
export function type_get$elsByStr() {
	return new Map();
}
export function type_get$elsByStrI(/*cmd, str, */expr, pos) {
	return {
//		cmd,
//		str,
		expr,
		pos
	};
}
export function type_asOneIdx(idx) {
	return new Map(idx);
}
export function type_idx(idx) {
	return new Map(idx);
}
export function type_save(save) {
	if (save === undefined) {
		return new Map();
	}
	const s = new Map();
	for (const [n, v] of save) {
		s.set(n, type_saveI(v));
	}
	return s;
}
export function type_saveI(save) {
	return new Map(save);
}
