import {q_renderTag, type_req, type_isLast, type_q_arr, type_animation, type_renderRes} from "../render/render.js";
import {mw_doc, p_target, visibleScreenSize, defIdleCallbackOpt, foreachCmdName, renderPackSize} from "../config.js";
import {srcBy$src, $srcById, getNewId, type_asOneIdx, getSrcId, get$els, get$first, getNextStr} from "../descr.js";
import {show, hide, is$visible, removeChild, q_cloneNode, type_q$i, setAsOneIdx, getIdx, setIdx} from "../dom.js";
import {eval2, q_eval2} from "../eval2.js";
import {ocopy} from "../oset.js";
import {kebabToCamelCase} from "../str.js";

//--import {isInc, incGet$els} from "./inc.js";

export default {
	isAsOne: true,
	get$els($src, str, expr, pos) {
//todo , expr, pos
		const $els = foreach_get$els(foreach_get$first($src, str, expr, pos), str, expr, pos),
			$elsLen = $els.length,
			$ret = [];
		for (let i = 0; i < $elsLen; i++) {
			const $iLen = $els[i].length;
			for (let j = 0; j < $iLen; j++) {
				$ret.push($els[i][j]);
			}
		}
		return $ret;
	},
	get$first: foreach_get$first,
//	get$first($src, str, expr, pos) {
//		return foreach_get$first($src, str, expr, pos);
//	},
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => foreach_render(req, val));
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = foreach_render(type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), vals[i]);
					}
				}
				return res;
			});
	}
};
function foreach_render(req, val) {
//console.error("_for", req.sync.syncId, req, req.$src);
//alert(1);
//if (self.a && req.expr === 'game.log') {
//	console.log(req, val);
//	alert(1);
//}
	const src = srcBy$src.get(req.$src);
	if (src.asOneIdx === null) {
		src.asOneIdx = type_asOneIdx();
	}
	if (!src.asOneIdx.has(req.str)) {
		setAsOneIdx(src, req.str, getNewId());
		setIdx(src, req.str, 0);
	}
	const ctx = getCtx(req, val),
		elsLen = ctx.els.length,
		keysLen = ctx.keys.length,
		l = ctx.els[elsLen - 1].$els,
		$last = l[l.length - 1];
	if (keysLen === 0) {
		show$first(req, ctx, hide);
		req.sync.animations.add(type_animation(() => {
			for (let j, i = elsLen - 1; i > 0; i--) {
				const $elsI = ctx.els[i].$els;
				for (j = $elsI.length - 1; j > -1; j--) {
					removeChild($elsI[j]);
				}
			}
		}, req.sync.local, 0));
		return type_renderRes(true, null, $last);
	}
//console.error("for ctx", ctx.els, ctx, req);
//alert(2);
	const res = type_renderRes(true, null, $last);
	if (elsLen === 1) {//todo подумать об этом
		const $e0 = ctx.els[0].$els;
//		if ($e00.nodeName === "TEMPLATE" && $e00.getAttribute(hideName) !== null) {
		for (let $j = $e0[0];; $j = $j.nextSibling) {
//			if ($j.nodeType !== 1) {//впринципе можно и убрать
//				break;
//			}
			const jSrc = srcBy$src.get($j);
			if (jSrc === undefined) {
				continue;
			}
			if (!jSrc.isHide) {
				break;
			}
			show$first(req, ctx, show);
			for (let j = $e0.length - 1; j > -1; j--) {
				$e0[j] = $e0[j].content.firstChild;
			}
			req.sync.afterAnimations.add(type_animation(() => q_forRender(req, ctx, ctx.els, elsLen < keysLen ? () => q_add(req, ctx) : null), req.sync.local, 0));
			return res;
		}
	}
	if (elsLen === keysLen) {
		const p = q_forRender(req, ctx, ctx.els, null);
		return p === undefined ? res : p
			.then(() => res);
	}
	if (elsLen < keysLen) {
		const p = q_forRender(req, ctx, ctx.els, () => q_add(req, ctx));
		return p === undefined ? res : p
			.then(() => res);
	}
	const toRem = new Set();
//	for (let i = elsLen - 1; i >= keysLen; i--) {
//		for (let j = ctx.els[i].length - 1; j > -1; j--) {
	for (let i = keysLen; i < elsLen; i++) {
		const l = ctx.els[i].$els.length,
			$elsI = ctx.els[i].$els;
		for (let j = 0; j < l; j++) {
			toRem.add($elsI[j]);
		}
	}
	ctx.els.splice(keysLen, elsLen - keysLen);
	req.sync.animations.add(type_animation(() => { 
		for (const $i of toRem) {
			removeChild($i);
		}
	}, req.sync.local, 0));
	req.sync.afterAnimations.add(type_animation(() => q_forRender(req, ctx, ctx.els, null), req.sync.local, 0));
	return res;
/*
	const p = q_forRender(req, ctx);
	return p === null ? res : p
		.then(() => {
			req.sync.animations.add(type_animation(() => { 
				for (const $i of toRem) {
					removeChild($i);
				}
			}, req.sync.local, 0));
			return res;
		});*/
}
function getCtx(req, val) {
	const pos = -1,//нужно было бы запускать с нулевого элемента для получения кэша - эта задача режается в функции получения кэша
		$first = foreach_get$first(req.$src, req.str, req.expr, pos),
		$els = foreach_get$els($first, req.str, req.expr, pos),
		valName = kebabToCamelCase(req.reqCmd.args[0]),
		keyName = kebabToCamelCase(req.reqCmd.args[1]);
	if (!val) {
		return type_ctx([], [], $els, valName, keyName);
	}
	if (Array.isArray(val)) {
		const len = val.length,
			keys =new Array(len);
		for (let i = 0; i < len; i++) {
			keys[i] = i;
		}
		return type_ctx(keys, val, $els, valName, keyName);
	}
	if (val instanceof Set || val instanceof Map) {
		const keys = new Array(val.size),
			arr = new Array(val.size);
		let i = 0;
		for (const [k, v] of val.entries()) {
			keys[i] = k;
			arr[i++] = v;
		}
		return type_ctx(keys, arr, $els, valName, keyName);
	}
	const keys = [],
		arr = [];
	for (const key in val) {
		keys.push(key);
		arr.push(val[key]);
	}
	return type_ctx(keys, arr, $els, valName, keyName);
}
function type_ctx(keys, value, $els, valName, keyName) {
	const $elsLen = $els.length,
		els = new Array($elsLen);
	for (let i = 0; i < $elsLen; i++) {
		els[i] = type_q$i($els[i], i);
	}
	return {
		keys,
		value,
		els,
		valName,
		keyName
	};
}
function show$first(req, ctx, showFunc) {
	const first$els = ctx.els[0].$els,
		first$elsLen = first$els.length;
//	for (let j = first$elsLen - 1; j > -1; j--) {
	for (let j = 0; j < first$elsLen; j++) {
		showFunc(req, first$els[j]);
	}
}
function foreach_get$first($first, str, expr, pos) {
	for (let $i = $first; $i !== null; $i = $i.previousSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		if (iSrc.asOneIdx === null) {
			return $first;
		}
		const nStr = getNextStr(iSrc, str),
			asOneIdx = iSrc.asOneIdx.get(str);
		$first = nStr !== "" ? get$first($i, iSrc.descr.get$elsByStr, nStr) : $i;
		for ($i = $first.previousSibling; $i !== null; $i = $i.previousSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(str) !== asOneIdx) {
				return $first;
			}
			if (nStr === "") {
				$first = $i;
				continue;
			}
			$first = $i = get$first($i, iSrc.descr.get$elsByStr, nStr);
		}
		return $first;
	}
	throw new Error("foreach.js");
}
function foreach_get$els($e, str, expr, pos) {
	for (let $i = $e; $i !== null; $i = $i.nextSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		if (iSrc.asOneIdx === null) {//if foreach
			return [[$e]];
		}
		const nStr = getNextStr(iSrc, str),
			asOneIdx = iSrc.asOneIdx.get(str),
			$els = [];
		do {
			if (nStr !== "") {
				const $e = $els[$els.push(get$els($i, iSrc.descr.get$elsByStr, nStr)) - 1];
				$i = $e[$e.length - 1];
			} else {
				$els.push([$i]);
			}
			for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
				const iSrc = srcBy$src.get($i);
				if (iSrc === undefined || !iSrc.isCmd) {
					continue;
				}
				if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(str) !== asOneIdx) {
					return $els;
				}
				break;
			}
		} while ($i !== null);
		return $els;
	}
	throw new Error("foreach.js");
}
function q_add(req, ctx) {
	const elsLen = ctx.els.length,
		keysLen = ctx.keys.length,
		from = ctx.els[elsLen - 1],
		from$elsLen = from.$els.length,
//		from$last = from.$els[from$elsLen - 1],
		idx = elsLen;
	let viewSize = 0,//todo расположение можжет быть и горизонтальным, тогда будем рендерить по одной* штуке
		sId = 0;
	for (let j = 0; j < from$elsLen; j++) {
		const $j = from.$els[j],
			iSrc = srcBy$src.get($j);
		if (sId === 0 && iSrc !== undefined) {
			sId = iSrc.id;
		}
		if ($j.nodeType === 1) {
			viewSize += $j.offsetHeight;
		}
	}
//	if (sId === 0) {
//		throw new Error("foreach.js");
//	}
	const step = viewSize !== 0 ? Math.ceil(document.scrollingElement.clientHeight * visibleScreenSize / viewSize) : renderPackSize;
//	if (is$visible(from$last)) {
	if (is$visible(from.$els[from$elsLen - 1])) {
		req.sync.animations.add(type_animation(() => q_addInsert(req, ctx, getSrcId(req.sync.local, sId), keysLen, idx, step), req.sync.local, 0));//!! нельзя не вставить этот элементи двигасться дальше, так что если даже на момент отрисовки его не будет видно, его всё рано нужно вставить
		return;
	}
	req.sync.afterAnimations.add(type_animation(() => q_addDeferred(req, ctx, sId, keysLen, idx, step), req.sync.local, 0));
}
function q_addDeferred(req, ctx, sId, keysLen, idx, step) {
	return new Promise(ricResolve => {//обязательно нужден проимс
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			req.sync.animations.add(type_animation(() => q_addInsert(req, ctx, getSrcId(req.sync.local, sId), keysLen, idx, step), req.sync.local, sId));
			ricResolve();
		}, defIdleCallbackOpt);
		req.sync.idleCallback.set(ricId, ricResolve);
	});
}
function q_addInsert(req, ctx, sId, keysLen, idx, step) {
	const $fr = mw_doc.createDocumentFragment(),
		newEls = q_addI(req, sId, $fr, keysLen, idx, step),//!!перенесли в аницации, что бы дать возможнасть отрисовать всё перед клонированием
		newElsLen = newEls.length,
//		$last = get$last(req, from$last, idx - 1);
		$last = get$last(req, $srcById.get(sId), idx - 1);
	idx += newElsLen;
	if (idx >= keysLen) {
/*
//todo
if (!$last.parentNode) {
	console.error(req, ctx, sId, keysLen, idx, step, $last);
}*/
		$last.parentNode.insertBefore($fr, $last.nextSibling);
		req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, newEls), req.sync.local, 0));
		return;
	}
	const newElsLast$els = newEls[newElsLen - 1].$els;
	for (let $i = newElsLast$els[newElsLast$els.length - 1]; $i !== null; $i = $i.previousSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {
			continue;
		}
		sId = iSrc.id;
		$last.parentNode.insertBefore($fr, $last.nextSibling);
		req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, newEls)
			.then(() => q_addDeferred(req, ctx, sId, keysLen, idx, step)), req.sync.local, 0));
		return;
	}
	throw new Error("foreach.js");
}
function get$last(req, $last, lastIdx) {
	const asOneIdx = srcBy$src.get($last).asOneIdx.get(req.str),
		$els = get$els($last, srcBy$src.get($last).descr.get$elsByStr, req.str);
	$last = $els[$els.length - 1];
	for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || getIdx(iSrc, req.str) !== lastIdx) {
			return $last;
		}
		const $els = get$els($i, srcBy$src.get($i).descr.get$elsByStr, req.str);
		$last = $els[$els.length - 1];
	}
	return $last;
}
/*
function get$last(req, $last, lastIdx) {
	const asOneIdx = srcBy$src.get($last).asOneIdx.get(req.str);
	for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || getIdx(iSrc, req.str) !== lastIdx) {
			return $last;
		}
		$last = $i;
	}
	return $last;
}*/
function q_addI(req, sId, $fr, keysLen, idx, step) {
	const len = idx + step > keysLen ? keysLen - idx : step,
		newEls = q_cloneNode(req, sId, idx, len),
		$elsILen = newEls[0].$els.length;
	for (let j, i = 0; i < len; i++) {
		const $elsI = newEls[i].$els;
		for (j = 0; j < $elsILen; j++) {
			$fr.appendChild($elsI[j]);
		}
	}
//console.log(222, sId, $new, req.str);
//alert(1);
	return newEls;
}
function q_forRender(req, ctx, els, addF) {
	const nows = [],
		deferreds = [],
		elsLen = els.length;
	if (!req.sync.renderParam.isLinking) {
		for (let i = 0; i < elsLen; i++) {
			const elsI = els[i],
				$elsI = elsI.$els,
				l = $elsI.length;
			let f = false;
			for (let j = 0; j < l; j++) {
				if (is$visible($elsI[j])) {
					f = true;
					break;
				}
			}
			if (f) {
				nows.push(elsI);
			} else {
				deferreds.push(elsI);
			}
		}
	} else {
		for (let i = 0; i < elsLen; i++) {
			nows.push(els[i]);
		}
	}
	if (nows.length !== 0) {
//console.log(1, nows)
		return q_forRenderI(req, ctx, nows)
			.then(() => {
				if (deferreds.length !== 0) {
					req.sync.afterAnimations.add(type_animation(() => q_forRender(req, ctx, deferreds, addF), req.sync.local, 0));
					return;
				}
				if (addF !== null) {
					addF();
				}
			});
	}
//console.log(2, deferreds)
	return new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			q_forRenderI(req, ctx, deferreds.splice(0, renderPackSize))
				.then(() => {
					if (deferreds.length !== 0) {
						return q_forRender(req, ctx, deferreds, addF)
							.then(ricResolve);
					}
					if (addF !== null) {
						addF();
					}
					ricResolve();
				});
		});
		req.sync.idleCallback.set(ricId, ricResolve);
	}, defIdleCallbackOpt);
/*



//console.error(nowsIdxs, deferredsIdxs);
//alert(1);
	if (deferredsIdxs.size !== 0) {
		q_forRenderAddDeferredI(req, ctx, $deferreds, deferredsIdxs, 0, addF);
		if (nowsIdxs.size !== 0) {
			return q_forRenderI(req, ctx, $nows, nowsIdxs);
		}
		return;
	}
	if (nowsIdxs.size === 0) {
		return;
	}
	return q_forRenderI(req, ctx, $nows, nowsIdxs)
		.then(() => {
			if (addF !== null) {
				addF();
			}
		});*/
}
/*
function q_forRenderAddDeferredI(req, ctx, $deferreds, deferredsIdxs, i, addF) {
	req.sync.afterAnimations.add(type_animation(() => new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			const idxs = new Set(),
				s = i,
				$defLen = $deferreds.length;
			let c = 0;
			for (const idx of deferredsIdxs) {
				idxs.add(idx);
				deferredsIdxs.delete(idx);
				i++;
				c++;
				if (c === renderPackSize || i === $defLen) {
					break;
				}
			}
			const isF = i < $defLen;
			q_forRenderI(req, ctx, $deferreds.slice(s, s + c), idxs)
				.then(() => {
					if (!isF && addF !== null) {
						addF();
					}
					ricResolve();
				});
			if (isF) {
				q_forRenderAddDeferredI(req, ctx, $deferreds, deferredsIdxs, i, addF);
			}
		}, defIdleCallbackOpt);
		req.sync.idleCallback.set(ricId, ricResolve);
	}), req.sync.local, 0));
}*/
function q_forRenderI(req, ctx, els) {//!!idxs необходим для разделение на текущие и отложенные рендеры
	const arrLen = els.length,
		arr = new Array(arrLen);
	for (let $i, j, i = 0; i < arrLen; i++) {
//	let $i, j, i = 0;
//	for (const idx of idxs) {
		const elsI = els[i],
			$elsI = elsI.$els,
			$elsILen = $elsI.length;
		$i = $elsI[0];
		if (!srcBy$src.has($i)) {
			j = 1;
			do {
				$i = $elsI[j++];
//todo - так может получиться если удалить элемент, который ренджерится из дом-а
//				if ($i === undefined) {
//					console.warn(22323432, req, ctx, els, j);
//					alert(1)
//				}
			} while (!srcBy$src.has($i));// && j < $elsILen);//!!то что в $elsI может отсутствовать команда - проверено на этапе q_add
		}
//todo не медленно ли это?
		const scopeI = ocopy(req.scope),
			idx = elsI.idx;
		if (ctx.valName) {
			scopeI[ctx.valName] = ctx.value[idx];
		}
		if (ctx.keyName) {
			scopeI[ctx.keyName] = ctx.keys[idx];
		}
		arr[i] = type_q_arr($i, scopeI);
	}
//console.log(555, arr, req.str);
//todo  нужно переносить на стр - атрибуты мешаю рендерить фор->инк (1)
	return q_renderTag(arr, req.str, type_isLast(), req.sync);
}
