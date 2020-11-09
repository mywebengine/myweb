import {cache} from "../cache.js";
import {Tpl_doc, srcId, descrId, isCmd, forCmdName/*, incCmdName, elseCmdName, defaultCmdName*/} from "../config.js";
import {descrById, createSrc, getAttrAfter, get$els, get$first, getNextStr} from "../descr.js";
import {show, hide, removeChild, getIdx, getIdxName/*,$goTagsDeep, __$goCopy*/} from "../dom.js";
import {linkerTag} from "../render/linker.js";
import {q_renderTag, type_isLast, type_q_arr} from "../render/render.js";
import {eval2} from "../eval2.js";
import {varIdByVar, varIdByVarIdByProp, setCur$src} from "../proxy.js";
import {type_renderRes} from "../render/algo.js";
import {reqCmd} from "../req.js";
import {addAnimation, check, ocopy} from "../util.js";

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
	get$first($src, str) {//, expr, pos) {
		return forGet$first($src, str);//, expr, pos);
	},
	async render(req) {
//console.error("_for", req.sync.syncId, req, req.$src, req.$src[srcId]);
		const ctx = await forGet(req),
			c = getCache(req);
		if (ctx.keysLen === 0) {
			await show$first(req, ctx, hide);
			c.current[req.str] = null;
			return addAnimation(() => {
				for (let i = ctx.$elsLen - 1, j; i > 0; i--) {
					for (j = ctx.$els[i].length - 1; j > -1; j--) {
						removeChild(ctx.$els[i][j]);
					}
				}
				return type_renderRes(true, null, ctx.$els[0][ctx.$els[0].length - 1]);
			});//, req.sync);
		}
		if (ctx.$elsLen === 1 && ctx.$els[0][0].content) {
			await show$first(req, ctx, show);
		}
/*
		if (!ctx.d.isRendered) {//это если рендер запускается до линкера
			ctx.d.isRendered = true;
			const $f = ctx.$els[0][0],
			$from = !$f.content || getIdx($f, $req.str) !== null ? ctx.$els[0] : $f.content.childNodes;
//			for (let i = 1; i < ctx.$elsLen; i++) {
//todo это еще не работает
				copyDescr(req, $from, ctx.$els, ctx);
//			}
		}*/
		const cur = c.current[req.str],
			firstVal = ctx.value[ctx.keys[0]],
			pArr = [];
		ctx.isUpDown = cur === undefined || cur === firstVal;
		c.current[req.str] = firstVal;
//console.log("ctx.isUpDown", ctx, req, cur, firstVal, ctx.keys[0]);
//alert(2);
		ctx.q_renderFunc = q_renderTag;
		ctx.begin = 0;
		ctx.end = ctx.keysLen;
		if (ctx.isUpDown) {
			if (ctx.$elsLen < ctx.keysLen) {
				ctx.$fr = Tpl_doc.createDocumentFragment();
				const _t = ctx.$els[ctx.$elsLen - 1],
					t = _t[_t.length - 1];
				ctx.$frParent = t.parentNode;
				ctx.$frBefore = t.nextSibling;
				ctx.end = ctx.$elsLen;
				ctx.$new = q_add(req, ctx.$els[0], ctx.$elsLen, ctx.keysLen, ctx);
				ctx.newBegin = ctx.$elsLen;
				ctx.newKeys = ctx.keys.slice(ctx.$elsLen);
			} else if (ctx.$elsLen > ctx.keysLen) {
				const toRem = new Set();
				for (let i = ctx.keysLen; i < ctx.$elsLen; i++) {
					for (let j = ctx.$els[i].length - 1; j > -1; j--) {
						toRem.add(ctx.$els[i][j]);
					}
				}
				ctx.$els.splice(ctx.keysLen, ctx.$elsLen - ctx.keysLen);
				pArr.push(addAnimation(() => {
					for (const $i of toRem) {
						removeChild($i);
					}
				}));//, req.sync);
			}
		} else if (ctx.$elsLen < ctx.keysLen) {
			ctx.$fr = Tpl_doc.createDocumentFragment();
			const t = ctx.$els[0][0];
			ctx.$frParent = t.parentNode;
			ctx.$frBeforePrev = t.previousSibling;//для того что бы если нулевой станет template
			ctx.begin = ctx.keysLen - ctx.$elsLen;
			ctx.$new = q_add(req, ctx.$els[ctx.$elsLen - 1], 0, ctx.begin, ctx);
			ctx.newBegin = 0;
			ctx.newKeys = ctx.keys.slice(0, ctx.begin);
		} else if (ctx.$elsLen > ctx.keysLen) {
			const _end = ctx.$elsLen - ctx.keysLen,
				toRem = new Set();
			for (let i = 0; i < _end; i++) {
				for (let j = ctx.$els[i].length - 1; j > -1; j--) {
					toRem.add(ctx.$els[i][j]);
				}
			}
			ctx.$els.splice(0, _end);
			pArr.push(addAnimation(() => {
				for (const $i of toRem) {
					removeChild($i);
				}
			}));//, req.sync);
		}
//console.log(111, ctx.begin, ctx.$els, ctx.keys.slice(ctx.begin, ctx.end), req, ctx);
		pArr.push(q_forRender(req, ctx.begin, ctx.$els, ctx.keys.slice(ctx.begin, ctx.end), false, ctx));
		if (ctx.$fr) {
//console.log(222, ctx.newBegin, ctx.$new, ctx.newKeys, req, ctx);
//alert(2);
			pArr.push(q_forRender(req, ctx.newBegin, ctx.$new, ctx.newKeys, true, ctx));
			const arr = await Promise.all(pArr);
			return applyFr(req, ...arr.slice(arr.length - 2), ctx);//-2 - это результаты двух рендеров
		}
//alert(2);
		const arr = await Promise.all(pArr),
			q_arr = arr[arr.length - 1];
		return type_renderRes(true, null, q_arr[q_arr.length - 1].$src);
	},
	linker(req) {
		const ctx = forGet(req),
			l = ctx.$elsLen - 1,
			attr = getAttrAfter(ctx.attr, req.str);
		for (let i = ctx.$elsLen - 1, j; i > 0; i--) {
			for (j = ctx.$els[i].length - 1; j > -1; j--) {
				const $j = ctx.$els[i][j];
				if ($j.nodeType === 1) {
					linkerTag($j, req.scope, attr);
				}
			}
		}
		cache[req.$src[srcId]].current[req.str] = ctx.value[ctx.keys[0]];
//		ctx.d.for_oldFirstVal[req.str] = ctx.value[ctx.keys[0]];
		return type_renderRes(true, null, ctx.$els[l][ctx.$els[l].length - 1]);
/*
//		const p = forGet(req, linker);
		const [$els, keys, idxName, valName, keyName] = forGet(req);
		const $elsLen = $els.length;
		const keysLen = keys.length;

		const $l = $els[$elsLen - 1];

		if (!keysLen) {
			return {
				$e: $l[$l.length - 1],
				isLast: true
			};
		}
		const d = descrById.get(req.$src[descrId]);
//		if ($elsLen > 1) {// && !getDescr($els[step])) {
			const $f = $els[0][0],
				$fromEls = !$f.content || getIdx($f, $req.str) !== null ? $els[0] : $f.content.childNodes;
			for (let i = 1; i < $elsLen; i++) {
//				copyDescr(req, $els, $fromEls, i);
//?????????
				for_render(req, $els, keys, idxName, linker, i);
			}
//		}
		if (!d.for_oldFirstVal) {
			d.for_ol6dFirstVal = {};
		}
//		d.for_oldFirstVal[req.str] = JSON.stringify(ctx.value[keys[keysLen - 1]]);
//		d.for_oldFirstVal[req.str] = ctx.value[keys[keysLen - 1]];
		d.for_oldFirstVal[req.str] = ctx.value[keys[0]];
//!!
//!!		d.isRendered = true;
//console.log(req, d.for_oldFirstVal[req.str]);
		return {
			$e: $l[$l.length - 1],
			isLast: true
		};*/
	},
	async setScope(req) {
		const idx = getIdx(req.$src, req.str);
		if (idx === null) {
			return false;
		}
		const val = await eval2(req, req.$src, true, true);
		if (!val) {
			return false;
		}
		if (!req.reqCmd.args[0]) {
			return true;
		}
		let key;
		if (Array.isArray(val)) {
			key = Number(idx);
		} else {
//todo Set and Map
			let i = 0;
			for (const k in val) {
				if (i++ == idx) {
					key = k;
					break;
				}
			}
		}
		const valName = req.reqCmd.args[0],
			keyName = req.reqCmd.args[1];
		if (valName) {
			req.scope[valName] = val[key];
		}
		if (keyName) {
			req.scope[keyName] = key;
		}
//if (idx != 0) {
//	console.log("!!!!!!!! for.js", req.$src, key, val[key]);
//}
		return true;
	}
};
async function show$first(req, ctx, showFunc) {
	const $firstLen = ctx.$els[0].length,
		pArr = new Array($firstLen);
	for (let j = $firstLen - 1; j > -1; j--) {
		pArr[j] = showFunc(req, ctx.$els[0][j]);
	}
	const $firstEls = await Promise.all(pArr);
	for (let j = $firstLen - 1; j > -1; j--) {
		ctx.$els[0][j] = $firstEls[j];
	}
}
async function forGet(req) {
//todo можно запускать с нулевого элемента для получения кэша
	const val = await eval2(req, req.$src, true),
		$first = forGet$first(req.$src, req.str);
	if (!val) {
		return getEmptyCtx($first, req.str);
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
	if (!keys.length) {
		return getEmptyCtx($first, req.str);
	}
	const d = descrById.get(req.$src[descrId]);
	return type_forCtx(val, d, getAttrAfter(d.attr, req.str), forGet$els($first, req.str), keys, getIdxName(req.str), req.reqCmd.args[0], req.reqCmd.args[1]);
}
function getEmptyCtx($first, str) {
	return type_forCtx(null, descrById.get($first[descrId]), null, forGet$els($first, str), [], "", "", "");
}
function type_forCtx(value, d, attrsAfter, $els, keys, idxName, valName, keyName) {
	return {
		value,
		d,
		attrsAfter,
		$els,
		keys,
		$elsLen: $els.length,
		keysLen: keys.length,

		idxName,
		valName,
		keyName,

		q_renderFunc: null,
		isUpDown: true,
		begin: 0,
		end: 0,
		newBegin: 0,
		$new: null,//[],
		newKeys: null,//[],

		$fr: null,
		$frBefore: null,
		$frBeforePrev: null,
		$frParent: null
	};
}
function getCache(req) {
	const sId = req.$src[srcId],
		fId = descrById.get(req.$src[descrId]).sId;
	if (sId === fId) {
		return cache[fId];
	}
	const c = cache[fId];
	c.value[req.str] = cache[sId].value[req.str];
	delete cache[sId].value[req.str];
	return c;
}
function applyFr(req, q_res, q_frRes, ctx) {
	const res = type_renderRes(true, null, ctx.isUpDown && q_frRes[q_frRes.length - 1].$src || q_res[q_res.length - 1].$src);
	if (ctx.isUpDown) {
		if (ctx.$frParent.nodeType === 11) {
			ctx.$frParent.insertBefore(ctx.$fr, q_res[q_res.length - 1].$src.nextSibling);
			return res;
		}
		return addAnimation(() => {
			ctx.$frParent.insertBefore(ctx.$fr, q_res[q_res.length - 1].$src.nextSibling);
			return res;
		});
	}
	let $i = q_res[0].$src;
	while (!$i[isCmd]) {
		$i = $i.previousSibling;
	}
	const d = descrById.get($i[descrId]),
		nStr = getNextStr($i, req.str);
	if (ctx.$frParent.nodeType === 11) {
		ctx.$frParent.insertBefore(ctx.$fr, get$first($i, d.get$elsByStr, nStr));
		return res;
	}
	return addAnimation(() => {
		ctx.$frParent.insertBefore(ctx.$fr, get$first($i, d.get$elsByStr, nStr));
		return res;
	});
}
function forGet$first($e, str) {
	if (!str) {
//todo
console.warn(111);
	}
//console.error(0, str, $e);
	const forStrs = getForStrs($e, str),
		forStrsLen = forStrs.length;
	for (let $i = $e; $i; $i = $i.previousSibling) {
		if (!$i[isCmd]) {
			continue;
		}
		const idx = getIdx($i, str);
		if (idx === null) {
			return $e;
		}
		$e = $i;
		if (idx !== "0") {
			continue;
		}
		while ($i = $i.previousSibling) {
			if (!$i[isCmd]) {
				continue;
			}
			const prevIdx = getIdx($i, str);
//console.error(1, str, prevIdx);
			if (prevIdx === null || prevIdx !== "0") {
				return $e;
			}
			if (forStrsLen) {
				for (let i = forStrsLen - 1; i > -1; i--) {
					const a = forStrs[i];
					if (getIdx($i, a.str) !== a.val) {
						return $e;
					}
				}
			}
			$e = $i;
		}
		return $e;
	}
	return $e;
}
function forGet$els($first, str) {
	if (!str) {
//todo
console.warn(111);
	}
	const $els = [],
		forStrs = getForStrs($first, str),
		forStrsLen = forStrs.length,
		nStr = getNextStr($first, str);
	let $i = $first;
	do {
		if (nStr) {
			const d = descrById.get($i[descrId]);
			$els.push(d.get$elsByStr && get$els($i, d.get$elsByStr, nStr));
		} else {
			$els.push([$i]);
		}
//		const d = descrById.get($i[descrId]),
//			$e = d.get$elsByStr && get$els($i, d.get$elsByStr, nStr) || [$i],
//			idx = getIdx($i, str);
//		$els.push($e);
		const idx = getIdx($i, str);
		if (idx === null) {
			return $els;
		}
		const $e = $els[$els.length - 1];
//console.log(222, str, idx, $e[$e.length - 1], $e[$e.length - 1].nextSibling);
//alert(1);
		for ($i = $e[$e.length - 1].nextSibling; $i; $i = $i.nextSibling) {
			if (!$i[isCmd]) {
				continue;
			}
			const jdx = getIdx($i, str);
			if (jdx === null) {
				return $els;
			}
			if (forStrsLen) {
				for (let i = forStrsLen - 1; i > -1; i--) {
					const a = forStrs[i];
					if (getIdx($i, a.str) !== a.val) {
						return $els;
					}
				}
			}
			if (Number(idx) > Number(jdx)) {
				return $els;
			}
			if (idx !== jdx) {
				break;
			}
			$e.push($i);
		}
	} while ($i);
	return $els;
}
function getForStrs($e, str) {
	const forStrs = [];
	for (const n of descrById.get($e[descrId]).attr.keys()) {
		if (n === str) {
			break;
		}
		if (reqCmd[n].cmdName === forCmdName) {
			forStrs.push(type_forStr(n, getIdx($e, n)));
		}
	}
	return forStrs;
}
function type_forStr(str, val) {
	return {
		str,
		val
	};
}

/*
//todo это еще не работает
//!! проблема будет тогда когда _html нагенерит много тегов - а мы еще не рендерев начнем создавать элементы не зная что разметку не нужно брать в расчёт
function copyDescr(req, $from, $els, ctx) {
//Предполагается, что если первый элемент это tmplate - то значит он результат hide
//Если бы была вставка, то первый был бы коммент, а если бы первым задумывался template - то он бы и получился циклом - и в этом случаи все сломается (!!!), но данный сценарий - что-то очень абстрактное

//todo нужно заменить на алгоритм q_add
//	const $to = !$t.content || getIdx($t, req.str) !== null ? $els[toIdx] : $t.content.childNodes;
----
	for (let i = $from.length - 1; i > -1; i--) {
		if ($from[i].nodeType === 1) {
			__$goCopy($from[i], $to[i], _copyDescr);
		}
	}
---------------
	const $fromLen = $from.length,
		$elsLen = $els.length;
	for (let j = 0; j < $fromLen; j++) {
		if ($from[j].nodeType === 1) {
//			$goTagsDeep($from[j], $j => {
//				if (!$j[srcId]) {
//console.log(1000, $j);
//					createSrc($j);
//				}
//			});
			for (let i = 1; i < $elsLen; i++) {
//				_q_copy($from[j], $els[i][j]);
console.log(222, $from[j], $els[i][j]);
//				__$goCopy($from[j], $els[i][j], _copyDescr);
				_q_cloneCopy($from[j], $els[i]);
			}
		}
	}
-----------

//console.log(1111, req, $from, $els);
	const $fromLen = $from.length,
		$copyLen = $els.length - 1,
		$to = new Array($fromLen);

	for (let j = 0; j < $fromLen; j++) {
		const dId = $from[j][descrId],
			d = descrById.get(dId);
		for (const str of d.attr.keys()) {
			const r = reqCmd[str];
console.log(333, $from[j], str, getIdx($from[j], str));
			if (r.cmd.isAsOne && $from[j + 1] && getIdx($from[j + 1], str) == 1) {
				for (j++; j < $fromLen; j++) {
//!!
					descrById.delete($from[j][descrId]);
					$from[j][descrId] = dId;
					d.srcIdSet.add($from[j][srcId]);
					if (!$from[j + 1] || getIdx($from[j + 1], str) > 0) {
						break;
					}
				}
			}
		}
	}

	for (let j = 0; j < $fromLen; j++) {
		$to[j] = new Array($copyLen);
//	}
//	for (let j = 0; j < $fromLen; j++) {
		for (let i = $copyLen - 1; i > -1; i--) {
			$to[j][i] = $els[i + 1][j];
		}
//	}
console.log(222, $from, $to, $fromLen, $copyLen);
//	for (let j = 0; j < $fromLen; j++) {
		_q_cloneCopy($from[j], $to[j]);
	}
alert(2);
}*/
/*
function _q_copy($from, $to) {
	createSrc($to, $from[descrId]);
//	const dId = $from[descrId];
//	for (const $i of $to) {
//		if ($i.nodeType === 1) {
//			createSrc($i, dId);
//		}
//	}
	if ($from.isCustomHTML) {
		return;
	}
//	const $children = new Set();
	if ($from.content) {
		for (let $i = $from.content.firstChild; $i; $i = $i.nextSibling) {
			if ($i.nodeType === 1) {
////				for (const ) {
//					$children.add($to[i].content.childNodes[j]);
////				}
				_q_cloneCopy($i, arr);//, len);
			}
		}
		return;
	}
	for (let j = 0, $i = $from.firstChild; $i; j++, $i = $i.nextSibling) {
		if ($i.nodeType === 1) {
			for (let i = 0; i < len; i++) {
				arr[i] = $to[i].childNodes[j];
			}
			_q_cloneCopy($i, arr);//, len);
		}
	}
}*/
/*
function _copyDescr($fromJ, $to) {
	createSrc($to, $fromJ[descrId]);
}*/
function q_add(req, $from, begin, end, ctx) {
//console.time("c");
	const $first = $from[0];
	if ($first[descrId]) {//если 0-ой не [descrId] - то это может быть только <!--inc_begin
		$from = (!$first.content || getIdx($first, req.str) !== null) && [$first] || Array.from($first.content.childNodes);
	}
	const $fromLen = $from.length,
		$newLen = end - begin,
		$new = new Array($newLen),
		$to = new Array($fromLen);
	for (let i = 0; i < $newLen; i++) {
		$new[i] = new Array($fromLen);
	}
	for (let j = 0; j < $fromLen; j++) {
		$to[j] = new Array($newLen);
	}
	for (let i = 0; i < $newLen; i++) {
		for (let j = 0; j < $fromLen; j++) {
			$new[i][j] = $to[j][i] = ctx.$fr.appendChild($from[j].cloneNode(true));
		}
	}
	for (let j = 0; j < $fromLen; j++) {
		_q_cloneCopy($from[j], $to[j]);//, $newLen);
	}
/*
	for (let i = 0; i < $newLen; i++) {
		$new[i] = new Array($fromLen);
	}
	for (let j = 0; j < $fromLen; j++) {
		$to[j] = new Array($newLen);
		for (let i = 0; i < $newLen; i++) {
			$new[i][j] = $to[j][i] = ctx.$fr.appendChild($from[j].cloneNode(true));
		}
		_q_cloneCopy($from[j], $to[j]);//, $newLen);
	}*/


//Это для линковки переменных "до" - нет смысла использовать, так как в рендер попадут все элементы,
//а препаэйр удалит все кроме ожного (по логике фор-а рендер любого - рендерит всё)
/*
	for (let j = 0; j < $fromLen; j++) {
		const $f = $from[j];
		if ($f.nodeType !== 1) {
			continue;
		}
		for (const [n, v] of descrById.get($f[descrId]).attr) {
			if (n === req.str) {
				break;
			}
//todo прибрать тут
			if ((reqCmd[n].cmdName === incCmdName && reqCmd[n].args && reqCmd[n].args.length) || !v || reqCmd[n].cmdName === elseCmdName || reqCmd[n].cmdName === defaultCmdName) {
				continue;
			}
//console.log(n,v, $to[j]);
			for (let i = 0; i < $newLen; i++) {
//				req = ocopy(req);
				req.$src = $to[j][i];
				req.str = n;
				req.expr = v;
				eval2(req, req.$src, true);
			}
		}
	}*/
//console.timeEnd("c");
//console.log("$new", $new);
//alert(4);
	return $new;
}
/*
function q_add3($from, begin, end, $fr, sync) {
console.time("c");
	const $fromLen = $from.length,
		$newLen = end - begin,
		$new = new Array($newLen);
	for (let i = 0; i < $newLen; i++) {
		$new[i] = new Array($fromLen);
	}
	for (let j = 0; j < $fromLen; j++) {
		const $f = $from[j],
			s = new Set();
		_f($f, s);
		for (let i = 0; i < $newLen; i++) {
			$new[i][j] = $fr.appendChild($f.cloneNode(true));
			for (const ss of s) {
				let $c = $new[i][j];
				const p = ss.path,
					pLen = ctx.length;
				for (let k = 0; k < pLen; k++) {
					$c = $c.childNodes[p[k]];
				}
//console.log(ss, $c, s);
//alert(1);
				createSrc($c, ss.dId);
			}
		}
	}
console.timeEnd("c");
	return $new;
}
function _f($e, s, path = []) {
	if ($e.isCustomHTML) {
		return;
	}
	s.add({
		dId: $e[descrId],
		path
	});
	for (let i = 0, $i = $e.firstChild; $i; i++, $i = $i.nextSibling) {
		if ($i.nodeType === 1) {
			const p = path.slice();
			ctx.push(i);
			_f($i, s, p);
		}
	}
}*/
function _q_cloneCopy($fromJ, $to) {//, len) {
	const dId = $fromJ[descrId];
	if (!dId) {
		return;
	}
	const $toLen = $to.length;
	for (let i = 0; i < $toLen; i++) {
//		const $i = $to[i];
//		if ($i.nodeType === 1) {
//			createSrc($i, dId);
//		}
		createSrc($to[i], dId);
	}
	if (descrById.get(dId).isCustomHTML) {
		return;
	}
	const arr = new Array($toLen);
	if ($fromJ.content) {
		for (let j = 0, $i = $fromJ.content.firstChild; $i; j++, $i = $i.nextSibling) {
			if ($i[descrId]) {
				for (let i = 0; i < $toLen; i++) {
					arr[i] = $to[i].content.childNodes[j];
				}
				_q_cloneCopy($i, arr);//, len);
			}
		}
		return;
	}
	for (let j = 0, $i = $fromJ.firstChild; $i; j++, $i = $i.nextSibling) {
		if ($i[descrId]) {
			for (let i = 0; i < $toLen; i++) {
				arr[i] = $to[i].childNodes[j];
			}
			_q_cloneCopy($i, arr);//, len);
		}
	}
}
function q_forRender(req, begin, $els, keys, inFragment, ctx) {
	const len = $els.length,
		arr = new Array(len);
//varIdByVar, varIdByVarIdByProp
	for (let i = 0; i < len; i++) {
//todo должкн быть тэг, для вставки это не так
		let $i = $els[i][0],
			j = 0,
			iLen = $els[i].length;
//		while ($i.nodeType !== 1) {
		while (!$i[descrId]) {
			$i = $els[i][++j];
			if (j === iLen) {
				break;
			}
		}
		const aI = arr[i] = type_q_arr($i, ocopy(req.scope));
		setCur$src($i);
		if (ctx.valName) {
			aI.scope[ctx.valName] = ctx.value[keys[i]];
		}
		if (ctx.keyName) {
			aI.scope[ctx.keyName] = keys[i];
		}
		for (j = iLen - 1; j > -1; j--) {
//			if ($els[i][j].nodeType === 1) {
			if ($els[i][j][isCmd]) {
				$els[i][j].setAttribute(ctx.idxName, begin + i);
			}
		}
	}
	setCur$src();
	return ctx.q_renderFunc(arr, ctx.attrsAfter, req.sync, type_isLast(), inFragment);
}
