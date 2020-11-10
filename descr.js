import {cache, type_cache} from "./cache.js";
import {srcId, descrId, isCmd, orderName, onRenderName} from "./config.js";
//import {preRender} from "./dom.js";
import {reqCmd, getReqCmd, type_req} from "./req.js";
import {spaceRe} from "./util.js";

export const $srcById = {};
export const descrById = new Map();

export let idCurVal = 0;
export function getNewId() {
	return ++idCurVal;
}

self.$srcById = $srcById;
self.descrById = descrById;

export function createSrc($e, dId/*, tpl_url*/) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
//!!!!
//if ($e[srcId]) {
//	console.error($e);
//	alert(111);
//}
	const id = $e[srcId] = getNewId();
	$srcById[id] = $e;
//	if (tpl_url) {
//		$i.tpl_url = tpl_url;
//	}
	if (dId) {
		$e[descrId] = dId;
		const d = descrById.get(dId);
		if (d.attr) {//.isCmd && d.attr.size) {
			$e[isCmd] = true;
			d.srcIdSet.add(id);
			cache[id] = type_cache();
		}
		return d;
	}
	return createDescr($e, id);
}
export function createDescr($e, sId) {
	const id = $e[descrId] = getNewId(),
		attr = createAttr($e);
	if (!attr.size) {
		const d = type_descr(null, false, null, null, sId, null, $e.getAttribute(onRenderName));
		descrById.set(id, d);
		return d;
	}
	$e[isCmd] = true;
	const get$elsByStr = type_get$elsByStr();
	let isGet$elsByStr = false,
		isAsOne = false,
		pos = 0;
	cache[sId] = type_cache();
	for (const [str, expr] of attr) {
		const r = reqCmd[str];
		if (r.cmd.get$els) {
			get$elsByStr[str] = type_get$elsByStrI(r.cmd, str, expr, pos);
			isGet$elsByStr = true;
		}
		pos++
		if (r.cmd.isAsOne && !isAsOne) {
			isAsOne = true;
//			continue;
		}
//		isAsOne = true;
//		if (r.args.length === 1) {
//			isValuesOnly = true;
//		}
//!!		break;
	}
	const d = type_descr(attr, isAsOne, new Set(), new Set([sId]), sId, isGet$elsByStr && get$elsByStr || null, $e.getAttribute(onRenderName));
	descrById.set(id, d);
	return d;
}
function type_descr(attr, isAsOne, varIdSet, srcIdSet, sId, get$elsByStr, onRender) {
	return {
//		id,
		attr,
		isAsOne,
//--		isValuesOnly,
		varIdSet,
		srcIdSet,
		sId,
//--		curByStr: {},
		isCustomHTML: false,
		get$elsByStr,
		onRender
	};
}
function type_get$elsByStr() {
	return {};
}
function type_get$elsByStrI(cmd, str, expr, pos) {
	return {
		cmd,
		str,
		expr,
		pos
	};
}
export function createAttr($e) {
	const attr = new Map(),
		order = $e.getAttribute(orderName);
	if (order) {
		const o = order.trim().split(spaceRe),
			oLen = o.length;
		for (let n, i = 0; i < oLen; i++) {
			n = o[i];
			if (getReqCmd(n)) {
				attr.set(n, $e.getAttribute(n));
			}
		}
	}
	const attrs = $e.attributes,
		attrsLen = attrs.length;
	for (let i = 0; i < attrsLen; i++) {
//		a = attrs.item(i);
		const a = attrs[i];
//	for (const a of $e.attributes) {
		if (!attr.has(a.name) && getReqCmd(a.name)) {
			attr.set(a.name, a.value);
		}
	}
	return attr;
}
/*--
export function getDescr($e) {
	const dId = $e[descrId];
	if (dId) {
		return descrById.get(dId);
	}
}*/
export function get$els($e, get$elsByStr, str) {
	if (str) {
		const get$e = get$elsByStr[str];
		if (get$e) {
			return get$e.cmd.get$els($e, str, get$e.expr, get$e.pos);
		}
		return [$e];
	}
	for (const str of descrById.get($e[descrId]).attr.keys()) {
		const get$e = get$elsByStr[str];
		if (get$e) {
			return get$e.cmd.get$els($e, str, get$e.expr, get$e.pos);
		}
	}
	return [$e];
/*
	const attrIt = descrById.get($e[descrId]).attr.entries();
	let i = attrIt.next(),
		pos = 0;
	if (str) {
		for (; !i.done; i = attrIt.next()) {
			if (i.value[0] === str) {
				break;
			}
			pos++;
		}
		if (i.done) {
			return [$e];
		}
	} else if (i.done) {
		return [$e];
	}
	do {
		const [n, v] = i.value,
			get$e = get$elsByStr[n];
		if (get$e) {
			return get$e.get$els($e, n, v, pos);
		}
		pos++;
		i = attrIt.next();
	} while (!i.done);
	return [$e];*/
}
export function get$first($e, get$elsByStr, str) {
	if (str) {
		const get$e = get$elsByStr[str];
		if (get$e) {
			return get$e.cmd.get$first($e, str, get$e.expr, get$e.pos);
		}
		return $e;
	}
	for (const str of descrById.get($e[descrId]).attr.keys()) {
		const get$e = get$elsByStr[str];
		if (get$e) {
			return get$e.cmd.get$first($e, str, get$e.expr, get$e.pos);
		}
	}
	return $e;
}
export function getNextStr($e, str) {
	const attrIt = descrById.get($e[descrId]).attr.keys();
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
	return descrById.get($e[descrId]).attr;
//	const dId = $e[descrId];
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
	if (!name) {
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
