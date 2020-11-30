import {p_srcId, p_descrId, p_isCmd, p_topURL, orderName} from "./config.js";
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

export function createSrc($e, dId/*, topURL*/) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
//!!!!
//if ($e[p_srcId]) {
//	console.error($e);
//	alert(111);
//}
	const id = $e[p_srcId] = getNewId();
	$srcById[id] = $e;
//	if (topURL) {
//		$i[p_topURL] = topURL;
//	}
	if (dId) {
		$e[p_descrId] = dId;
		const d = descrById.get(dId);
		if (d.attr) {//.p_isCmd && d.attr.size) {
			$e[p_isCmd] = true;
			d.srcIdSet.add(id);//пока используется тоько для почения .sId при удалении
		}
		return d;
	}
	return createDescr($e, id);
}
export function createDescr($e, sId) {
	const id = $e[p_descrId] = getNewId(),
		attr = createAttr($e);
	if (!attr.size) {
		const d = type_descr(null, false, null, null, sId, null);
		descrById.set(id, d);
		return d;
	}
	$e[p_isCmd] = true;
	const get$elsByStr = type_get$elsByStr();
	let isGet$elsByStr = false,
		isAsOne = false,
		pos = 0;
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
	const d = type_descr(attr, isAsOne, new Set(), new Set([sId]), sId, isGet$elsByStr && get$elsByStr || null);
	descrById.set(id, d);
	return d;
}
function type_descr(attr, isAsOne, varIdSet, srcIdSet, sId, get$elsByStr) {
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
		get$elsByStr
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
	const dId = $e[p_descrId];
	if (dId) {
		return descrById.get(dId);
	}
}*/
export function get$els($e, get$elsByStr, str) {
	const attrIt = descrById.get($e[p_descrId]).attr.keys();
	let i = attrIt.next();
	if (str) {
		for (; !i.done; i = attrIt.next()) {
			if (i.value === str) {
				break;
			}
		}
	}
	while (!i.done) {
		const n = i.value,
			get$e = get$elsByStr[n];
		if (get$e) {
			return get$e.cmd.get$els($e, n, get$e.expr, get$e.pos);
		}
		i = attrIt.next();
	}
	return [$e];
}
export function get$first($e, get$elsByStr, str) {
	if (str) {
		const get$e = get$elsByStr[str];
		if (get$e) {
			return get$e.cmd.get$first($e, str, get$e.expr, get$e.pos);
		}
		return $e;
	}
	for (const str of descrById.get($e[p_descrId]).attr.keys()) {
		const get$e = get$elsByStr[str];
		if (get$e) {
			return get$e.cmd.get$first($e, str, get$e.expr, get$e.pos);
		}
	}
	return $e;
}
export function getNextStr($e, str) {
	const attrIt = descrById.get($e[p_descrId]).attr.keys();
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
