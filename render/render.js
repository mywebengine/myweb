import {lazyRenderName, mountEventName, renderEventName, defEventInit,
	p_target, cmdArgsDiv, cmdArgsDivLen,
		mw_cmd, reqCmd} from "../config.js";
import {srcById, $srcById, srcBy$src, getAttrAfter} from "../descr.js";
import {srcSetScope} from "../oset.js";
import {addScrollAnimationsEvent} from "./algo.js";

//export const mw_cmd = {};//self.mw_cmd || {};
//export const reqCmd = self.mw_reqCmd || {};

export function renderTag($src, scope, str, sync) {
	if (sync.stat !== 0) {
//console.log("isCancel", sync.stat, 1);
		return $src;
	}
//console.error("render", sync.syncId, $src, srcBy$src.get($src).id, srcBy$src.get($src).descrId, scope, str);
//alert(1)
	const src = srcBy$src.get($src),
		sId = src.id;
	if (!sync.local.has(sId)) {
		sync.local.set(sId, type_localCounter());
	}
	//todo со скопом есть проблема: если первый тег уже отрендереной динамической вставки добавляет в скоп что-то своё, то после смены значения - этот скоп будет раскопирован на все новые элементы
	scope = scope === null ? src.scopeCache : srcSetScope(src, scope);
//	if (scope !== null) {
//		scope = srcSetScope(src, scope);
//	}
	const attr = str === "" ? src.descr.attr : getAttrAfter(src.descr.attr, str);
	if (attr === null || attr.size === 0) {
		return renderChildren($src, scope, sync, sId, $src);
	}
	return attrRender($src, scope, attr, sync)
		.then(res => {
			if (sync.stat !== 0) {
				return $src;
			}
			if ($src !== res.$src) {
				$src = res.$src;
			}
			const $ret = res.$last === null ? $src : res.$last;
			if (res.isLast) {// || sync.stat !== 0) {
				return $ret;
			}
//todo если мы дошли до сюда - то тег изменился а дети остались теми же - этого не должно быть - должны были ути по isLast
//			if (sync.stat !== 0) {//srcBy$src.get($src)?.id !== sId) {
//				console.warn(sync.stat, "todo если мы дошли до сюда - то тег изменился а дети остались теми же - этого не должно быть - должны были ути по isLast");
//				return null;
//			}
			return renderChildren($src, scope, sync, sId, $ret);
		});
}
async function attrRender($src, scope, attr, sync) {
	let $last = null;
	for (const [n, v] of attr) {
		const req = type_req($src, n, v, scope, sync),
			res = await req.reqCmd.cmd.render(req);
		if (sync.stat !== 0) {
//console.log("isCancel attrRender", sync.stat, n, v);
			return res || type_renderRes(false, $src, $last);// type_renderRes(res.isLast, res.$src || $src, res.$last || $last);
		}
		if (!res) {
			continue;
		}
		if (res.attrStr !== "") {
//todo res.$attr в этой схеме линий - хватит .$src
//			const $attr = res.$attr,// || res.$src || $src,
//				$ret = res.$last || res.$src || $attr || $src;//поидеи глупо не возвращать $last, так как attr бы не имела смысла
////				$ret = res.$last || res.$src || res.$attr || $src;//поидеи глупо не возвращать $last, так как attr бы не имела смысла
			$src = await renderTag(res.$attr, scope, res.attrStr, sync);
			res.isLast = true;
			res.$src = res.$last;
//			res.$src = res.$attr === $ret ? $src : $ret;
			res.$last = null;
			res.$attr = null;
			res.attrStr = "";
			return res;
		}
		if (res.isLast) {
//			return res;
			return type_renderRes(true, res.$src || $src, res.$last);
		}
		if (res.$last !== null) {
			$last = res.$last;
		}
		if (res.$src !== null) {
			$src = res.$src;
		}
	}
	return type_renderRes(false, $src, $last);
}
async function renderChildren($i, scope, sync, sId, $ret) {
	if (sync.stat !== 0 || srcBy$src.get($i).descr.isCustomHtml) {
		return $i;
	}
	if (!sync.renderParam.isLazyRender && $i.getAttribute(lazyRenderName) !== null) {
		sync.renderParam.isLazyRender = true;
		//todo
		addScrollAnimationsEvent($i);
	}
	for ($i = $i.firstChild; $i !== null; $i = $i.nextSibling) {
//		if ($i.nodeType === 1 && 
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {
			continue;
		}
		$i = await renderTag($i, scope, "", sync);
		if (sync.stat !== 0) {
			return;
		}
	}
//	if (sync.stat === 0) {
		testLocalEventsBySrcId(sync.local, sId);
//	}
	return $ret;
}
export function q_renderTag(arr, str, isLast, sync) {
//console.log("q_render", arr.map(i => [i.$src, i.scope]), str);
//alert(1);
	if (sync.stat !== 0) {
//		return arr;
		return Promise.resolve(arr);
	}
	const arrLen = arr.length;
//--	local = new Map(local);
//	for (let i = arrLen - 1; i > -1; i--) {
	for (let i = 0; i < arrLen; i++) {
		const aI = arr[i],
			$i = aI.$src,
			iSrc = srcBy$src.get($i),
			iId = iSrc.id;
		if (!sync.local.has(iId)) {
			sync.local.set(iId, type_localCounter());
//!!см выше		$i.dispatchEvent(new CustomEvent(renderStartEventName, defEventInit));
//console.log("q_rend - local create", $i);
		}
		aI.scope = aI.scope === null ? iSrc.scopeCache : srcSetScope(iSrc, aI.scope);
//		if (aI.scope !== null) {//todo условия можно оптимизировать
//			aI.scope = srcSetScope(iSrc, aI.scope);
//		}
	}
	const src = srcBy$src.get(arr[0].$src),
		attr = str === "" ? src.descr.attr : getAttrAfter(src.descr.attr, str);
	if (attr !== null && attr.size !== 0) {
		return q_attrRender(arr, attr, isLast, type_q_renderCtx(), sync)
			.then(lastCount => lastCount === arrLen ? arr : _q_renderTag(arr, isLast, sync, arrLen));
	}
	return _q_renderTag(arr, isLast, sync);
}
function _q_renderTag(arr, isLast, sync, arrLen) {
	return q_renderChildren(arr, isLast, sync)
		.then(() => {
			for (let i = 0; i < arrLen; i++) {
				testLocalEventsBySrcId(sync.local, srcBy$src.get(arr[i].$src).id);
			}
			return arr;
		});
}
async function q_attrRender(arr, attr, isLast, ctx, sync) {
	const arrLen = arr.length;
	for (const [n, v] of attr) {
		const res = await q_execRender(arr, n, v, isLast, sync);
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
//			if (!resI) {
			if (resI === null) {
				continue;
			}
			if (resI.attrStr !== "") {
				const arrI = arr[i];
//				q_addAfterAttr(resI.$attr || resI.$src || arrI.$src, arrI.scope, resI.attrStr, ctx);
				q_addAfterAttr(resI.$attr, arrI.scope, resI.attrStr, ctx);
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
//	const pArr = [];
	for (const byAttr of ctx.afterByDescrByAttr.values()) {
		for (const [attrKey, arr] of byAttr) {
//			pArr.push(q_renderTag(arr, ctx.strByAttrKey[attrKey], type_isLast(), sync));
			await q_renderTag(arr, ctx.strByAttrKey.get(attrKey), type_isLast(), sync);
		}
	}
//	if (pArr.length) {
//		await Promise.all(pArr);
//	}
	return ctx.lastCount;
}
//todo
function q_addAfterAttr($src, scope, str, ctx) {
	const attrKey = getAttrKey(getAttrAfter(srcBy$src.get($src).descr.attr, str)),
		dId = srcBy$src.get($src).descr.id,
		byD = ctx.afterByDescrByAttr.get(dId),
		arrI = type_q_arr($src, scope);
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
function q_renderChildren(arr, isLast, sync) {
	const $first = arr[0].$src;
	if (sync.stat !== 0 || srcBy$src.get($first).descr.isCustomHtml) {
//console.log(78979, sync.stat, $first);
		return Promise.resolve(arr);
	}
	if (!sync.renderParam.isLazyRender && $first.getAttribute(lazyRenderName) !== null) {
		sync.renderParam.isLazyRender = true;
	}
	const iArr = [],
		arrLen = arr.length,
		isLazyRender = sync.renderParam.isLazyRender;
	for (let i = 0; i < arrLen; i++) {
//		if (!isLast[i] && arr[i].$src.nodeType === 1) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end
		if (isLast.has(i)) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end ---- Должен быть ЛАСТ
			continue;
		}
		const aI = arr[i];
		iArr.push(type_q_arr(aI.$src, aI.scope));
		if (isLazyRender) {
			//todo
			addScrollAnimationsEvent(aI.$src);
		}
	}
	if (iArr.length === 0) {
		return arr;
	}
	return q_renderFlow(iArr, true, sync)
		.then(() => arr);
}
function q_renderFlow(arr, isFirst, sync) {
	const byDescr = q_nextGroupByDescr(arr, isFirst);
//	if (byDescr.size === 0) {
//		return;
//	}
//todo	
	const pSet = new Set();
	for (const dArr of byDescr.values()) {
//		const $i = dArr[0].$src,
//			iSrc = srcBy$src.get($i);
//		pSet.add(q_renderTag(dArr, iSrc !== undefined ? iSrc.descr.attr : null, type_isLast(), sync)
		pSet.add(q_renderTag(dArr, "", type_isLast(), sync)
			.then(() => sync.stat === 0 && q_renderFlow(dArr, false, sync)));
//0922
//		await q_renderTag(dArr, $i[p_isCmd] && descrById.get($i[p_descrId]).attr || null, type_isLast(), sync)
//			.then(() => sync.stat === 0 && q_renderFlow(dArr, false, sync));


/*
//		if ($i.nodeType === 1) {
//!!!как бы так сделать, что бы не идти дальше если рендер говорит что не нужно
			pSet.add(q_renderTag(dArr, $i[p_isCmd] && descrById.get($i[p_descrId]).attr || null, type_isLast(), sync)
				.then(() => sync.stat === 0 && q_renderFlow(dArr, false, sync)
//console.log("isCancel", sync.stat, 222);
				));
//		}*/
	}
	return Promise.all(pSet);
}
function q_nextGroupByDescr(arr, isFirst) {
	const byDescr = new Map(),
		arrLen = arr.length;
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
function q_execRender(arr, str, expr, isLast, sync) {
	const req = type_req(arr[0].$src, str, expr, null, sync);
	if (req.reqCmd.cmd.q_render) {
		return req.reqCmd.cmd.q_render(req, arr, isLast);
	}
/*
	if (!req.reqCmd.cmd.render) {
		return null;
	}*/
	const arrLen = arr.length,
		res = new Array(arrLen);
	for (let i = 0; i < arrLen; i++) {
		if (!isLast.has(i)) {
//			res[i] = await req.reqCmd.cmd.render(type_req(arr[i].$src, str, expr, arr[i].scope, sync));
			res[i] = req.reqCmd.cmd.render(type_req(arr[i].$src, str, expr, arr[i].scope, sync));
		}
	}
//	return res;
	return Promise.all(res);
}
function getAttrKey(attr) {
	let key = "";
	for (const [n, v] of attr) {
		key += n + ":" + v + ";";
	}
	return key;
}
export function setReqCmd(str) {
	const already = reqCmd.get(str);
//	if (already) {
	if (already !== undefined && already !== null) {
		return true;
	}
	const i = str.indexOf(cmdArgsDiv),
		cmdName = i === -1 ? str : str.substr(0, i),
		cmd = mw_cmd.get(cmdName);
	if (cmd === undefined) {
		reqCmd.set(str, null);
		return false;
	}
	reqCmd.set(str, type_reqCmd(cmdName, cmd, i !== -1 ? str.substr(i + cmdArgsDivLen).split(cmdArgsDiv) : []));
	return true;
}
export function dispatchLocalEvents(local) {
	for (const [sId, l] of local) {
		if (l.animationsCount === 0) {
			dispatchLocalEventsBySrcId(sId, l);
		}
	}
}
function testLocalEventsBySrcId(local, sId) {
	const l = local.get(sId);
	if (l.animationsCount === 0) {
		dispatchLocalEventsBySrcId(sId, l);
	}
}
function dispatchLocalEventsBySrcId(sId, l) {
	const $src = $srcById.get(sId);
	if ($src === undefined) {
		return;
	}
	l.animationsCount = -1;
//todo непонятно это команда или нет - но тут не важно: так кака на тимплэйт события не придут и так
	if ($src.nodeName === "TEMPLATE") {
		return;
	}
//console.log("a-render");//, $src);
//console.log("a-render", $src);
	const src = srcById.get(sId);
	if (!src.isMounted) {
		src.isMounted = true;
		$src.dispatchEvent(new CustomEvent(mountEventName, defEventInit));
	}
	$src.dispatchEvent(new CustomEvent(renderEventName, defEventInit));
}
export function type_req($src, str, expr, scope, sync) {
	return {
		reqCmd: reqCmd.get(str),// || null,//<- in createAttr
		$src,
		str,
		expr,
		scope,
		sync
	};
}
function type_reqCmd(cmdName, cmd, args) {
	return {
		cmdName,
		cmd,
		args
	};
}
function type_q_renderCtx() {
	return {
		lastCount: 0,
		afterByDescrByAttr: new Map(),
		strByAttrKey: new Map()
	};
}
export function type_isLast() {
	return new Set();
}
export function type_q_arr($src, scope) {
	return {
		$src,
		scope
	};
}
export function type_localCounter() {
	return {
		animationsCount: 0,
		newSrcId: 0
	};
}
export function type_animation(handler, local, viewedSrcId) {
	for (const p of local.values()) {
		p.animationsCount++;
	}
	return {
		handler: () => {
			for (const p of local.values()) {
				if (p.animationsCount > 0) {
					p.animationsCount--;
				}
			}
			return handler();
		},
		local,
		viewedSrcId
	};
}
export function type_renderRes(isLast, $src = null, $last = null, $attr = null, attrStr = "") {
	return {
		isLast,
		$src,
		$last,
		$attr,
		attrStr
	};
}
