import {/*, isWhenVisibleName*//*, renderStartEventName, */mountEventName, renderEventName, defEventInit,
	cmdArgsDiv, cmdArgsDivLen,
		Tpl_cmd, reqCmd} from "../config.js";
import {$srcById, srcBy$src} from "../descr.js";

//export const Tpl_cmd = {};//self.Tpl_cmd || {};
//export const reqCmd = self.Tpl_reqCmd || {};

export function renderTag($src, scope, attr, sync, local) {
	if (sync.stat !== 0) {
//console.log('isCancel', sync.stat, 1);
		return $src;
	}
//console.error("render", sync.syncId, $src, srcBy$src.get($src).id, srcBy$src.get($src).descrId, scope, attr);
//alert(1)
	const src = srcBy$src.get($src),
		sId = src.id;
	if (!local) {
		local = new Map();
	}
//	local = new Map(local);
	if (!local.has(sId)) {
//todo если тег изменится в процессе???? - так то это не страшно - события этого элемента не должны нас возлновать (надо их исключить) а новый будет жить свое жизнью
		local.set(sId, type_localCounter());
//!! проблема в событии на старт в том, что при первом рендере еще ни один on неотрендерился
//		$src.dispatchEvent(new CustomEvent(renderStartEventName, defEventInit));
//console.log("rend - local create", $src);
	}
//todo ? ocopy
//	[scope, scopeCache[sId]] = ocopy2(scope);
	if (scope === null) {
		scope = src.scopeCache;
	} else {
		const s = src.scopeCache,
			ss = s[p_target],
			sss = scope[p_target] || scope;
		for (const i in sss) {
			ss[i] = sss[i];
		}
		scope = s;
	}
/*
	if (attr !== null && attr.size !== 0) {
		return attrRender($src, scope, attr, sync, local)
			.then(res => renderChildren($src, scope, sync, local, sId, res));
	}
	return renderChildren($src, scope, sync, local, sId, null);*/

	if (attr === null || attr.size === 0) {
		return renderChildren($src, scope, sync, local, sId, $src);
	}
	return attrRender($src, scope, attr, sync, local)
		.then(res => {
			if ($src !== res.$src) {
				$src = res.$src;
			}
			const $ret = res.$last === null ? $src : res.$last;
			if (res.isLast) {// || sync.stat !== 0) {
				return $ret;
			}
//todo если мы дошли до сюда - то тег изменился а дети остались теми же - этого не должно быть - должны были ути по isLast
if (srcBy$src.get($src).id !== sId) {
	console.warn(2222222);
}
			return renderChildren($src, scope, sync, local, sId, $ret);
		});
}
async function attrRender($src, scope, attr, sync, local) {
	let $last = null;
	for (const [n, v] of attr) {
		const req = type_req($src, n, v, scope, sync, local),
			res = await req.reqCmd.cmd.render(req);
		if (sync.stat !== 0) {
//console.log('isCancel attrRender', sync.stat, n, v);
			return res || type_renderRes(false, $src, $last);// type_renderRes(res.isLast, res.$src || $src, res.$last || $last);
		}
		if (!res) {
			continue;
		}
		if (res.attr !== null) {
//todo res.$attr в этой схеме линий - хватит .$src
			const $attr = res.$attr || res.$src || $src,
				$ret = res.$last || res.$src || res.$attr || $src;//поидеи глупо не возвращать $last, так как attr бы не имела смысла
			$src = await renderTag($attr, scope, res.attr, sync, local);
			res.isLast = true;
			res.$src = $attr === $ret && $src || $ret;
			res.$last = null;
			res.$attr = null;
			res.attr = null;
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
async function renderChildren($src, scope, sync, local, sId, $ret) {
	if (sync.stat !== 0 || srcBy$src.get($src).descr.isCustomHtml) {
		return $src;
	}
	for (let $i = $src.firstChild; $i !== null; $i = $i.nextSibling) {
//		if ($i.nodeType === 1 && 
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {
			continue;
		}
		$i = await renderTag($i, scope, iSrc.descr.attr, sync, local);
		if (sync.stat !== 0) {
			return;
		}
	}
//	if (sync.stat === 0) {
		testLocalEventsBySrcId(local, sId);
//	}
	return $ret;
}
export function q_renderTag(arr, attr, isLast, sync, local) {
//console.log("q_render", arr.map(i => [i.$src, i.scope]), attr);
//alert(1);
	if (sync.stat !== 0) {
		return arr;
	}
	const arrLen = arr.length;
	if (!local) {
		local = new Map();
	}
//	local = new Map(local);
//	for (let i = arrLen - 1; i > -1; i--) {
	for (let i = 0; i < arrLen; i++) {
		const aI = arr[i],
			$i = aI.$src,
			iSrc = srcBy$src.get($i),
			iId = iSrc.id;
		if (!local.has(iId)) {
			local.set(iId, type_localCounter());
//!!см выше		$i.dispatchEvent(new CustomEvent(renderStartEventName, defEventInit));
//console.log("q_rend - local create", $i);
		}
		if (aI.scope === null) {
			aI.scope = iSrc.scopeCache;
		} else {
			const s = iSrc.scopeCache,
				ss = s[p_target],
				sss = aI.scope[p_target] || aI.scope;
			for (const i in sss) {
				ss[i] = sss[i];
			}
			aI.scope = s;
		}
	}
/*
	const d = descrById.get(arr[0].$src[p_descrId]);
//todo
	if (!d) {
console.warn(11322, arr, attr, arr[0].$src[p_srcId], arr[0].$src[p_descrId], $srcById[arr[0].$src[p_srcId]]);
alert(1);
	}
//!!
//	if (d.isWhenVisible && await getVal(arr[0].$src, arr[0].scope, isWhenVisibleName, false) !== undefined) {
//		sync.isWhenVisible = true;
//	}*/


/*
	if (attr !== null && attr.size !== 0) {
		const lastCount = await q_attrRender(arr, attr, isLast, type_q_renderCtx(), sync, local);
		if (lastCount === arrLen) {
			return arr;
		}
	}
	await q_renderChildren(arr, isLast, sync, local);
	for (let i = 0; i < arrLen; i++) {
		const $i = arr[i].$src,
			iId = $i[p_srcId];
		testLocalEventsBySrcId(local, iId);
	}
	return arr;*/
	if (attr !== null && attr.size !== 0) {
		return q_attrRender(arr, attr, isLast, type_q_renderCtx(), sync, local)
			.then(lastCount => lastCount === arrLen ? arr : _q_renderTag(arr, isLast, sync, local, arrLen));
	}
	return _q_renderTag(arr, isLast, sync, local);
}
function _q_renderTag(arr, isLast, sync, local, arrLen) {
	return q_renderChildren(arr, isLast, sync, local)
		.then(() => {
			for (let i = 0; i < arrLen; i++) {
				testLocalEventsBySrcId(local, srcBy$src.get(arr[i].$src).id);
			}
			return arr;
		});
}
async function q_attrRender(arr, attr, isLast, ctx, sync, local) {
	const arrLen = arr.length;
	for (const [n, v] of attr) {
//console.log(n + v);
//console.time(n + v);
		const res = await q_execRender(arr, n, v, isLast, sync, local);
//console.log(3333, res);
//console.timeEnd(n + v);
		if (sync.stat !== 0) {
//console.log('isCancel', sync.stat, n, v, 2);
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
			if (!resI) {
				continue;
			}
			if (resI.attr !== null) {
				const arrI = arr[i];
				q_addAfterAttr(resI.$attr || resI.$src || arrI.$src, arrI.scope, resI.attr, ctx);
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
	for (const [dId, byAttr] of ctx.afterByDescrByAttr) {
		for (const [attrKey, arr] of byAttr) {
//			pArr.push(q_renderTag(arr, ctx.afterAttrKey[attrKey], type_isLast(), sync, local));
			await q_renderTag(arr, ctx.afterAttrKey.get(attrKey), type_isLast(), sync, local);
		}
	}
//	if (pArr.length) {
//		await Promise.all(pArr);
//	}
	return ctx.lastCount;
}
function q_addAfterAttr($src, scope, attr, ctx) {
	const attrKey = getAttrKey(attr),
		dId = srcBy$src.get($src).descr.id,
		byD = ctx.afterByDescrByAttr.get(dId),
		arrI = type_q_arr($src, scope);
	if (!ctx.afterAttrKey.has(attrKey)) {
		ctx.afterAttrKey.set(attrKey, attr);
	}
	if (byD) {
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
function q_renderChildren(arr, isLast, sync, local) {
	if (sync.stat !== 0 || srcBy$src.get(arr[0].$src).descr.isCustomHtml) {
//console.log(78979, sync.stat, arr[0].$src);
		return Promise.resolve(arr);
	}
	const iArr = [],
		arrLen = arr.length;
	for (let i = 0; i < arrLen; i++) {
//		if (!isLast[i] && arr[i].$src.nodeType === 1) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end
		if (!isLast.has(i)) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end ---- Должен быть ЛАСТ
//todo проанализировать еще раз
//			iArr.push(ocopy(arr[i]));
			const aI = arr[i];
			iArr.push(type_q_arr(aI.$src, aI.scope));
		}
	}
	if (iArr.length === 0) {
		return arr;
	}
	return q_renderFlow(iArr, true, sync, local)
		.then(() => arr);
}
function q_renderFlow(arr, isFirst, sync, local) {
	const byDescr = q_nextGroupByDescr(arr, isFirst);
//	if (byDescr.size === 0) {
//		return;
//	}
//todo	
	const pArr = [];
	for (const dArr of byDescr.values()) {
		const $i = dArr[0].$src,
			iSrc = srcBy$src.get($i);
		pArr.push(q_renderTag(dArr, iSrc !== undefined ? iSrc.descr.attr : null, type_isLast(), sync, local)
			.then(() => sync.stat === 0 && q_renderFlow(dArr, false, sync, local)));
//0922
//		await q_renderTag(dArr, $i[p_isCmd] && descrById.get($i[p_descrId]).attr || null, type_isLast(), sync, local)
//			.then(() => sync.stat === 0 && q_renderFlow(dArr, false, sync, local));


/*
//		if ($i.nodeType === 1) {
//!!!как бы так сделать, что бы не идти дальше если рендер говорит что не нужно
			pArr.push(q_renderTag(dArr, $i[p_isCmd] && descrById.get($i[p_descrId]).attr || null, type_isLast(), sync, local)
				.then(() => sync.stat === 0 && q_renderFlow(dArr, false, sync, local)
//console.log('isCancel', sync.stat, 222);
				));
//		}*/
	}
	return Promise.all(pArr);
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
function q_execRender(arr, str, expr, isLast, sync, local) {
	const req = type_req(arr[0].$src, str, expr, null, sync, local);
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
//			res[i] = await req.reqCmd.cmd.render(type_req(arr[i].$src, str, expr, arr[i].scope, sync, local));
			res[i] = req.reqCmd.cmd.render(type_req(arr[i].$src, str, expr, arr[i].scope, sync, local));
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
	const already = reqCmd[str];
	if (already) {
//	if (already !== undefined && already !== null) {
		return true;
	}
	const i = str.indexOf(cmdArgsDiv),
		cmdName = i === -1 ? str : str.substr(0, i),
		cmd = Tpl_cmd[cmdName];
	if (cmd === undefined) {
		reqCmd[str] = null;
		return false;
	}
	reqCmd[str] = type_reqCmd(cmdName, cmd, i !== -1 ? str.substr(i + cmdArgsDivLen).split(cmdArgsDiv) : []);
	return true;
}
export function dispatchLocalEvents(local) {
//	const r = [];
	for (const [sId, l] of local) {
		if (l.animationsCount === 0) {// && $srcById.has(sId)) {
			dispatchLocalEventsBySrcId(sId, l);
//			r.push(sId, l);
		}
	}
/*
	const rLen = r.length;
	if (rLen === 0) {
		return;
	}
	for (let i = rLen - 1; i > -1; i -= 2) {
		dispatchLocalEventsBySrcId(r[i - 1], r[i]);
	}*/
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
export function type_req($src, str, expr, scope, sync, local) {
	return {
		reqCmd: reqCmd[str],// || null,//<- in createAttr
		$src,
		str,
		expr,
		scope,
		sync,
		local
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
		afterAttrKey:new Map()
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
function type_localCounter() {
	return {
		animationsCount: 0,
		newSrcId: 0
	};
}
export function type_animation(handler, local, viewedSrcId) {
	for (const p of local.values()) {
		p.animationsCount++;
	}
	return type_animation2(() => {
		for (const p of local.values()) {
			if (p.animationsCount > 0) {
				p.animationsCount--;
			}
		}
		return handler();
	}, local, viewedSrcId);
/*
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
		viewedSrcId,

		promise: null,
		resolve: null
	};*/
}
export function type_animation2(handler, local, viewedSrcId) {
	return {
		handler,
		local,
		viewedSrcId,

		promise: null,
		resolve: null
	};
}
export function type_renderRes(isLast, $src = null, $last = null, $attr = null, attr = null) {
	return {
		isLast,
		$src,
		$last,
		$attr,
		attr
	};
}
