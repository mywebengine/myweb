//import {incCache} from "./cmd/inc.js";
import {setReqCmd} from "./render/render.js";
import {type_cache} from "./cache.js";
import {reqCmd, incCmdName, hideName} from "./config.js";
import {setAsOneIdx, getIdx, setIdx} from "./dom.js";
//import {loadingCount} from "./loading.js";
import {getProxy} from "./proxy.js";

export const $srcById = new Map();
export const srcById = new Map();
export const srcBy$src = new WeakMap();
export const descrById = self.mw_descrById || new Map();
export let idCurVal = self.mw_idCurVal || 0;

self.m$srcById = $srcById;
self.mSrcById = srcById;
self.mSrcBy$src = srcBy$src;
//self.mDescrById = descrById;

export function getNewId() {
	return ++idCurVal;
}
export function createSrc($e, descr, asOneIdx, idx) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
	const sId = getNewId(),
		isHide = $e.getAttribute(hideName) !== null;
//!!!
	if (descr === undefined) {
//	if (1) {
		descr = createDescr($e, sId);
		const src = descr.attr !== null ? type_src(sId, descr, true, isHide, null, null, type_cache()) : type_src(sId, descr, false, isHide, null, null, null);
//if (descr.asOnes !== null && asOneIdx !== undefined) {src.asOneIdx = asOneIdx;}
		$srcById.set(sId, $e);
		srcById.set(sId, src);
		srcBy$src.set($e, src);
//!!если мы сделаем это, то в Инке в препаре будет вызыватьс яэто место и мы потеряем старые асОне
//		if (descr.asOnes !== null) {
//			src.asOneIdx = type_asOneIdx();
//			src.idx = type_idx();
//			for (const str of descr.asOnes) {
//				setAsOneIdx(src, str, getNewId());
//				setIdx(src, str, 0);
//			}
//		}
		return src;
	}
	descr.srcIds.add(sId);//пока используется для получения .sId при удалении and prepareParam
	const src = descr.attr !== null ? type_src(sId, descr, true, isHide, asOneIdx, idx, type_cache()) : type_src(sId, descr, false, isHide, null, null, null);
	$srcById.set(sId, $e);
	srcById.set(sId, src);
	srcBy$src.set($e, src);
	if (!src.isCmd) {
		return src;
	}
/*
	for (const [n, v] of descr.attr) {
		if (n !== incCmdName) {
			continue;
		}
		const incKey = getIdx(src, n);
		if (incKey !== undefined) {
			incCache.get(getIdx(src, n)).counter++;
		}
	}*/
//	moveLoading($e, sId);
	return src;
}
export function createDescr($e, sId) {
	const id = getNewId(),
		attr = createAttr($e);
	if (attr.size === 0) {
		const descr = type_descr(id, sId, null, null);
		descrById.set(id, descr);
		return descr;
	}
	const descr = type_descr(id, sId, attr, new Set());
	let pos = 0;
	for (const [str, expr] of attr) {
		const rc = reqCmd.get(str);
		if (rc.cmd.get$els) {
			if (descr.get$elsByStr === null) {
				descr.get$elsByStr = type_get$elsByStr();
			}
			descr.get$elsByStr.set(str, type_get$elsByStrI(/*rc.cmd, str, */expr, pos));
		}
		pos++;
		if (rc.cmd.isCustomHtml && descr.isCustomHtml === false) {
			descr.isCustomHtml = true;
		}
		if (rc.cmd.isAsOne) {
			if (descr.asOnes === null) {
				descr.asOnes = new Set();
			}
			descr.asOnes.add(str);
		}
	}
	descrById.set(id, descr);
	return descr;
}
/*
function moveLoading($e, sId) {
	const l = loadingCount.get($e);
	if (l === undefined) {
		return;
	}
	loadingCount.set(sId, l);
	loadingCount.delete($e);
}*/
function type_src(id, descr, isCmd, isHide, asOneIdx, idx, cache) {
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
function type_descr(id, sId, attr, varIds) {
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
function type_get$elsByStr() {
	return new Map();
}
function type_get$elsByStrI(/*cmd, str, */expr, pos) {
	return {
//		cmd,
//		str,
		expr,
		pos
	};
}
export function createAttr($e) {
	const attr = new Map(),
		attrs = $e.attributes,
		attrsLen = attrs.length;
	for (let i = 0; i < attrsLen; i++) {
////		const a = attrs.item(i);
		const a = attrs[i];
//todo	for (const a of $e.attributes) {
		if (setReqCmd(a.name)) {
			attr.set(a.name, a.value);
		}
	}
	return attr;
}
export function getSrcId(local, sId) {
	if (srcById.has(sId)) {
		return sId;
	}
	for (let l = local.get(sId); l !== undefined && l.newSrcId !== 0; l = local.get(sId)) {
		sId = l.newSrcId;
	}
	return sId;
}
export function get$els($e, get$elsByStr, str) {
	const attrIt = srcBy$src.get($e).descr.attr.keys();
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
			return reqCmd.get(n).cmd.get$els($e, n, get$e.expr, get$e.pos);
		}
		i = attrIt.next();
	}
	return [$e];
}
export function get$first($e, get$elsByStr, str) {
	const attrIt = srcBy$src.get($e).descr.attr.keys();
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
			return reqCmd.get(str).cmd.get$first($e, str, get$e.expr, get$e.pos);
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
