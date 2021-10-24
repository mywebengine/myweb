import {/*reqCmd, */setReqCmd} from "./render/render.js";
import {type_cache} from "./cache.js";
import {/*, p_topUrl*//*, orderName, *//*cmdPref, isWhenVisibleName, */reqCmd} from "./config.js";
import {setAsOneIdx, setIdx} from "./dom.js";
import {loadingCount} from "./util.js";

export const $srcById = new Map();
export const srcById = new Map();
export const srcBy$src = new WeakMap();
export const descrById = self.Tpl_descrById || new Map();
export let idCurVal = self.Tpl_idCurVal || 0;

//todo close --
self.$srcById = $srcById;
self.srcById = srcById;
self.srcBy$src = srcBy$src;
self.descrById = descrById;

export function getNewId() {
	return ++idCurVal;
}
export function createSrc($e, descr, asOneIdx, idx/*, topUrl*/) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
	const sId = getNewId();
//!!!
	if (descr === undefined) {
//	if (1) {
		descr = createDescr($e, sId);
		const src = descr.attr !== null ? type_src(sId, descr, true, null, null, type_cache()) : type_src(sId, descr, false, null, null, null);
		$srcById.set(sId, $e);
		srcById.set(sId, src);
		srcBy$src.set($e, src);
//if (descr.asOneSet !== null && asOneIdx !== undefined) {src.asOneIdx = asOneIdx;return src;}
/*
		if (descr.asOneSet !== null) {//!!если мы сделаем это, то в Инке в препаре будет вызыватьс яэто место и мы потеряем старые асОне
			src.asOneIdx = type_asOneIdx();
			src.idx = type_idx();
			for (const str of descr.asOneSet) {
				setAsOneIdx(src, str, getNewId());
				setIdx(src, str, 0);
			}
		}*/
		return src;
	}
	descr.srcIdSet.add(sId);//пока используется для получения .sId при удалении and prepareParam
	const src = descr.attr !== null ? type_src(sId, descr, true, asOneIdx, idx, type_cache()) : type_src(sId, descr, false, null, null, null);
	if (src.isCmd) {
		moveLoading($e, sId);
	}
	$srcById.set(sId, $e);
	srcById.set(sId, src);
	srcBy$src.set($e, src);
//	if (topUrl) {
//		$i[p_topUrl] = topUrl;
//	}
	return src;
}
export function createDescr($e, sId) {
	const id = getNewId(),
		attr = createAttr($e);//,
//		isWhenVisible = !!($e.dataset[isWhenVisibleName] || $e.dataset[cmdPref + isWhenVisibleName]);
	if (attr.size === 0) {
		const descr = type_descr(id, sId, null, null);
		descrById.set(id, descr);
		return descr;
	}
	const descr = type_descr(id, sId, attr, new Set());
	let pos = 0;
	for (const [str, expr] of attr) {
		const rc = reqCmd[str];
		if (rc.cmd.get$els) {
			if (descr.get$elsByStr === null) {
				descr.get$elsByStr = type_get$elsByStr();
			}
			descr.get$elsByStr[str] = type_get$elsByStrI(/*rc.cmd, str, */expr, pos);
		}
		pos++;
		if (rc.cmd.isCustomHtml && descr.isCustomHtml === false) {
			descr.isCustomHtml = true;
		}
		if (rc.cmd.isAsOne) {
			if (descr.asOneSet === null) {
				descr.asOneSet = new Set();
			}
			descr.asOneSet.add(str);
		}
	}
	descrById.set(id, descr);
	return descr;
}
function moveLoading($e, sId) {
	const l = loadingCount.get($e);
	if (l === undefined) {
		return;
	}
	loadingCount.set(sId, l);
	loadingCount.delete($e);
}
function type_src(id, descr, isCmd, asOneIdx, idx, cache) {
	return {
		id,
//		descrId: 0,
		descr,
		isCmd,//: false,
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
export function type_save() {
	return new Map();
}
function type_descr(id, sId, attr, varIdSet) {
	return {
		id,
		sId,
		attr,
		varIdSet,
		srcIdSet: new Set([sId]),
		isCustomHtml: false,
		asOneSet: null,
		get$elsByStr: null
	};
}
function type_get$elsByStr() {
	return {};
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
	const attr = new Map();//,
/*
		order = $e.getAttribute(orderName);
	if (order) {
		const o = order.trim().split(spaceRe),
			oLen = o.length;
		for (let n, i = 0; i < oLen; i++) {
			n = o[i];
			if (setReqCmd(n)) {
				attr.set(n, $e.getAttribute(n));
			}
		}
	}*/
	const attrs = $e.attributes,
		attrsLen = attrs.length;
	for (let i = 0; i < attrsLen; i++) {
////		a = attrs.item(i);
		const a = attrs[i];
////	for (const a of $e.attributes) {
		if (setReqCmd(a.name)) {
//		if (!attr.has(a.name) && setReqCmd(a.name)) {
			attr.set(a.name, a.value);
		}
	}
	return attr;
}
/*--
export function getDescr($e) {
	const dId = $e[p_descrId];
	if (dId) {
		return descrById.get(dId);
	}
}*/
export function get$els($e, get$elsByStr, str) {//!!str = ""
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
			get$e = get$elsByStr[n];
		if (get$e !== undefined) {
//			return get$e.cmd.get$els($e, n, get$e.expr, get$e.pos);
			return reqCmd[n].cmd.get$els($e, n, get$e.expr, get$e.pos);
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
			get$e = get$elsByStr[str];
		if (get$e !== undefined) {
//			return get$e.cmd.get$first($e, str, get$e.expr, get$e.pos);
			return reqCmd[str].cmd.get$first($e, str, get$e.expr, get$e.pos);
		}
		i = attrIt.next();
	}
	return $e;
}
export function getNextStr(src, str) {
//todo есть много вызовов в корых уже вчеслен src
	const attrIt = src.descr.attr.keys();
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		if (i.value === str) {
			i = attrIt.next();
			if (i.done) {
				return "";
			}
			return i.value;
		}
	}
	return "";
}
//!!не используется - удалить
/*
export function getAttr($e) {
	return descrById.get($e[p_descrId]).attr;
//	const dId = $e[p_descrId];
//	if (dId) {
//		return descrById.get(dId).attr;
//	}
//	preRender($e);
//	return getAttr($e);
}*/
/*
export function getAttrBefore(attr, name) {
	const a = new Map();
	for (const [n, v] of attr) {
		if (n === name) {
			break;
		}
		a.set(n, v);
	}
	return a;
}*/
export function getAttrAfter(attr, name) {
	const a = new Map(),
		attrIt = getAttrItAfter(attr.entries(), name, true);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		a.set(i.value[0], i.value[1]);
	}
	return a;
}
export function getAttrItAfter(attrIt, name, isWithKeys) {
	if (name === "") {
		return attrIt;
	}
	if (isWithKeys) {
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
