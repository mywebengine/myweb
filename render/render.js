import {type_renderRes} from "./algo.js";
import {p_srcId, p_descrId, p_isCmd, dataVarName, cmdVarName, isAsyncAnimationName} from "../config.js";
import {descrById} from "../descr.js";
import {getLocalId} from "../dom.js";
import {getVal} from "../eval2.js";
import {type_req} from "../req.js";
import {getScope, setLocalScope} from "../scope.js";
import {/*addTask, */ocopy} from "../util.js";

export async function renderTag($src, scope, attr, sync) {
//console.log("render", sync.syncId, $src, $src[p_srcId], $src[p_descrId], scope, attr);
	//todo ? ocopy
	scope = ocopy(scope);
	sync.renderScopeBySrcId.set($src[p_srcId], scope);
	const curIsA = sync.isAsyncAnimation,
		isA = await getVal($src, scope, isAsyncAnimationName, false);
	if (isA !== undefined) {
		sync.isAsyncAnimation = isA;
	}
	if (attr && attr.size) {
		const res = await attrRender($src, scope, attr, sync);
		if (!res.isLast) {
			await renderChildren(res.$src, scope, sync);
		}
//console.log(44, res, res.$last || res.$src || $src);
//alert(2);
		return res.$last || res.$src || $src;
	}
	await renderChildren($src, scope, sync);
//console.log(55, $src);
//alert(1);
	sync.isAsyncAnimation = curIsA;
	return $src;
}
async function attrRender($src, scope, attr, sync) {
	let $last;
	for (const [n, v] of attr) {
		const res = await execRender($src, n, v, scope, sync);
		if (!res) {
			continue;
		}
		if (res.attr) {
//todo res.$attr в этой схеме линий - хватит .$src
			const $attr = res.$attr || res.$src || $src,
				$ret = res.$last || res.$src || res.$attr || $src;//поидеи глупо не возвращать $last, так как attr бы не имела смысла
			$src = await renderTag($attr, scope, res.attr, sync);
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
		if (res.$last) {
			$last = res.$last;
		}
		if (res.$src) {
			$src = res.$src;
		}
	}
	return type_renderRes(false, $src, $last);
}
function execRender($src, str, expr, scope, sync) {
	const req = type_req($src, str, expr, scope, sync, false);
	if (req.reqCmd.cmd.render) {
		const lId = getLocalId($src, str);
		if (lId) {
			setLocalScope(lId, scope, $src, str);
		}
		return req.reqCmd.cmd.render(req);
	}
}
async function renderChildren($src, scope, sync) {
//	return addTask(async () => {
		let $i = $src.firstChild;
		if (!$i || descrById.get($src[p_descrId]).isCustomHTML) {
			return;
		}
		while (!$i[p_descrId]) {
			$i = $i.nextSibling;
			if (!$i) {
				return;
			}
		}
		$i = await renderTag($i, scope, descrById.get($i[p_descrId]).attr, sync);
		while ($i = $i.nextSibling) {
//			if ($i.nodeType === 1 && 
			if ($i[p_descrId]) {
				$i = await renderTag($i, scope, descrById.get($i[p_descrId]).attr, sync);
			}
		}
//	}, sync);
}
export async function q_renderTag(arr, attr, sync, isLast, inFragment) {
//console.error("q_render", arr, attr);
	if (!arr[0].scope) {
		await q_setScope(arr);
	}
	for (let i = arr.length - 1; i > -1; i--) {
		sync.renderScopeBySrcId.set(arr[i].$src[p_srcId], arr.scope);
	}
	const curIsA = sync.isAsyncAnimation,
		isA = await getVal(arr[0].$src, arr[0].scope, isAsyncAnimationName, false);
	if (isA !== undefined) {
		sync.isAsyncAnimation = isA;
	}
	if (attr && attr.size) {
		const lastCount = await q_attrRender(arr, attr, sync, isLast, inFragment, type_q_renderCtx());
		if (lastCount === arr.length) {
			return arr;
		}
	}
	return q_renderChildren(arr, sync, isLast, inFragment);
}
async function q_setScope(arr) {
//console.time("q_setScope");
	for (let $i = arr[0].$src, $j = arr[1].$src; $i.parentNode; $i = $i.parentNode, $j = $j.parentNode) {
		if ($i.parentNode !== $j.parentNode) {
			continue;
		}
		const $top = $i.parentNode,
			top = await getScope($top),
			len = arr.length,
			pArr = new Array(len);
		for (let i = 0; i < len; i++) {
			pArr[i] = getScope(arr[i].$src, "", $top, top);
		}
		const scope = await Promise.all(pArr);
		for (let i = 0; i < len; i++) {
			arr[i].scope = scope[i];
		}
//console.timeEnd("q_setScope");
		return;
	}
}
async function q_attrRender(arr, attr, sync, isLast, inFragment, ctx) {
	const len = arr.length;
	for (const [n, v] of attr) {
		const res = await q_execRender(arr, n, v, sync, isLast, inFragment);
		if (!res) {
			continue;
		}
		const pArr = new Array(len);
		for (let i = 0; i < len; i++) {
			pArr[i] = !isLast[i] && res[i];
		}
		const _res = await Promise.all(pArr);
		for (let i = 0; i < len; i++) {
			const resI = _res[i];
			if (!resI) {
				continue;
			}
			if (resI.attr) {
				const arrI = arr[i];
				q_addAfterAttr(resI.$attr || resI.$src || arrI.$src, arrI.scope, resI.attr, ctx);
				arrI.$src = resI.$last || resI.$src || resI.$attr || arrI.$src;
				isLast[i] = true;
				ctx.lastCount++;
				continue;
			}
			if (resI.$last) {
				arr[i].$src = resI.$last;
			}
			if (resI.isLast) {
				isLast[i] = true;
				ctx.lastCount++;
			}
		}
	}
	const pArr = [];
	for (const [dId, byAttr] of ctx.afterByDescrByAttr) {
//		for (const [attrKey, pp] of byAttr) {
		for (const [attrKey, arr] of byAttr) {
//!!
/*
			if (pp.idxs === undefined) {
				pArr.push(q_renderTag(pp.arr, ctx.afterAttrKey[attrKey], sync, type_isLast(), inFragment));
				continue;
			}*/
//			pArr.push(q_renderTag(pp.arr, ctx.afterAttrKey[attrKey], sync, type_isLast(), inFragment));
			pArr.push(q_renderTag(arr, ctx.afterAttrKey[attrKey], sync, type_isLast(), inFragment));
		}
	}
	if (pArr.length) {
		await Promise.all(pArr)
	}
	return ctx.lastCount;
}
//function q_addAfterAttr($src, scope, attr, idx, ctx) {
function q_addAfterAttr($src, scope, attr, ctx) {
	const attrKey = getAttrKey(attr),
		dId = $src[p_descrId],
		byD = ctx.afterByDescrByAttr.get(dId),
		arrI = type_q_arr($src, scope);
	if (!ctx.afterAttrKey[attrKey]) {
		ctx.afterAttrKey[attrKey] = attr;
	}
	if (byD) {
		const arr = byD.get(attrKey);
		if (arr) {
			arr.push(arrI);
//			a.arr.push(arrI);
//			a.idxs.push(idx);
			return;
		}
//		byD.set(attrKey, type_q_afterByDescrByAttr([arrI], [idx]));
		byD.set(attrKey, [arrI]);
		return;
	}
//	ctx.afterByDescrByAttr.set(dId, new Map([[attrKey, type_q_afterByDescrByAttr([arrI], [idx])]]));
	ctx.afterByDescrByAttr.set(dId, new Map([[attrKey, [arrI]]]));
}
/*
function type_q_afterByDescrByAttr(arr, idxs) {
	return {
		arr,
		idxs
	};
}*/
async function q_renderChildren(arr, sync, isLast, inFragment) {
//	return addTask(async () => {
		const iArr = [],
			len = arr.length;
		for (let i = 0; i < len; i++) {
//			if (!isLast[i] && arr[i].$src.nodeType === 1) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end
			if (!isLast[i]) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end ---- Должен быть ЛАСТ
//todo проанализировать еще раз
				iArr.push(ocopy(arr[i]));
			}
		}
		if (iArr.length) {
			await q_renderFlow(iArr, sync, true, inFragment);
		}
		return arr;
//	}, sync);
}
function q_renderFlow(arr, sync, isFirst, inFragment) {
	const byDescr = q_nextGroupByDescr(arr, isFirst);
	if (byDescr.size) {
	        const pArr = [];
		for (const dArr of byDescr.values()) {
			const $i = dArr[0].$src;
//			if ($i.nodeType === 1) {
//!!!как бы так сделать, что бы не идти дальше если рендер говорит что не нужно
				pArr.push(q_renderTag(dArr, $i[p_isCmd] && descrById.get($i[p_descrId]).attr || null, sync, type_isLast(), inFragment)
					.then(() => q_renderFlow(dArr, sync, false, inFragment)));
//			}
		}
		return Promise.all(pArr);
	}
}
function q_nextGroupByDescr(arr, isFirst) {
	const byDescr = new Map(),
		len = arr.length;
	for (let i = 0; i < len; i++) {
		if (arr[i].$src.nodeType !== 1) {
			continue;
		}
		let $src = isFirst && arr[i].$src.firstChild || arr[i].$src.nextSibling;
		while ($src) {
			const dId = $src[p_descrId];
			if (dId) {
				arr[i].$src = $src;
				const byD = byDescr.get(dId);
				if (byD) {
					byD.push(arr[i]);
					break;
				}
				byDescr.set(dId, [arr[i]]);
				break;
			}
			$src = $src.nextSibling;
		}
	}
	return byDescr;
}
function q_execRender(arr, str, expr, sync, isLast, inFragment) {
	const req = type_req(arr[0].$src, str, expr, null, sync, inFragment);
	if (req.$src[p_isCmd]) {
		const lId = getLocalId(req.$src, str);
		if (lId) {
			for (let i = arr.length - 1; i > -1; i--) {
				setLocalScope(lId, arr[i].scope, arr[i].$src, str);
			}
		}
	} else {
//todo как бы это норм, но что-то мне не нравится
		let $l = req.$src,
			lCount = 0;
		do {
			$l = $l.previousSibling;
			lCount++;
		} while (!$l[p_isCmd]);
		if (!$l) {
//todo
console.warn("ret");
alert(111);
		}
		const lId = getLocalId($l, str);
		if (lId) {
			for (let i = arr.length - 1; i > -1; i--) {
				$l = arr[i].$src;
				for (let j = 0; j < lCount; j++) {
					$l = $l.previousSibling;
				}
				setLocalScope(lId, arr[i].scope, $l, str);
			}
		}
	}
	if (req.reqCmd.cmd.q_render) {
		return req.reqCmd.cmd.q_render(req, arr, isLast);
	}
/*
	if (!req.reqCmd.cmd.render) {
		return null;
	}*/
	const len = arr.length,
		res = new Array(len);
	for (let i = 0; i < len; i++) {
		if (!isLast[i]) {
			res[i] = req.reqCmd.cmd.render(type_req(arr[i].$src, str, expr, arr[i].scope, sync, inFragment));
		}
	}
	return res;
}
function getAttrKey(attr) {
	let key = "";
	for (const [n, v] of attr) {
		key += n + ":" + v + ";";
	}
	return key;
}
function type_q_renderCtx() {
	return {
		lastCount: 0,
		afterByDescrByAttr: new Map(),
		afterAttrKey: {}
	};
}
export function type_isLast() {
	return {};
}
export function type_q_arr($src, scope) {
	return {
		$src,
		scope
	};
}
