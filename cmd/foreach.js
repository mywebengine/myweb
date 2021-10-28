import {q_renderTag, type_req, type_isLast, type_q_arr, type_animation, type_animation2, type_renderRes} from "../render/render.js";
import {Tpl_doc, p_target, visibleScreenSize, foreachCmdName,
	reqCmd, qPackLength} from "../config.js";
import {getNewId, type_asOneIdx, getAttrAfter, get$els, get$first, getNextStr} from "../descr.js";
import {show, hide, is$visible, removeChild, q_cloneNode, setAsOneIdx, getIdx, setIdx} from "../dom.js";
import {eval2, q_eval2} from "../eval2.js";
import {varIdByVar, varIdByVarIdByProp, setCur$src} from "../proxy.js";
import {ocopy, kebabToCamelStyle, check} from "../util.js";

//--import {isInc, incGet$els} from "./inc.js";

export default {
	isAsOne: true,
	get$els($src, str, expr, pos) {
//todo , expr, pos
		const $els = forGet$els(forGet$first($src, str, expr, pos), str, expr, pos),
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
	get$first: forGet$first,
//	get$first($src, str, expr, pos) {
//		return forGet$first($src, str, expr, pos);
//	},
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => foreachRender(req, val));
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = foreachRender(type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync, req.local), vals[i]);
					}
				}
				return res;
			});
	}
};
function foreachRender(req, val) {
//console.error("_for", req.sync.syncId, req, req.$src);
//alert(1);
	const src = srcBy$src.get(req.$src);
	if (src.asOneIdx === null) {
		src.asOneIdx = type_asOneIdx();
	}
	if (!src.asOneIdx.has(req.str)) {
		setAsOneIdx(src, req.str, getNewId());
		setIdx(src, req.str, 0);
	}
	const ctx = forGetCtx(req, val),
		$elsLen = ctx.$els.length,
		keysLen = ctx.keys.length,
		l = ctx.$els[$elsLen - 1],
		$last = l[l.length - 1];
	if (keysLen === 0) {
		show$first(req, ctx, hide);
		req.sync.animation.add(type_animation(() => {
			for (let j, i = $elsLen - 1; i > 0; i--) {
				for (j = ctx.$els[i].length - 1; j > -1; j--) {
					removeChild(ctx.$els[i][j]);
				}
			}
		}, req.local, 0));
		return type_renderRes(true, null, $last);
	}
//console.error("for ctx", ctx.$els, ctx, req);
//alert(2);
	const res = type_renderRes(true, null, $last);
	if ($elsLen === 1) {//todo подумать об этом
		const $ee = ctx.$els[0];
		//todo а что если это просто тег?
		if ($ee[0].nodeName === "TEMPLATE") {
			const src0 = srcBy$src.get($ee[0]);
			if (src0 !== undefined && src0.isCmd) {//если это был бы inc, то нулевой был бы коммент
				show$first(req, ctx, show);
				for (let j = $ee.length - 1; j > -1; j--) {
					$ee[j] = $ee[j].content.firstChild;
				}
				req.sync.afterAnimation.add(type_animation(() => q_forRender(req, ctx, $elsLen < keysLen ? () => q_add(req, ctx) : null, null), req.local, 0));
				return res;
			}
		}
	}
	if ($elsLen === keysLen) {
		return q_forRender(req, ctx, null, res);
	}
	if ($elsLen < keysLen) {
		return q_forRender(req, ctx, () => q_add(req, ctx), res);
	}
	const toRem = new Set();
//	for (let i = $elsLen - 1; i >= keysLen; i--) {
//		for (let j = ctx.$els[i].length - 1; j > -1; j--) {
	for (let i = keysLen; i < $elsLen; i++) {
		const l = ctx.$els[i].length;
		for (let j = 0; j < l; j++) {
			toRem.add(ctx.$els[i][j]);
		}
	}
	ctx.$els.splice(keysLen, $elsLen - keysLen);
	req.sync.animation.add(type_animation(() => { 
		for (const $i of toRem) {
			removeChild($i);
		}
	}, req.local, 0));
	req.sync.afterAnimation.add(type_animation(() => q_forRender(req, ctx, null, null), req.local, 0));
	return res;
/*
	const p = q_forRender(req, ctx);
	return p === null ? res : p
		.then(() => {
			req.sync.animation.add(type_animation(() => { 
				for (const $i of toRem) {
					removeChild($i);
				}
			}, req.local, 0));
			return res;
		});*/
}
function forGetCtx(req, val) {
	const pos = -1,//нужно было бы запускать с нулевого элемента для получения кэша - эта задача режается в функции получения кэша
		$first = forGet$first(req.$src, req.str, req.expr, pos),
		$els = forGet$els($first, req.str, req.expr, pos);
	if (!val) {
		return getEmptyCtx($first, $els);
	}
	const keys = [];
	if (Array.isArray(val)) {
		const len = val.length;
		for (let i = 0; i < len; i++) {
			keys.push(i);
		}
	} else {
//todo Set and Map?
		for (const key in val) {
			keys.push(key);
		}
	}
	if (keys.length === 0) {
		return getEmptyCtx($first, $els);
	}
	return type_forCtx(val, getAttrAfter(srcBy$src.get(req.$src).descr.attr, req.str), $els, keys, kebabToCamelStyle(req.reqCmd.args[0]), kebabToCamelStyle(req.reqCmd.args[1]));
}
function getEmptyCtx($first, $els) {
	return type_forCtx(null, null, $els, [], "", "");
}
function type_forCtx(value, attrsAfter, $els, keys, valName, keyName) {
	return {
		value,
		attrsAfter,
		$els,
		keys,

		valName,
		keyName
//		isUpDown: true
	};
}
function show$first(req, ctx, showFunc) {
	const $firstLen = ctx.$els[0].length;
	for (let j = $firstLen - 1; j > -1; j--) {
		showFunc(req, ctx.$els[0][j]);
	}
}
function forGet$first($first, str, expr, pos) {
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
	return $first;
}
function forGet$els($e, str, expr, pos) {
	for (let $i = $e; $i !== null; $i = $i.nextSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
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
				if (iSrc.asOneIdx.get(str) !== asOneIdx) {
					return $els;
				}
				break;
			}
		} while ($i !== null);
		return $els;
	}
	return [[$e]];
}
/*
function __q_add(req, ctx, $elsLen, keysLen) {
	const $from = ctx.$els[$elsLen - 1];
	for (let $i = $from[$from.length - 1]; $i !== null; $i = $i.previousSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
//не фапкт что они отренерелись сверху вниз - попорядку!

		let sId = iSrc.id;

		let l = req.local.get(sId);
		if (l !== undefined && l.animationsCount === -1) {
			const $src = $srcById.get(sId),
				src = srcById.get(sId),
				descr = src.descr,
				$from = get$els($src, descr.get$elsByStr, getNextStr(src, req.str));
//todo  нужно переносить на стр - атрибуты мешаю рендерить фор->инк (1)
			ctx.attrsAfter = getAttrAfter(descr.attr, req.str);
			q_addAdd(req, ctx, $elsLen, keysLen, $from);
			return;
		}



		const $p = req.$src.parentNode;
		const f = (evt) => {
console.log(33, req.sync.stat, evt.target)
			if (req.sync.stat !== 0) {
				$p.removeEventListener("render", f);
				return;
			}
//			if (evt.target !== req.$src) {
//				return;
//			}
			let l = req.local.get(sId);
//todo--
			if (l === undefined) {
console.warn(423432423423, evt.target);
alert(1);
//				req.sync.afterAnimation.add(type_animation2(() => q_addWaitingRender(req, ctx, $elsLen, keysLen, sId), req.local, 0));
				return;
			}
			while (l.newSrcId !== 0) {
				sId = l.newSrcId;
				//todo
				if (!$srcById.has(sId)) {
					console.warn(23423423);
					return;
				}
				l = req.local.get(sId);
				if (l === undefined) {
console.warn(423432423423, evt.target);
alert(1);
///					req.sync.afterAnimation.add(type_animation2(() => q_addWaitingRender(req, ctx, $elsLen, keysLen, sId), req.local, 0));
					return;
				}
			}
//todo--
			if (l.animationsCount !== -1) {
console.warn(423432423423, sId, l, evt.target);
//alert(1);
return;
			}
//todo--
			if (!srcById.has(sId)) {
console.warn(423432423423, evt.target);
alert(1);
				return;
			}
console.log(1112, evt.target);
			req.sync.onready.delete(r);
			$p.removeEventListener("render", f);

			const $src = $srcById.get(sId),
				src = srcById.get(sId),
				descr = src.descr,
				$from = get$els($src, descr.get$elsByStr, getNextStr(src, req.str));
//todo  нужно переносить на стр - атрибуты мешаю рендерить фор->инк (1)
			ctx.attrsAfter = getAttrAfter(descr.attr, req.str);
			q_addAdd(req, ctx, $elsLen, keysLen, $from);
//			q_addWaitingRender(req, ctx, $elsLen, keysLen, iSrc.id);
		}
		const r = () => {
			$p.removeEventListener("render", f);
		}
console.log(56555555555555555, req, $i, iSrc.id, req.local);
		$p.addEventListener("render", f);
		req.sync.onready.add(r);
//		req.sync.afterAnimation.add(type_animation2(() => q_addWaitingRender(req, ctx, $elsLen, keysLen, iSrc.id), req.local, 0));
		return;
	}
	throw check(new Error(`>>>Tpl foreach:q_add: элемент затёрт, такого не должно случаться - команда после ${req.str} затёрла его`), req.$src, req);
}
function q_addWaitingRender(req, ctx, $elsLen, keysLen, sId) {
	let l = req.local.get(sId);
console.warn(sId);
//alert(sId)
	if (l === undefined) {
		req.sync.afterAnimation.add(type_animation2(() => q_addWaitingRender(req, ctx, $elsLen, keysLen, sId), req.local, 0));
		return;
	}
	while (l.newSrcId !== 0) {
		sId = l.newSrcId;
//todo
if (!$srcById.has(sId)) {
	console.warn(23423423);
	return;
}
		l = req.local.get(sId);
		if (l === undefined) {
			req.sync.afterAnimation.add(type_animation2(() => q_addWaitingRender(req, ctx, $elsLen, keysLen, sId), req.local, 0));
			return;
		}
	}
	if (l.animationsCount !== -1) {
		req.sync.afterAnimation.add(type_animation2(() => q_addWaitingRender(req, ctx, $elsLen, keysLen, sId), req.local, 0));
		return;
	}
	if (!srcById.has(sId)) {
		return;
	}
	const $src = $srcById.get(sId),
		src = srcById.get(sId),
		descr = src.descr,
		$from = get$els($src, descr.get$elsByStr, getNextStr(src, req.str));
//todo  нужно переносить на стр - атрибуты мешаю рендерить фор->инк (1)
	ctx.attrsAfter = getAttrAfter(descr.attr, req.str);
	q_addAdd(req, ctx, $elsLen, keysLen, $from);
}*/
function q_add(req, ctx) {
	const $elsLen = ctx.$els.length,
		keysLen = ctx.keys.length,
		$from = ctx.$els[$elsLen - 1],
		$fromLen = $from.length,
		$last = $from[$fromLen - 1],
		idx = $elsLen,
		sId = srcBy$src.get(req.$src).id;
//	q_addAdd(req, ctx);
//}
//function q_addAdd(req, ctx, $elsLen, keysLen, $from, sId) {
//	const $fromLen = $from.length,
//		$last = $from[$fromLen - 1],
//		idx = $elsLen;
	let viewSize = 0;
	for (let j = 0; j < $fromLen; j++) {
		viewSize += $from[j].offsetHeight;
	}
	viewSize = Math.ceil(document.scrollingElement.clientHeight * visibleScreenSize / viewSize);//todo расположение можжет быть и горизонтальным, тогда будем рендерить по одной* штуке
	if (is$visible($last)) {
		req.sync.animation.add(type_animation(() => {
			const $fr = Tpl_doc.createDocumentFragment(),
				iIdxSet = new Set(),
//				$new = q_addI(req, $from, $fr, keysLen, idx, viewSize || 100, iIdxSet),//!!перенесли в аницации, что бы дать возможнасть отрисовать всё перед клонированием
				$new = q_addI(req, sId, $fr, keysLen, idx, viewSize || 100, iIdxSet),//!!перенесли в аницации, что бы дать возможнасть отрисовать всё перед клонированием
				$newLen = $new.length,
				nIdx = idx + $newLen;
			let $i = $new[$newLen - 1];
			$i = $i[$i.length - 1];
			$last.parentNode.insertBefore($fr, get$fromLast(req, $last, $elsLen - 1).nextSibling);
			if (nIdx < keysLen) {
				for (; $i !== null; $i = $i.previousSibling) {
					const iSrc = srcBy$src.get($i);
					if (iSrc === undefined) {
						continue;
					}
					req.sync.afterAnimation.add(type_animation(() => q_forRenderI(req, ctx, $new, iIdxSet)
						.then(() => q_addDefered(req, ctx, iSrc.id, keysLen, nIdx, viewSize || 100)), req.local, 0));
						//!!поидеи передать бы ид $new[$newLen - 1] вместо sId
					return;
				}
//				return;
			}
			req.sync.afterAnimation.add(type_animation(() => q_forRenderI(req, ctx, $new, iIdxSet), req.local, 0));
		}, req.local, 0));//!! нельзя не вставить этот элементи двигасться дальше, так что если даже на момент отрисовки его не будет видно, его всё рано нужно вставить
		return;
	}
	if (idx < keysLen) {
		req.sync.afterAnimation.add(type_animation(() => q_addDefered(req, ctx, sId, keysLen, idx, viewSize || 100), req.local, 0));
	}
}
function q_addDefered(req, ctx, sId, keysLen, idx, step) {
console.error(sId, is$visible($srcById.get(sId)));
	return new Promise(ricResolve => {//обязательно нужден проимс
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			req.sync.animation.add(type_animation(() => {
				for (let l = req.local.get(sId); l.newSrcId !== 0; l = req.local.get(sId)) {
					sId = l.newSrcId;
				}
				const $fr = Tpl_doc.createDocumentFragment(),//этот блоек не в анимации, что бы не тормозить в raf-е
					iIdxSet = new Set(),
					$new = q_addI(req, sId, $fr, keysLen, idx, step, iIdxSet),
					$newLen = $new.length,
					$last = get$fromLast(req, $srcById.get(sId), idx - 1);
				let $i = $new[$newLen - 1];
				$i = $i[$i.length - 1];
				$last.parentNode.insertBefore($fr, $last.nextSibling);
				req.sync.afterAnimation.add(type_animation(() => q_forRenderI(req, ctx, $new, iIdxSet)
					.then(() => {
						idx += $newLen;
						if (idx < keysLen) {
							for (; $i !== null; $i = $i.previousSibling) {
								const iSrc = srcBy$src.get($i);
								if (iSrc === undefined) {
									continue;
								}
								req.sync.afterAnimation.add(type_animation(() => q_addDefered(req, ctx, iSrc.id, keysLen, idx, step), req.local, 0));
								//!!поидеи передать бы ид $new[$newLen - 1] вместо sId
								return;
							}
						}
					}), req.local, 0));
//			}, req.local, $from[$fromLen - 1][p_srcId]));//!!если передаь элемент для скрола, то получается штука: если прокручиваем быстро то можем (вставилось много, но неотрендерелось еще, мы прокрутим на конеч вставки и получим что первые теги взтавки $from[$fromLen - 1][p_srcId] не видны - добавиться скролл анимация - а в ней дальнейшая вставка блоков - и на этом рендер оставнавливается, пока не докрутим до неё)// - да, и такая логика рендера неестественна - на сервере всё равно все будет отрендерено
//			}, req.local, 0));
			}, req.local, sId));
			ricResolve();
		}, {
			timeout: 1000
		});
		req.sync.idleCallback.set(ricId, ricResolve);
	});
}
function get$fromLast(req, $from, $fromIdx) {
//	const asOneIdx = srcBy$src.get($from).asOneIdx.get(req.str);
	for (let $i = $from.nextSibling; $i !== null; $i = $i.nextSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
//		if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || getIdx(iSrc, req.str) !== $fromIdx) {
		if (iSrc.asOneIdx === null || getIdx(iSrc, req.str) > $fromIdx) {
			return $from;
		}
		$from = $i;
	}
	return $from;
}
/*
function prepare$from($from, $fromLen) {
	for (let i = $fromLen - 1; i > -1; i--) {
		if ($from[i].parentNode === null) {//если на предыдущей команде был удалён
			continue;
		}
		const j = i + 1;
		if (j !== $fromLen) {
			$from.splice(j, $fromLen - i);
			return j;
		}
		return $fromLen;
	}
	return $fromLen;
}
function get$fromLast(req, $fromLast, $fromIdx) {
	for (let $i = $fromLast; $i !== null; $i = $i.previousSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		const asOneIdx = iSrc.asOneIdx.get(req.str);
		for ($i = $fromLast.nextSibling; $i !== null; $i = $i.nextSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || getIdx(iSrc, req.str) !== $fromIdx) {
				return $fromLast;
			}
			$fromLast = $i;
		}
		return $fromLast;
	}
	throw check(new Error(`>>>Tpl foreach:get$fromLast: элемент цикла стёрт, такого не должно случаться - команда поле ${req.str} затёрла его`), req.$src, req);
}*/
//function q_addI(req, $from, $fr, keysLen, idx, step, idxSet) {
function q_addI(req, sId, $fr, keysLen, idx, step, idxSet) {
	const len = idx + step > keysLen ? keysLen - idx : step,
//		$new = q_cloneNode(req, $from, idx, len),
		$new = q_cloneNode(req, sId, idx, len),
		$iNewLen = $new[0].length;
	for (let j, i = 0; i < len; i++, idx++) {
		for (j = 0; j < $iNewLen; j++) {
			$fr.appendChild($new[i][j]);
		}
		idxSet.add(idx);
	}
//console.log(222, $from, $new, iIdxSet, req.str);
//alert(1);
	return $new;
}
function q_forRender(req, ctx, addF, res) {
	const $now = [],
		$deferred = [],
		nowIdxSet = new Set(),
		deferredIdxSet = new Set(),
		$elsLen = ctx.$els.length;
	if (req.sync.p.renderParam.isLinking === false) {
		for (let i = 0; i < $elsLen; i++) {
			const l = ctx.$els[i].length;
			let f = false;
			for (let j = 0; j < l; j++) {
				const $i = ctx.$els[i][j];
				if (is$visible($i)) {
					f = true;
					break;
				}
			}
			if (f) {
				$now.push(ctx.$els[i]);
				nowIdxSet.add(i);
			} else {
				$deferred.push(ctx.$els[i]);
				deferredIdxSet.add(i);
			}
		}
	} else {
		for (let i = 0; i < $elsLen; i++) {
			$now.push(ctx.$els[i]);
			nowIdxSet.add(i);
		}
	}
//console.error(nowIdxSet, deferredIdxSet);
//alert(1);
	if (deferredIdxSet.size !== 0) {
		q_forRenderAddDeferedI(req, ctx, $deferred, deferredIdxSet, 0, addF);
		return nowIdxSet.size !== 0 ? q_forRenderI(req, ctx, $now, nowIdxSet)
			.then(() => res) : res;
	}
	return nowIdxSet.size !== 0 ? q_forRenderI(req, ctx, $now, nowIdxSet)
		.then(() => {
			if (addF !== null) {
				addF();
			}
			return res;
		}) : res;
}
function q_forRenderAddDeferedI(req, ctx, $deferred, deferredIdxSet, i, addF) {
	req.sync.afterAnimation.add(type_animation(() => new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			const idxSet = new Set(),
				s = i,
				$defLen = $deferred.length;
			let c = 0;
			for (const idx of deferredIdxSet) {
				idxSet.add(idx);
				deferredIdxSet.delete(idx);
				i++;
				c++;
				if (c === qPackLength || i === $defLen) {
					break;
				}
			}
			const isF = i < $defLen;
			q_forRenderI(req, ctx, $deferred.slice(s, s + c), idxSet)
				.then(() => {
					if (!isF && addF !== null) {
						addF();
					}
					ricResolve();
				});
			if (isF) {
				q_forRenderAddDeferedI(req, ctx, $deferred, deferredIdxSet, i, addF);
			}
		}, {
			timeout: 1000
		});
		req.sync.idleCallback.set(ricId, ricResolve);
	}), req.local, 0));
}
function q_forRenderI(req, ctx, $els, idxSet) {//!!idxSet необходим для разделение на текущие и отложенные рендеры
	const arr = new Array(idxSet.size);
	let $i, j, i = 0;
	for (const idx of idxSet) {
		const $elsI = $els[i],
			$elsILen = $elsI.length;
		$i = $elsI[0];
		if (!srcBy$src.has($i)) {
			j = 1;
			do {
				$i = $elsI[j++];
			} while (!srcBy$src.has($i));// && j < $elsILen);//!!то что в $elsI может отсутствовать команда - проверено на этапе q_add
		}
//todo не медленно ли это?
		const scopeI = ocopy(req.scope),
			aI = arr[i] = type_q_arr($i, scopeI);
		if (ctx.valName) {
			scopeI[ctx.valName] = ctx.value[ctx.keys[idx]];
		}
		if (ctx.keyName) {
			scopeI[ctx.keyName] = ctx.keys[idx];
		}
		i++;
	}
//console.log(555, arr, ctx.attrsAfter);
//todo  нужно переносить на стр - атрибуты мешаю рендерить фор->инк (1)
	return q_renderTag(arr, ctx.attrsAfter, type_isLast(), req.sync, req.local);
}
