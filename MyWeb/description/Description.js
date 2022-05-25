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


import Cache from "../../cache/Cache.js";
import Config from "../../config/Config.js";
import Cmd from "../cmd/Cmd.js";

//import {setAsOneIdx, getIdx, setIdx} from "../dom/dom.js";
//import {loadingCount} from "../loading/loading.js";

import Descr from "./Descr.js";
import Get$elsByStr from "./Get$elsByStr.js";
import Src from "./Src.js";




import {getProxy} from "./proxy/proxy.js";

export default class Description extends Cmd {
	createSrc($e, descr, asOneIdx, idx) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
		const sId = this.getNewId(),
			isHide = $e.getAttribute(Config.hideName) !== null;
//!!!
		if (descr === undefined) {
//		if (1) {
			descr = this.createDescr($e, sId);
			const src = descr.attr !== null ? new Src(sId, descr, true, isHide, null, null, new Cache(), getProxy({})) : new Src(sId, descr, false, isHide, null, null, null, null);
//if (descr.asOnes !== null && asOneIdx !== undefined) {src.asOneIdx = asOneIdx;}
			my.ctx.$srcById.set(sId, $e);
			my.ctx.srcById.set(sId, src);
			my.ctx.srcBy$src.set($e, src);
//!!если мы сделаем это, то в Инке в препаре будет вызыватьс яэто место и мы потеряем старые асОне
//			if (descr.asOnes !== null) {
//				src.asOneIdx = new Map();
//				src.idx = new Map();
//				for (const str of descr.asOnes) {
//					setAsOneIdx(src, str, this.getNewId());
//					setIdx(src, str, 0);
//				}
//			}
			return src;
		}
		descr.srcIds.add(sId);//пока используется для получения .sId при удалении and prepareParam
		const src = descr.attr !== null ? new Src(sId, descr, true, isHide, asOneIdx, idx, new Cache(), getProxy({})) : new Src(sId, descr, false, isHide, null, null, null, null);
		my.ctx.$srcById.set(sId, $e);
		my.ctx.srcById.set(sId, src);
		my.ctx.srcBy$src.set($e, src);
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
//		moveLoading($e, sId);
		return src;
	}
	createDescr($e, sId) {
		const id = this.getNewId(),
			attr = this.createAttr($e);
		if (attr.size === 0) {
			const descr = new Descr(id, sId, null, null);
			my.ctx.descrById.set(id, descr);
			return descr;
		}
		const descr = new Descr(id, sId, attr, new Set());
		let pos = 0;
		for (const [str, expr] of attr) {
			const rc = my.ctx.reqCmd.get(str);
			if (rc.cmd.get$els !== null) {
				if (descr.get$elsByStr === null) {
					descr.get$elsByStr = new Map([new Get$elsByStr(/*rc.cmd, str, */expr, pos)]);
				} else {
					descr.get$elsByStr.set(str, new Get$elsByStr(/*rc.cmd, str, */expr, pos));
				}
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
		my.ctx.descrById.set(id, descr);
		return descr;
	}
/*
	moveLoading($e, sId) {
		const l = this.ctx.loadingCount.get($e);
		if (l === undefined) {
			return;
		}
		this.ctx.loadingCount.set(sId, l);
		this.ctx.loadingCount.delete($e);
}*/
	//private
	createAttr($e) {
		const attr = new Map(),
			attrs = $e.attributes,
			attrsLen = attrs.length;
		for (let i = 0; i < attrsLen; i++) {
////			const a = attrs.item(i);
			const a = attrs[i];
//todo	for (const a of $e.attributes) {
			if (this.setReqCmd(a.name)) {
				attr.set(a.name, a.value);
			}
		}
		return attr;
	}


	getNewId() {
		return ++this.ctx.idCurVal;
	}
	getSrcId(local, sId) {
		if (this.ctx.srcById.has(sId)) {
			return sId;
		}
		for (let l = local.get(sId); l !== undefined && l.newSrcId !== 0; l = local.get(sId)) {
			sId = l.newSrcId;
		}
		return sId;
	}
	get$els($e, get$elsByStr, str) {
		const attrIt = this.ctx.srcBy$src.get($e).descr.attr.keys();
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
				return this.ctx.reqCmd.get(n).cmd.get$els($e, n, get$e.expr, get$e.pos);
			}
			i = attrIt.next();
		}
		return [$e];
	}
	get$first($e, get$elsByStr, str) {
		const attrIt = this.ctx.srcBy$src.get($e).descr.attr.keys();
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
				return this.ctx.reqCmd.get(str).cmd.get$first($e, str, get$e.expr, get$e.pos);
			}
			i = attrIt.next();
		}
		return $e;
	}
	getNextStr(src, str) {
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
	getAttrAfter(attr, name) {
		const a = new Map(),
			attrIt = this.getAttrItAfter(attr.entries(), name, true);
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			a.set(i.value[0], i.value[1]);
		}
		return a;
	}
	getAttrItAfter(attrIt, name, isValues) {
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
};
