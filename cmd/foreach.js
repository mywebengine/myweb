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
						res[i] = foreachRender(type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), vals[i]);
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
		req.sync.animations.add(type_animation(() => {
			for (let j, i = $elsLen - 1; i > 0; i--) {
				for (j = ctx.$els[i].length - 1; j > -1; j--) {
					removeChild(ctx.$els[i][j]);
				}
			}
		}, req.sync.local, 0));
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
				req.sync.afterAnimations.add(type_animation(() => q_forRender(req, ctx, $elsLen < keysLen ? () => q_add(req, ctx) : null, null), req.sync.local, 0));
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
	req.sync.animations.add(type_animation(() => { 
		for (const $i of toRem) {
			removeChild($i);
		}
	}, req.sync.local, 0));
	req.sync.afterAnimations.add(type_animation(() => q_forRender(req, ctx, null, null), req.sync.local, 0));
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
function q_add(req, ctx) {
	const $elsLen = ctx.$els.length,
		keysLen = ctx.keys.length,
		$from = ctx.$els[$elsLen - 1],
		$fromLen = $from.length,
		$fromLast = $from[$fromLen - 1],
		idx = $elsLen;
	let viewSize = 0,
		sId = 0;
	for (let j = 0; j < $fromLen; j++) {
		viewSize += $from[j].offsetHeight;
		const iSrc = srcBy$src.get($from[j]);
		if (sId === 0 && iSrc !== undefined) {
			sId = iSrc.id;
		}
	}
//	if (sId === 0) {
//		throw new Error("foreach.js");
//	}
	const step = Math.ceil(document.scrollingElement.clientHeight * visibleScreenSize / viewSize) || 100;//todo расположение можжет быть и горизонтальным, тогда будем рендерить по одной* штуке
	if (is$visible($fromLast)) {
		req.sync.animations.add(type_animation(() => q_addInsert(req, ctx, sId, keysLen, idx, step, $fromLast), req.sync.local, 0));//!! нельзя не вставить этот элементи двигасться дальше, так что если даже на момент отрисовки его не будет видно, его всё рано нужно вставить
		return;
	}
	req.sync.afterAnimations.add(type_animation(() => q_addDeferred(req, ctx, sId, keysLen, idx, step), req.sync.local, 0));
/*
	req.sync.animations.add(type_animation(() => {
		q_addInsert(req, ctx, sId, keysLen, idx, step, $fromLast);
		const $fr = Tpl_doc.createDocumentFragment(),
			idxs = new Set(),
			$new = q_addI(req, sId, $fr, keysLen, idx, step, idxs),//!!перенесли в аницации, что бы дать возможнасть отрисовать всё перед клонированием
			$last = get$fromLast(req, $fromLast, $elsLen - 1),
			nIdx = idx + $newLen;
		if (nIdx >= keysLen) {
			$last.parentNode.insertBefore($fr, $last.nextSibling);
			req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs), req.sync.local, 0));
			return;
		}
		const $newLen = $new.length,
			$newLast = $new[$newLen - 1];
		for (let $i = $newLast[$newLast.length - 1]; $i !== null; $i = $i.previousSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined) {
				continue;
			}
			sId = iSrc.id;
			$last.parentNode.insertBefore($fr, $last.nextSibling);
			req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs)
				.then(() => q_addDeferred(req, ctx, sId, keysLen, nIdx, step)), req.sync.local, 0));
			return;
		}
		throw new Error("foreach.js");
	}, req.sync.local, 0));//!! нельзя не вставить этот элементи двигасться дальше, так что если даже на момент отрисовки его не будет видно, его всё рано нужно вставить
        */
}
function q_addDeferred(req, ctx, sId, keysLen, idx, step) {
//console.error(sId, is$visible($srcById.get(sId)));
	return new Promise(ricResolve => {//обязательно нужден проимс
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			req.sync.animations.add(type_animation(() => {
				for (let l = req.sync.local.get(sId); l.newSrcId !== 0; l = req.sync.local.get(sId)) {
					sId = l.newSrcId;
				}
				q_addInsert(req, ctx, sId, keysLen, idx, step, $srcById.get(sId));
/*
				const $fr = Tpl_doc.createDocumentFragment(),//этот блоек не в анимации, что бы не тормозить в raf-е
					idxs = new Set(),
					$new = q_addI(req, sId, $fr, keysLen, idx, step, idxs),
					$last = get$fromLast(req, $srcById.get(sId), idx - 1);//!!
				//!!
				idx += $newLen;
				if (idx >= keysLen) {
					$last.parentNode.insertBefore($fr, $last.nextSibling);
					req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs), req.sync.local, 0));
					return;
				}
				const $newLen = $new.length,
					$newLast = $new[$newLen - 1];
				for (let $i = $newLast[$newLast.length - 1]; $i !== null; $i = $i.previousSibling) {
					const iSrc = srcBy$src.get($i);
					if (iSrc === undefined) {
						continue;
					}
					sId = iSrc.id;
					$last.parentNode.insertBefore($fr, $last.nextSibling);
					req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs)
						.then(() => q_addDeferred(req, ctx, sId, keysLen, idx, step)), req.sync.local, 0));
					return;
				}
				throw new Error("foreach.js");


				let $i = $new[$newLen - 1];
				$i = $i[$i.length - 1];
				$last.parentNode.insertBefore($fr, $last.nextSibling);
				req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs)
					.then(() => {
						if (idx < keysLen) {
							for (; $i !== null; $i = $i.previousSibling) {
								const iSrc = srcBy$src.get($i);
								if (iSrc === undefined) {
									continue;
								}
								req.sync.afterAnimations.add(type_animation(() => q_addDeferred(req, ctx, iSrc.id, keysLen, idx, step), req.sync.local, 0));
								//!!поидеи передать бы ид $new[$newLen - 1] вместо sId
								return;
							}
						}
					}), req.sync.local, 0));*/
//			}, req.sync.local, $from[$fromLen - 1][p_srcId]));//!!если передаь элемент для скрола, то получается штука: если прокручиваем быстро то можем (вставилось много, но неотрендерелось еще, мы прокрутим на конеч вставки и получим что первые теги взтавки $from[$fromLen - 1][p_srcId] не видны - добавиться скролл анимация - а в ней дальнейшая вставка блоков - и на этом рендер оставнавливается, пока не докрутим до неё)// - да, и такая логика рендера неестественна - на сервере всё равно все будет отрендерено
//			}, req.sync.local, 0));
			}, req.sync.local, sId));
			ricResolve();
		}, {
			timeout: 1000
		});
		req.sync.idleCallback.set(ricId, ricResolve);
	});
}
function q_addInsert(req, ctx, sId, keysLen, idx, step, $fromLast) {
	const $fr = Tpl_doc.createDocumentFragment(),
		idxs = new Set(),
		$new = q_addI(req, sId, $fr, keysLen, idx, step, idxs),//!!перенесли в аницации, что бы дать возможнасть отрисовать всё перед клонированием
		$newLen = $new.length,
		$last = get$fromLast(req, $fromLast, idx - 1);
	idx += $newLen;
	if (idx >= keysLen) {
		$last.parentNode.insertBefore($fr, $last.nextSibling);
		req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs), req.sync.local, 0));
		return;
	}
	const $newLast = $new[$newLen - 1];
	for (let $i = $newLast[$newLast.length - 1]; $i !== null; $i = $i.previousSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {
			continue;
		}
		sId = iSrc.id;
		$last.parentNode.insertBefore($fr, $last.nextSibling);
		req.sync.afterAnimations.add(type_animation(() => q_forRenderI(req, ctx, $new, idxs)
			.then(() => q_addDeferred(req, ctx, sId, keysLen, idx, step)), req.sync.local, 0));
		return;
	}
	throw new Error("foreach.js");
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
function q_addI(req, sId, $fr, keysLen, idx, step, idxs) {
	const len = idx + step > keysLen ? keysLen - idx : step,
//		$new = q_cloneNode(req, $from, idx, len),
		$new = q_cloneNode(req, sId, idx, len),
		$iNewLen = $new[0].length;
	for (let j, i = 0; i < len; i++, idx++) {
		for (j = 0; j < $iNewLen; j++) {
			$fr.appendChild($new[i][j]);
		}
		idxs.add(idx);
	}
//console.log(222, $from, $new, idxs, req.str);
//alert(1);
	return $new;
}
function q_forRender(req, ctx, addF, res) {
	const $now = [],
		$deferred = [],
		nowIdxs = new Set(),
		deferredIdxs = new Set(),
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
				nowIdxs.add(i);
			} else {
				$deferred.push(ctx.$els[i]);
				deferredIdxs.add(i);
			}
		}
	} else {
		for (let i = 0; i < $elsLen; i++) {
			$now.push(ctx.$els[i]);
			nowIdxs.add(i);
		}
	}
//console.error(nowIdxs, deferredIdxs);
//alert(1);
	if (deferredIdxs.size !== 0) {
		q_forRenderAddDeferredI(req, ctx, $deferred, deferredIdxs, 0, addF);
		return nowIdxs.size !== 0 ? q_forRenderI(req, ctx, $now, nowIdxs)
			.then(() => res) : res;
	}
	return nowIdxs.size !== 0 ? q_forRenderI(req, ctx, $now, nowIdxs)
		.then(() => {
			if (addF !== null) {
				addF();
			}
			return res;
		}) : res;
}
function q_forRenderAddDeferredI(req, ctx, $deferred, deferredIdxs, i, addF) {
	req.sync.afterAnimations.add(type_animation(() => new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			req.sync.idleCallback.delete(ricId);
			const idxs = new Set(),
				s = i,
				$defLen = $deferred.length;
			let c = 0;
			for (const idx of deferredIdxs) {
				idxs.add(idx);
				deferredIdxs.delete(idx);
				i++;
				c++;
				if (c === qPackLength || i === $defLen) {
					break;
				}
			}
			const isF = i < $defLen;
			q_forRenderI(req, ctx, $deferred.slice(s, s + c), idxs)
				.then(() => {
					if (!isF && addF !== null) {
						addF();
					}
					ricResolve();
				});
			if (isF) {
				q_forRenderAddDeferredI(req, ctx, $deferred, deferredIdxs, i, addF);
			}
		}, {
			timeout: 1000
		});
		req.sync.idleCallback.set(ricId, ricResolve);
	}), req.sync.local, 0));
}
function q_forRenderI(req, ctx, $els, idxs) {//!!idxs необходим для разделение на текущие и отложенные рендеры
	const arr = new Array(idxs.size);
	let $i, j, i = 0;
	for (const idx of idxs) {
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
	return q_renderTag(arr, ctx.attrsAfter, type_isLast(), req.sync);
}
