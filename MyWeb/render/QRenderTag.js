import Config from "../../config/config.js";
import {srcSetScope} from "../../oset/oset.js";

//import {lazyRenderName, mountEventName, renderEventName, defEventInit,
//	p_target, cmdArgsDiv, cmdArgsDivLen} from "../config/config.js";
//import {getAttrAfter} from "../description/descr.js";
//import {srcSetScope} from "../oset/oset.js";
//import {addScrollAnimationsEvent} from "./algo.js";

//import {type_isLast} from "./IsLast.js";
import LocalCounter from "./LocalCounter.js";
import RenderTag from "./RenderTag.js";
import Q_arr from "./Q_arr.js";
import Q_renderCtx from "./Q_renderCtx.js";
import Req from "./Req.js";

export default QRenderTag extends RenderTag {
	q_renderTag(arr, str, isLast, sync) {
//console.log("q_render", arr.map(i => [i.$src, i.scope]), str);
//alert(1);
		if (sync.stat !== 0) {
//			return arr;
			return Promise.resolve(arr);
		}
		const arrLen = arr.length,
		srcBy$src = this.ctx.srcBy$src;
//--		local = new Map(local);
//		for (let i = arrLen - 1; i > -1; i--) {
		for (let i = 0; i < arrLen; i++) {
			const aI = arr[i],
				$i = aI.$src,
				iSrc = srcBy$src.get($i),
				iId = iSrc.id;
			if (!sync.local.has(iId)) {
				sync.local.set(iId, new LocalCounter());
//!!см выше		$i.dispatchEvent(new CustomEvent(renderStartEventName, Config.defEventInit));
//console.log("q_rend - local create", $i);
			}
			aI.scope = aI.scope === null ? iSrc.scopeCache : srcSetScope(iSrc, aI.scope);
//			if (aI.scope !== null) {//todo условия можно оптимизировать
//				aI.scope = srcSetScope(iSrc, aI.scope);
//			}
		}
		const src = srcBy$src.get(arr[0].$src),
			attr = str === "" ? src.descr.attr : this.getAttrAfter(src.descr.attr, str);
		if (attr !== null && attr.size !== 0) {
			return this._q_attrRender(arr, attr, isLast, new Q_renderCtx(), sync)
				.then(lastCount => lastCount === arrLen ? arr : this._q_renderTag(arr, isLast, sync, arrLen));
		}
		return this._q_renderTag(arr, isLast, sync);
	}
	//private
	_q_renderTag(arr, isLast, sync, arrLen) {
		return this._q_renderChildren(arr, isLast, sync)
			.then(() => {
				const srcBy$src = this.ctx.srcBy$src;
				for (let i = 0; i < arrLen; i++) {
					this.testLocalEventsBySrcId(sync.local, srcBy$src.get(arr[i].$src).id);
				}
				return arr;
			});
	}
	//private
	async _q_attrRender(arr, attr, isLast, ctx, sync) {
		const arrLen = arr.length;
		for (const [n, v] of attr) {
			const res = await this._q_execRender(arr, n, v, isLast, sync);
			if (sync.stat !== 0) {
//console.log("isCancel", sync.stat, n, v, 2);
				return ctx.lastCount;
			}
			if (!res) {
				continue;
			}
			for (let i = 0; i < arrLen; i++) {
				if (isLast.has(i)) {
					continue;
				}
				const resI = await res[i];
//				if (!resI) {
				if (resI === null) {
					continue;
				}
				if (resI.attrStr !== "") {
					const arrI = arr[i];
//					this._q_addAfterAttr(resI.$attr || resI.$src || arrI.$src, arrI.scope, resI.attrStr, ctx);
					this._q_addAfterAttr(resI.$attr, arrI.scope, resI.attrStr, ctx);
					arrI.$src = resI.$last || resI.$src || resI.$attr || arrI.$src;
					isLast.add(i);
					ctx.lastCount++;
					continue;
				}
				if (resI.$last !== null) {
					arr[i].$src = resI.$last;
				}
				if (resI.isLast) {
					isLast.add(i);
					ctx.lastCount++;
				}
			}
		}
//todo
//		const pArr = [];
		for (const byAttr of ctx.afterByDescrByAttr.values()) {
			for (const [attrKey, arr] of byAttr) {
//				pArr.push(this.q_renderTag(arr, ctx.strByAttrKey[attrKey], new Set(), sync));
				await this.q_renderTag(arr, ctx.strByAttrKey.get(attrKey), new Set(), sync);
			}
		}
//		if (pArr.length) {
//			await Promise.all(pArr);
//		}
		return ctx.lastCount;
	}
//todo
	//private
	_q_addAfterAttr($src, scope, str, ctx) {
		const attrKey = this._getAttrKey(this.getAttrAfter(this.ctx.srcBy$src.get($src).descr.attr, str)),
			dId = this.ctx.srcBy$src.get($src).descr.id,
			byD = ctx.afterByDescrByAttr.get(dId),
			arrI = new Q_arr($src, scope);
		if (!ctx.strByAttrKey.has(attrKey)) {
			ctx.strByAttrKey.set(attrKey, str);
		}
		if (byD !== undefined) {
			const arr = byD.get(attrKey);
			if (arr) {
				arr.push(arrI);
				return;
			}
			byD.set(attrKey, [arrI]);
			return;
		}
		ctx.afterByDescrByAttr.set(dId, new Map([[attrKey, [arrI]]]));
	}
	//private
	_q_renderChildren(arr, isLast, sync) {
		const $first = arr[0].$src;
		if (sync.stat !== 0 || this.ctx.srcBy$src.get($first).descr.isCustomHtml) {
//console.log(78979, sync.stat, $first);
			return Promise.resolve(arr);
		}
		if (!sync.renderParam.isLazyRender && $first.getAttribute(Config.lazyRenderName) !== null) {
			sync.renderParam.isLazyRender = true;
		}
		const iArr = [],
			arrLen = arr.length,
			isLazyRender = sync.renderParam.isLazyRender;
		for (let i = 0; i < arrLen; i++) {
//			if (!isLast[i] && arr[i].$src.nodeType === 1) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end
			if (isLast.has(i)) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end ---- Должен быть ЛАСТ
				continue;
			}
			const aI = arr[i];
			iArr.push(new Q_arr(aI.$src, aI.scope));
			if (isLazyRender) {
				//todo
				this.addScrollAnimationsEvent(aI.$src);
			}
		}
		if (iArr.length === 0) {
			return arr;
		}
		return this._q_renderFlow(iArr, true, sync)
			.then(() => arr);
	}
	//private
	_q_renderFlow(arr, isFirst, sync) {
		const byDescr = this._q_nextGroupByDescr(arr, isFirst);
//		if (byDescr.size === 0) {
//			return;
//		}
//todo	
		const pSet = new Set();
		for (const dArr of byDescr.values()) {
//			const $i = dArr[0].$src,
//				iSrc = this.ctx.srcBy$src.get($i);
//			pSet.add(this.q_renderTag(dArr, iSrc !== undefined ? iSrc.descr.attr : null, new Set(), sync)
			pSet.add(this.q_renderTag(dArr, "", new Set(), sync)
				.then(() => sync.stat === 0 && this._q_renderFlow(dArr, false, sync)));
//0922
//			await this.q_renderTag(dArr, $i[p_isCmd] && this.ctx.descrById.get($i[p_descrId]).attr || null, new Set(), sync)
//				.then(() => sync.stat === 0 && this._q_renderFlow(dArr, false, sync));


/*
//			if ($i.nodeType === 1) {
//!!!как бы так сделать, что бы не идти дальше если рендер говорит что не нужно
				pSet.add(this.q_renderTag(dArr, $i[p_isCmd] && this.ctx.descrById.get($i[p_descrId]).attr || null, new Set(), sync)
					.then(() => sync.stat === 0 && this._q_renderFlow(dArr, false, sync)
//console.log("isCancel", sync.stat, 222);
					));
//			}*/
		}
		return Promise.all(pSet);
	}
	//private
	_q_nextGroupByDescr(arr, isFirst) {
		const byDescr = new Map(),
			arrLen = arr.length,
			srcBy$src = this.ctx.srcBy$src;
		for (let i = 0; i < arrLen; i++) {
			if (arr[i].$src.nodeType !== 1) {
				continue;
			}
			for (let $i = isFirst ? arr[i].$src.firstChild : arr[i].$src.nextSibling; $i !== null; $i = $i.nextSibling) {
				const iSrc = srcBy$src.get($i);
				if (iSrc === undefined) {
					continue;
				}
				arr[i].$src = $i;
				const dId = iSrc.descr.id,
					byD = byDescr.get(dId);
				if (byD !== undefined) {
					byD.push(arr[i]);
					break;
				}
				byDescr.set(dId, [arr[i]]);
				break;
			}
		}
		return byDescr;
	}
	//private
	_q_execRender(arr, str, expr, isLast, sync) {
		const req = this.createReq(arr[0].$src, str, expr, null, sync);
		if (req.reqCmd.cmd.q_render !== null) {
			return req.reqCmd.cmd.q_render(req, arr, isLast);
		}
/*
		if (req.reqCmd.cmd.render === null) {
			return null;
		}*/
		const arrLen = arr.length,
			res = new Array(arrLen);
		for (let i = 0; i < arrLen; i++) {
			if (!isLast.has(i)) {
//				res[i] = await req.reqCmd.cmd.render(this.createReq(arr[i].$src, str, expr, arr[i].scope, sync));
				res[i] = req.reqCmd.cmd.render(this.createReq(arr[i].$src, str, expr, arr[i].scope, sync));
			}
		}
//		return res;
		return Promise.all(res);
	}
	//private
	_getAttrKey(attr) {
		let key = "";
		for (const [n, v] of attr) {
			key += n + ":" + v + ";";
		}
		return key;
	}
};
