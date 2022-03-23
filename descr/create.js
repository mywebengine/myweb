import {type_cache} from "../cache/type.js";
import {setReqCmd} from "../cmd/cmd.js";
import {incCmdName, hideName} from "../config/config.js";
//import {setAsOneIdx, getIdx, setIdx} from "../dom/dom.js";
//import {loadingCount} from "../loading/loading.js";
import {getNewId} from "./descr.js";
import {type_src, type_descr, type_get$elsByStr, type_get$elsByStrI} from "./type.js";

export function createSrc($e, descr, asOneIdx, idx) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
	const sId = getNewId(),
		isHide = $e.getAttribute(hideName) !== null;
//!!!
	if (descr === undefined) {
//	if (1) {
		descr = createDescr($e, sId);
		const src = descr.attr !== null ? type_src(sId, descr, true, isHide, null, null, type_cache()) : type_src(sId, descr, false, isHide, null, null, null);
//if (descr.asOnes !== null && asOneIdx !== undefined) {src.asOneIdx = asOneIdx;}
		my.env.$srcById.set(sId, $e);
		my.env.srcById.set(sId, src);
		my.env.srcBy$src.set($e, src);
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
	my.env.$srcById.set(sId, $e);
	my.env.srcById.set(sId, src);
	my.env.srcBy$src.set($e, src);
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
		my.env.descrById.set(id, descr);
		return descr;
	}
	const descr = type_descr(id, sId, attr, new Set());
	let pos = 0;
	for (const [str, expr] of attr) {
		const rc = my.env.reqCmd.get(str);
		if (rc.cmd.get$els !== null) {
			if (descr.get$elsByStr === null) {
				descr.get$elsByStr = type_get$elsByStr();
			}
			descr.get$elsByStr.set(str, type_get$elsByStrI(/*rc.cmd, str, */expr, pos));
		}
		pos++;
		if (rc.cmd.isCustomHtml === true && descr.isCustomHtml === false) {
			descr.isCustomHtml = true;
		}
		if (rc.cmd.isAsOne === true) {
			if (descr.asOnes === null) {
				descr.asOnes = new Set();
			}
			descr.asOnes.add(str);
		}
	}
	my.env.descrById.set(id, descr);
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
function createAttr($e) {
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
