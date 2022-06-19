import config from "../../../config/config.js";
import ocopy from "../../../oset/ocopy.js";
import kebabToCamelCase from "../../../str/kebabToCamelCase.js";
import Animation from "../../render/Animation.js";
import Q_arr from "../../render/Q_arr.js";
import RenderRes from "../../render/RenderRes.js";
import Command from "../Command.js";
import ForeachContext from "./ForeachContext.js";

export default class Foreach extends Command {
	isAsOne = true;
	render(req) {
		return this.my.eval2(req, req.$src, true)
			.then(val => this.renderByVal(req, val));
	}
	q_render(req, arr, isLast) {
		return this.my.q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = this.renderByVal(this.my.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), vals[i]);
					}
				}
				return res;
			});
	}
	get$first($first, str, expr, pos) {
		const srcBy$src = this.my.context.srcBy$src;
		for (let $i = $first; $i !== null; $i = $i.previousSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			if (iSrc.asOneIdx === null) {
				return $first;
			}
			const nStr = iSrc.getNextStr(str),
				asOneIdx = iSrc.asOneIdx.get(str);
			$first = nStr !== "" ? iSrc.get$first(nStr) : $i;
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
				$first = $i = iSrc.get$first(nStr);
			}
			return $first;
		}
		throw new Error("foreach.js");
	}
	get$els($src, str, expr, pos) {
//todo , expr, pos
		const $els = this.get$elsGroupByElements(this.get$first($src, str, expr, pos), str, expr, pos),
			$elsLen = $els.length,
			$ret = [];
		for (let i = 0; i < $elsLen; i++) {
			const $iLen = $els[i].length;
			for (let j = 0; j < $iLen; j++) {
				$ret.push($els[i][j]);
			}
		}
		return $ret;
	}
	renderByVal(req, val) {
//console.error("_for", req.sync.syncId, req, req.$src);
//alert(1);
//if (self.a && req.expr === 'game.log') {
//	console.log(req, val);
//	alert(1);
//}
		const srcBy$src = this.my.context.srcBy$src,
			src = srcBy$src.get(req.$src);
		if (src.asOneIdx === null) {
			src.asOneIdx = new Map();
		}
		if (!src.asOneIdx.has(req.str)) {
			src.setAsOneIdx(req.str, this.my.getNewId());
			src.setIdx(req.str, 0);
		}
		const context = this.getContext(req, val),
			elsLen = context.els.length,
			keysLen = context.keys.length,
			l = context.els[elsLen - 1].$els,
			$last = l[l.length - 1];
		if (keysLen === 0) {
			this.show$first(req, context, this.my.hide.bind(this.my));
			req.sync.animations.add(new Animation(() => {
				for (let j, i = elsLen - 1; i > 0; i--) {
					const $elsI = context.els[i].$els;
					for (j = $elsI.length - 1; j > -1; j--) {
						this.my.removeChild($elsI[j]);
					}
				}
			}, req.sync.local, 0));
			return new RenderRes(true, null, $last);
		}
//console.error("for context", context.els, context, req);
//alert(2);
		const res = new RenderRes(true, null, $last);
		if (elsLen === 1) {//todo подумать об этом
			const $e0 = context.els[0].$els;
//			if ($e00.nodeName === "TEMPLATE" && $e00.getAttribute(hideName) !== null) {
			for (let $j = $e0[0];; $j = $j.nextSibling) {
//				if ($j.nodeType !== 1) {//впринципе можно и убрать
//					break;
//				}
				const jSrc = srcBy$src.get($j);
				if (jSrc === undefined) {
					continue;
				}
				if (!jSrc.isHide) {
					break;
				}
				this.show$first(req, context, this.my.show.bind(this.my));
				for (let j = $e0.length - 1; j > -1; j--) {
					$e0[j] = $e0[j].content.firstChild;
				}
				req.sync.afterAnimations.add(new Animation(() => this.q_forRender(req, context, context.els, elsLen < keysLen ? () => this.q_add(req, context) : null), req.sync.local, 0));
				return res;
			}
		}
		if (elsLen === keysLen) {
			const p = this.q_forRender(req, context, context.els, null);
			return p === undefined ? res : p
				.then(() => res);
		}
		if (elsLen < keysLen) {
			const p = this.q_forRender(req, context, context.els, () => this.q_add(req, context));
			return p === undefined ? res : p
				.then(() => res);
		}
		const toRem = new Set();
//		for (let i = elsLen - 1; i >= keysLen; i--) {
//			for (let j = context.els[i].length - 1; j > -1; j--) {
		for (let i = keysLen; i < elsLen; i++) {
			const l = context.els[i].$els.length,
				$elsI = context.els[i].$els;
			for (let j = 0; j < l; j++) {
				toRem.add($elsI[j]);
			}
		}
		context.els.splice(keysLen, elsLen - keysLen);
		req.sync.animations.add(new Animation(() => { 
			for (const $i of toRem) {
				this.my.removeChild($i);
			}
		}, req.sync.local, 0));
		req.sync.afterAnimations.add(new Animation(() => this.q_forRender(req, context, context.els, null), req.sync.local, 0));
		return res;
/*
		const p = this.q_forRender(req, context);
		return p === null ? res : p
			.then(() => {
				req.sync.animations.add(new Animation(() => { 
					for (const $i of toRem) {
						this.my.removeChild($i);
					}
				}, req.sync.local, 0));
				return res;
			});*/
	}
	getContext(req, val) {
		const pos = -1,//нужно было бы запускать с нулевого элемента для получения кэша - эта задача режается в функции получения кэша
			$first = this.get$first(req.$src, req.str, req.expr, pos),
			$els = this.get$elsGroupByElements($first, req.str, req.expr, pos),
			valName = kebabToCamelCase(req.commandWithArgs.args[0]),
			keyName = kebabToCamelCase(req.commandWithArgs.args[1]);
		if (!val) {
			return new ForeachContext([], [], $els, valName, keyName);
		}
		if (Array.isArray(val)) {
			const len = val.length,
				keys =new Array(len);
			for (let i = 0; i < len; i++) {
				keys[i] = i;
			}
			return new ForeachContext(keys, val, $els, valName, keyName);
		}
		if (val instanceof Set || val instanceof Map) {
			const keys = new Array(val.size),
				arr = new Array(val.size);
			let i = 0;
			for (const [k, v] of val.entries()) {
				keys[i] = k;
				arr[i++] = v;
			}
			return new ForeachContext(keys, arr, $els, valName, keyName);
		}
		const keys = [],
			arr = [];
		for (const key in val) {
			keys.push(key);
			arr.push(val[key]);
		}
		return new ForeachContext(keys, arr, $els, valName, keyName);
	}
	show$first(req, context, showFunc) {
		const first$els = context.els[0].$els,
			first$elsLen = first$els.length;
//		for (let j = first$elsLen - 1; j > -1; j--) {
		for (let j = 0; j < first$elsLen; j++) {
			showFunc(req, first$els[j]);
		}
	}
	get$elsGroupByElements($e, str, expr, pos) {
		const srcBy$src = this.my.context.srcBy$src;
		for (let $i = $e, iSrc = srcBy$src.get($i); $i !== null; $i = $i.nextSibling, iSrc = srcBy$src.get($i)) {
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			if (iSrc.asOneIdx === null) {//if foreach
				return [[$e]];
			}
			const nStr = iSrc.getNextStr(str),
				asOneIdx = iSrc.asOneIdx.get(str),
				$els = [];
			do {
				if (nStr !== "") {
					const $e = $els[$els.push(iSrc.get$els(nStr)) - 1];
					$i = $e[$e.length - 1];
				} else {
					$els.push([$i]);
				}
				for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
					iSrc = srcBy$src.get($i);
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
	q_add(req, context) {
		const elsLen = context.els.length,
			keysLen = context.keys.length,
			from = context.els[elsLen - 1],
			from$elsLen = from.$els.length,
//			from$last = from.$els[from$elsLen - 1],
			idx = elsLen,
			srcBy$src = this.my.context.srcBy$src;
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
//		if (sId === 0) {
//			throw new Error("foreach.js");
//		}
		const step = viewSize !== 0 ? Math.ceil(document.scrollingElement.clientHeight * config.visibleScreenSize / viewSize) : config.renderBatchSize;
//		if (this.my.is$visible(from$last)) {
		if (this.my.is$visible(from.$els[from$elsLen - 1])) {
			req.sync.animations.add(new Animation(() => this.q_addInsert(req, context, this.my.getSrcId(req.sync.local, sId), keysLen, idx, step), req.sync.local, 0));//!! нельзя не вставить этот элементи двигасться дальше, так что если даже на момент отрисовки его не будет видно, его всё рано нужно вставить
			return;
		}
		req.sync.afterAnimations.add(new Animation(() => this.q_addDeferred(req, context, sId, keysLen, idx, step), req.sync.local, 0));
	}
	q_addDeferred(req, context, sId, keysLen, idx, step) {
		return new Promise(ricResolve => {//обязательно нужден проимс
			const ricId = requestIdleCallback(() => {
				req.sync.idleCallback.delete(ricId);
				req.sync.animations.add(new Animation(() => this.q_addInsert(req, context, this.my.getSrcId(req.sync.local, sId), keysLen, idx, step), req.sync.local, sId));
				ricResolve();
			}, config.defIdleCallbackOpt);
			req.sync.idleCallback.set(ricId, ricResolve);
		});
	}
	q_addInsert(req, context, sId, keysLen, idx, step) {
		const $fr = this.my.context.document.createDocumentFragment(),
			newEls = this.q_addI(req, sId, $fr, keysLen, idx, step),//!!перенесли в аницации, что бы дать возможнасть отрисовать всё перед клонированием
			newElsLen = newEls.length,
//			$last = this.get$last(req, from$last, idx - 1);
			$last = this.get$last(req, this.my.context.$srcById.get(sId), idx - 1);
		idx += newElsLen;
		if (idx >= keysLen) {
/*
//todo
if (!$last.parentNode) {
	console.error(req, context, sId, keysLen, idx, step, $last);
}*/
			$last.parentNode.insertBefore($fr, $last.nextSibling);
			req.sync.afterAnimations.add(new Animation(() => this.q_forRenderI(req, context, newEls), req.sync.local, 0));
			return;
		}
		const newElsLast$els = newEls[newElsLen - 1].$els,
			srcBy$src = this.my.context.srcBy$src;
		for (let $i = newElsLast$els[newElsLast$els.length - 1]; $i !== null; $i = $i.previousSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined) {
				continue;
			}
			sId = iSrc.id;
			$last.parentNode.insertBefore($fr, $last.nextSibling);
			req.sync.afterAnimations.add(new Animation(() => this.q_forRenderI(req, context, newEls)
				.then(() => this.q_addDeferred(req, context, sId, keysLen, idx, step)), req.sync.local, 0));
			return;
		}
		throw new Error("foreach.js");
	}
	get$last(req, $last, lastIdx) {
		const srcBy$src = this.my.context.srcBy$src,
			asOneIdx = srcBy$src.get($last).asOneIdx.get(req.str),
			$els = srcBy$src.get($last).get$els(req.str);
		$last = $els[$els.length - 1];
		for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || iSrc.getIdx(req.str) !== lastIdx) {
				return $last;
			}
			const $els = srcBy$src.get($i).get$els(req.str);
			$last = $els[$els.length - 1];
		}
		return $last;
	}
/*
function get$last(req, $last, lastIdx) {
	const asOneIdx = this.my.context.srcBy$src.get($last).asOneIdx.get(req.str);
	for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
		const iSrc = this.my.context.srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || iSrc.getIdx(req.str) !== lastIdx) {
			return $last;
		}
		$last = $i;
	}
	return $last;
}*/
	q_addI(req, sId, $fr, keysLen, idx, step) {
		const len = idx + step > keysLen ? keysLen - idx : step,
//			newEls = q_cloneNode(req, sId, idx, len),
			newEls = this.my.context.srcById.get(this.my.getSrcId(req.sync.local, sId)).q_cloneNode(req, idx, len),
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
	q_forRender(req, context, els, addF) {
		const nows = [],
			deferreds = [],
			elsLen = els.length;
		if (!req.sync.renderParam.isLinking) {
			const srcBy$src = this.my.context.srcBy$src;
			for (let i = 0; i < elsLen; i++) {
				const elsI = els[i],
					$elsI = elsI.$els,
					l = $elsI.length;
				let f = false;
				for (let j = 0; j < l; j++) {
//					const jSrc = srcBy$src.get($elsI[j]);
//					if (iSrc !== undefined && this.my.is$visible($elsI[j])) {
					if (this.my.is$visible($elsI[j])) {
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
			return this.q_forRenderI(req, context, nows)
				.then(() => {
					if (deferreds.length !== 0) {
						req.sync.afterAnimations.add(new Animation(() => this.q_forRender(req, context, deferreds, addF), req.sync.local, 0));
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
				this.q_forRenderI(req, context, deferreds.splice(0, config.renderBatchSize))
					.then(() => {
						if (deferreds.length !== 0) {
							return this.q_forRender(req, context, deferreds, addF)
								.then(ricResolve);
						}
						if (addF !== null) {
							addF();
						}
						ricResolve();
					});
			});
			req.sync.idleCallback.set(ricId, ricResolve);
		}, config.defIdleCallbackOpt);
/*



//console.error(nowsIdxs, deferredsIdxs);
//alert(1);
		if (deferredsIdxs.size !== 0) {
			this.q_forRenderAddDeferredI(req, context, $deferreds, deferredsIdxs, 0, addF);
			if (nowsIdxs.size !== 0) {
				return this.q_forRenderI(req, context, $nows, nowsIdxs);
			}
			return;
		}
		if (nowsIdxs.size === 0) {
			return;
		}
		return this.q_forRenderI(req, context, $nows, nowsIdxs)
			.then(() => {
				if (addF !== null) {
					addF();
				}
			});*/
	}
/*
function q_forRenderAddDeferredI(req, context, $deferreds, deferredsIdxs, i, addF) {
	req.sync.afterAnimations.add(new Animation(() => new Promise(ricResolve => {
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
				if (c === config.renderBatchSize || i === $defLen) {
					break;
				}
			}
			const isF = i < $defLen;
			this.q_forRenderI(req, context, $deferreds.slice(s, s + c), idxs)
				.then(() => {
					if (!isF && addF !== null) {
						addF();
					}
					ricResolve();
				});
			if (isF) {
				this.q_forRenderAddDeferredI(req, context, $deferreds, deferredsIdxs, i, addF);
			}
		}, config.defIdleCallbackOpt);
		req.sync.idleCallback.set(ricId, ricResolve);
	}), req.sync.local, 0));
}*/
	q_forRenderI(req, context, els) {//!!idxs необходим для разделение на текущие и отложенные рендеры
		const arrLen = els.length,
			arr = new Array(arrLen),
			srcBy$src = this.my.context.srcBy$src;
		for (let $i, j, i = 0; i < arrLen; i++) {
//		let $i, j, i = 0;
//		for (const idx of idxs) {
			const elsI = els[i],
				$elsI = elsI.$els,
				$elsILen = $elsI.length;
			$i = $elsI[0];
			if (!srcBy$src.has($i)) {
				j = 1;
				do {
					$i = $elsI[j++];
//todo - так может получиться если удалить элемент, который ренджерится из дом-а
//					if ($i === undefined) {
//						console.warn(22323432, req, context, els, j);
//						alert(1)
//					}
				} while (!srcBy$src.has($i));// && j < $elsILen);//!!то что в $elsI может отсутствовать команда - проверено на этапе q_add
			}
//todo не медленно ли это?
			const scopeI = ocopy(req.scope),
				idx = elsI.idx;
			if (context.valName) {
				scopeI[context.valName] = context.value[idx];
			}
			if (context.keyName) {
				scopeI[context.keyName] = context.keys[idx];
			}
			arr[i] = new Q_arr($i, scopeI);
		}
//console.log(555, arr, req.str);
//todo  нужно переносить на стр - атрибуты мешаю рендерить фор->инк (1)
		return this.my.q_renderTag(arr, req.str, new Set(), req.sync);
	}
};
