/*
//!!instance
export const $srcById = new Map();
export const srcById = new Map();
export const srcBy$src = new WeakMap();
export const descrById = my.descrById || new Map();
export let idCurVal = my.idCurVal || 0;

self.m$srcById = $srcById;
self.mSrcById = srcById;
self.mSrcBy$src = srcBy$src;
//self.mDescrById = descrById;*/

export function getNewId() {
	return ++my.env.idCurVal;
}
export function getSrcId(local, sId) {
	if (my.env.srcById.has(sId)) {
		return sId;
	}
	for (let l = local.get(sId); l !== undefined && l.newSrcId !== 0; l = local.get(sId)) {
		sId = l.newSrcId;
	}
	return sId;
}
export function get$els($e, get$elsByStr, str) {
	const attrIt = my.env.srcBy$src.get($e).descr.attr.keys();
	let i = attrIt.next();
	if (str !== "") {
		for (; !i.done; i = attrIt.next()) {
			if (i.value === str) {
				break;
			}
		}
	}
	while (!i.done) {
		const n = i.value,
			get$e = get$elsByStr.get(n);
		if (get$e !== undefined) {
			return my.env.reqCmd.get(n).cmd.get$els($e, n, get$e.expr, get$e.pos);
		}
		i = attrIt.next();
	}
	return [$e];
}
export function get$first($e, get$elsByStr, str) {
	const attrIt = my.env.srcBy$src.get($e).descr.attr.keys();
	let i = attrIt.next();
	if (str !== "") {
		for (; !i.done; i = attrIt.next()) {
			if (i.value === str) {
				break;
			}
		}
	}
	while (!i.done) {
		const n = i.value,
			get$e = get$elsByStr.get(str);
		if (get$e !== undefined) {
			return my.env.reqCmd.get(str).cmd.get$first($e, str, get$e.expr, get$e.pos);
		}
		i = attrIt.next();
	}
	return $e;
}
export function getNextStr(src, str) {
//todo есть много вызовов в корых уже вчеслен src
	const attrIt = src.descr.attr.keys();
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		if (i.value !== str) {
			continue;
		}
		i = attrIt.next();
		if (i.done) {
			return "";
		}
		return i.value;
	}
	return "";
}
export function getAttrAfter(attr, name) {
	const a = new Map(),
		attrIt = getAttrItAfter(attr.entries(), name, true);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		a.set(i.value[0], i.value[1]);
	}
	return a;
}
export function getAttrItAfter(attrIt, name, isValues) {
	if (name === "") {
		return attrIt;
	}
	if (isValues) {
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			if (i.value[0] === name) {
				return attrIt;
			}
		}
		return attrIt;
	}
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		if (i.value === name) {
			return attrIt;
		}
	}
	return attrIt;
}
