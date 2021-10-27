import {renderTag, q_renderTag, dispatchLocalEvents, type_isLast, type_q_arr} from "./render.js";
import {Tpl_$src/*, isWhenVisibleName*/, qPackLength} from "../config.js";
import {$srcById, srcById, srcBy$src, descrById, createAttr, get$els} from "../descr.js";
import {preRender, is$hide, isAnimationVisible} from "../dom.js";
import {loadingCount} from "../util.js";

const renderParam = new Map();
export let curRender = Promise.resolve();
let Tpl_syncId = 0;
export const syncInRender = new Set();
let Tpl_delay = 0,
	Tpl_delayId = 0;
const delayPromiseStack = new Set();
//todo
export function setDelay(t, cb) {
	if (!cb) {
		Tpl_delay = t;
		return;
	}
	const old = Tpl_delay;
	Tpl_delay = t;
	cb();
	Tpl_delay = old;
}

self.curRender = curRender;
self.syncInRender = syncInRender;
self.setDelay = setDelay;

export function render($src = Tpl_$src, delay, scope, isLinking = false) {
	if (!srcBy$src.has($src)) {
		preRender($src, isLinking);
	}
	renderParam.set(srcBy$src.get($src).id, type_renderParam(scope || null, null, isLinking));
	return tryRender(delay);
}
self.Tpl_render = render;

export function renderBySrcIdSet(srcSet, delay) {
//console.log("renderBySrcIdSet", srcSet, cur$src);
	for (const sId of srcSet) {
		if ($srcById.has(sId)) {
			renderParam.set(sId, type_renderParam(null, null, false));
//		} else {
//			console.error($srcById[sId], sId, srcSet);//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
		}
	}
	tryRender(delay);
}
function tryRender(delay = Tpl_delay) {
	const delayId = ++Tpl_delayId;
	return new Promise(resolve => {
		setTimeout(() => {//по этому отмена не идёт сразу
			if (delayId !== Tpl_delayId || renderParam.size === 0) {
				delayPromiseStack.add(resolve);
				return;
			}
//			resolve(_tryRender());
			_tryRender()
				.then(resolve)
				.catch(err => {
//todo нужно подумать что еще надо почистить
					for (const s of syncInRender) {
						s.resolve();
					}
					syncInRender.clear();
					curRender = Promise.resolve();
					loadingCount.clear();
					throw err;
				});
		}, delay);
	});
}
function _tryRender() {
	const byD = prepareRenderParam(renderParam),
		repeatByD = new Map(),
		toCancleSync = new Set();
//console.log(11, new Set(syncInRender));
	if (syncInRender.size !== 0) {
		const toRemByD = new Set(),
			s = new Set();
		for (const sync of s) {
			if (sync.stat !== 0) {
				s.set(sync);
			}
		}
		for (const sync of s) {
//console.log("111", sync, new Map(byD));
			for (const [dId, p] of byD) {
				const curStat = sync.stat,
					stat = curStat === 0 ? checkSync(sync, p) : curStat;
				if (stat === 0) {
					continue;
				}
console.log("1repeat", stat, curStat, sync, p, dId);
				toCancleSync.add(sync);
//				toRemByD.add(dId);//!!1024 перенес ниже - когда то так было верно, а сейчас из-за toRemByD - нет
				if (curStat !== 0) {
					toRemByD.add(dId);
					continue;
				}
				toRemByD.add(dId);
//console.log("2repeat", stat, sync, sync.p.sId, p.srcIdSet, new Map(byD), dId);
//				byD.delete(dId);
				if (sync.p.renderParam.isLinking) {
					sync.p.renderParam.isLinking = false;
				}
				if (stat === 2) {
					//повторить + новый
					renderParam.set(sync.p.sId, sync.p.renderParam);
//console.log(111, p.srcIdSet.size);
					for (const sId of p.srcIdSet) {
						renderParam.set(sId, type_renderParam(null, null, false));
					}
//					for (const [dId, p] of prepareRenderParam(renderParam)) {
//						repeatByD.set(dId, p);
//					}
					continue;
				}
				if (stat === 3) {
					repeatByD.set(srcById.get(sync.p.sId).descr.id, sync.p);
					continue;
				}
				if (p.renderParam.isLinking) {
					p.renderParam.isLinking = false;
				}
				repeatByD.set(dId, p);
			}
		}
		if (toRemByD.size !== 0) {
			for (const dId of toRemByD) {
				byD.delete(dId);
			}
		}
		if (renderParam.size !== 0) {
			for (const [dId, p] of prepareRenderParam(renderParam)) {
				repeatByD.set(dId, p);
			}
		}
	}
/*todo
//if (syncInRender.size > 0) {
if (byD.has(46) || repeatByD.has(46)) {
	console.log(syncInRender, repeatByD, byD);
	alert(11);
//	debugger;
}*/
//todo
//console.log("_R", byD, repeatByD);
	if (byD.size !== 0) {
		const p = _render(byD, null);
		if (repeatByD.size === 0) {
			curRender = curRender
				.then(() => p);
		} else {
			curRender = curRender
				.then(() => _render(repeatByD, toCancleSync))
				.then(() => p);
		}
	} else if (repeatByD.size !== 0) {
		curRender = curRender
			.then(() => _render(repeatByD, toCancleSync));
	} else {
		return curRender;
	}
	if (delayPromiseStack.size !== 0) {
		const a = new Set(delayPromiseStack);
		delayPromiseStack.clear();
		curRender
			.then(() => {
				for (const delayResolve of a) {
					delayResolve();
				}
			});
	}
	return curRender;
}
function _render(byD, toCancleSync) {
	if (toCancleSync !== null) {
		for (const sync of toCancleSync) {
			syncInRender.delete(sync);
		}
	}
	const syncInThisRender = new Set(),
//		renderPack = [],
		pArr = [];
	if (self.Tpl_debugLevel !== 0) {
		debugInfo(byD, toCancleSync);
	}
//	for (const p of byD.values()) {
//		const sync = type_sync(++Tpl_syncId, p.sId, p);
//		syncInRender.add(sync);
//		syncInThisRender.add(sync);
//	}
//?? зачем два прохода? - из-за await
//	const syncIt = syncInThisRender.values();
	for (const [dId, p] of byD) {
//		const sync = syncIt.next().value;
		const sync = type_sync(++Tpl_syncId, p.sId, p);
		syncInRender.add(sync);
		syncInThisRender.add(sync);
//		if (!sync.p.renderParam.attr) {
		if (!p.renderParam.attr) {
			p.renderParam.attr = descrById.get(dId).attr;
		}
		const $sync = $srcById.get(sync.p.sId);

/*
		let $v = $sync;
		do {
			if (await getVal($v, null, isWhenVisibleName, false) !== undefined) {//тут скоп null, что не так быстро, как было бы если бы он был
				sync.isWhenVisible = true;
				break;
			}
			if ($v === Tpl_$src) {
				break;
			}
		} while ($v = $v.parentNode);
		if (sync.stat !== 0) {
			continue;
		}*/

		sync.isWhenVisible = true;

		const arrLen = p.srcIdSet.size;
		if (arrLen === 1) {
//			renderPack.push($sync, p, sync);
			pArr.push(renderTag($sync, p.renderParam.scope, p.renderParam.attr, sync));
			continue;
		}
		const arr = new Array(arrLen);
		let i = 0;
		for (const sId of p.srcIdSet) {
			arr[i++] = type_q_arr($srcById.get(sId), p.renderParam.scope);
		}
		pArr.push(_q_renderPack(p, sync, arr, arrLen, 0));//todo не понимаю, почему этот вариант быстрее!
//		pArr.push(q_renderTag(arr, p.renderParam.attr, type_isLast(), sync));
//была проблема с с() из-за потери ид для обновлении при отмене				.then(() => !console.log(123, srcIdSetByVarId.get(varIdByVarIdByProp[55].get("green")), arr) && q_renderTag(arr, p.renderParam.attr, type_isLast(), sync)));
	}
//	if (renderPack.length !== 0) {
//		pArr.push(_renderPack(renderPack, 0));
//	}
//self.syncInThisRender = syncInThisRender;
//alert(1);
	return Promise.all(pArr)
		.then(() => {
			renderLoop(syncInThisRender);
			const pArr = [];
			for (const s of syncInThisRender) {
				pArr.push(s.promise);
			}
			return Promise.all(pArr);
		})
//		.then(() => new Promise(resolve => renderLoop(syncInThisRender, resolve)))
		.then(() => {
			if (self.Tpl_debugLevel === 0) {
				return;
			}
			const s = new Set();
			for (const sync of syncInThisRender) {
				if (sync.stat === 0 || sync.stat === 4) {
					s.add(sync.p.sId);
				}
			}
			if (s.size !== 0) {
				console.info("ready =>", infoBySrcIdSet(s));
			}
		})
		.catch(err => {
			throw err;
		});
}
/*
function _renderPack(renderPack, c) {
	const l = qPackLength * (c + 1) * 3,
		ll = renderPack.length,
		len = l < ll ? l : ll;
	const pArr = [];
console.log(4444, qPackLength * c * 3, len, renderPack.length);
	for (let i = qPackLength * c * 3; i < len; i += 3) {
		pArr.push(renderTag(renderPack[i], renderPack[i + 1].renderParam.scope, renderPack[i + 1].renderParam.attr, renderPack[i + 2]));
	}
	if (l < ll) {
		return Promise.all(pArr)
			.then(() => _renderPack(renderPack, c + 1));
	}
	return Promise.all(pArr);
}*/
function _q_renderPack(p, sync, arr, arrLen, beginIdx) {
	const end = beginIdx + qPackLength;
	if (end < arrLen) {
		return q_renderTag(arr.slice(beginIdx, end), p.renderParam.attr, type_isLast(), sync)
			.then(() => _q_renderPack(p, sync, arr, arrLen, end));
	}
	return q_renderTag(arr.slice(beginIdx, arrLen), p.renderParam.attr, type_isLast(), sync);
}
function renderLoop(syncInThisRender) {
//for (const sync of syncInThisRender) {
//	console.warn(111111111, sync.syncId, sync.beforeAnimation.size, sync.animation.size, new Set(sync.afterAnimation));
//}
	const pArr = [];
//before
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.beforeAnimation.size === 0) {
			continue;
		}
		const animation = new Set(sync.beforeAnimation),
			aArr = new Array(animation.size);
		sync.beforeAnimation.clear();
		let i = 0;
		for (const a of animation) {
			aArr[i++] = a.handler();
		}
		pArr.push(Promise.all(aArr)
			.then(() => animationsReady(animation)));
	}
	if (pArr.length !== 0) {
		Promise.all(pArr)
			.then(() => renderLoop(syncInThisRender));
		return;
	}
//amination
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.animation.size === 0) {
			continue;
		}
		const animation = new Set(sync.animation);
		sync.animation.clear();
		const p = addAnimation(sync, animation, syncInThisRender);
		if (p !== null) {
			pArr.push(p);
//		} else {
//todo
//console.log(11111111111111111);
		}
	}
	if (pArr.length !== 0) {
		Promise.all(pArr)
			.then(() => renderLoop(syncInThisRender));
		return;
	}
//after
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.afterAnimation.size === 0) {
			continue;
		}
		const animation = new Set(sync.afterAnimation),
			aArr = new Array(animation.size);
		sync.afterAnimation.clear();
		let i = 0;
		for (const a of animation) {
			aArr[i++] = a.handler();
		}
		pArr.push(Promise.all(aArr)
			.then(() => animationsReady(animation)));
	}
	if (pArr.length !== 0) {
		Promise.all(pArr)
			.then(() => renderLoop(syncInThisRender));
		return;
	}
//scroll
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.scrollAnimation.size === 0) {
			continue;
		}
		return;
	}
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0) {
			continue;
		}
		//todo подумать - наверное есть другой способ - слишком жирно для одного вотч-а
		if (sync.onready.size !== 0) {
			for (const h of sync.onready) {
				h();
			}
		}
		sync.stat = 4;
		sync.resolve();
		syncInRender.delete(sync);
/*
		for (const [iId, p] of sync.local) {
			if (p.animationsCount !== 0) {
				console.log(222222, iId, p);
			}
		}*/
	}
}
export function addAnimation(sync, animation, syncInThisRender) {
//todo
if (sync.stat !== 0) {
console.warn(111111111111111111);
	return null;
}
	const toNow = syncInThisRender !== null ? new Set() : animation,
		toDefered = new Set();//,
//		isScroll = document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight;//todo width
	if (toNow.size === 0) {
		for (const a of animation) {
			if (isAnimationVisible(a)) {
				toNow.add(a);
				continue;
			}
			if (!sync.isWhenVisible) {// && isScroll) {
				toDefered.add(a);
				continue;
			}
			if (a.promise !== null) {
				continue;
			}
			sync.scrollAnimation.add(a);
			a.promise = new Promise(resolve => {
				a.resolve = resolve;
			})
				.then(() => {
					sync.scrollAnimation.delete(a);
//					for (const i of syncInThisRender) {
//						if (i.scrollAnimation.size !== 0 && i.stat === 0) {
//							return;
//						}
//					}
//console.log(syncInThisRender, sync);
//alert(1)
					renderLoop(syncInThisRender);
				});
		}
	}
//console.error(toNow.size, toDefered.size, sync.scrollAnimation.size);//, isScroll);
//alert(1);
	if (toNow.size !== 0) {
		return new Promise(rafResolve => {
			const rafId = requestAnimationFrame(() => {
				sync.animationFrame.delete(rafId);
				if (sync.stat !== 0) {
					rafResolve();
					return;
				}
//				const pArr = [];
				for (const a of toNow) {
					a.handler();
					if (a.promise !== null) {
						a.resolve();
//						pArr.push(a);
//						sync.scrollAnimation.delete(a);
					}
				}
				animationsReady(toNow);
//				if (pArr.length) {
//					renderLoop(syncInThisRender);
//				}
				if (toDefered.size === 0) {
					rafResolve();
					return;
				}
				requestIdleCallback(() => {
					if (sync.stat !== 0) {
						rafResolve();
						return;
					}
					addAnimation(sync, toDefered, null, null)
						.then(rafResolve);
				}, {
					timeout: 1000
				});
			});
			sync.animationFrame.set(rafId, rafResolve);
		});
	}
	if (toDefered.size === 0) {
		return null;
	}
	return new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			sync.idleCallback.delete(ricId);
			requestAnimationFrame(() => {
				if (sync.stat !== 0) {
					ricResolve();
					return;
				}
				for (const a of toDefered) {
					a.handler();
//					if (a.promise !== null) {
//						a.resolve();
//						sync.scrollAnimation.delete(a);
//					}
				}
				animationsReady(toDefered);
				ricResolve();
			});
		}, {
			timeout: 1000
		});
		sync.idleCallback.set(ricId, ricResolve);
	});
}
export function animationsReady(animation) {
	const lSet = new Set();
	for (const a of animation) {
		lSet.add(a.local);
	}
	const local = new Map();
	for (const lMap of lSet) {
		for (const [sId, l] of lMap) {
//todo
//if (local.has(sId)) {
//	console.warn(234234, sId, l === local.get(sId), local);
//}
			if (!local.has(sId)) {
				local.set(sId, l);
			}
		}
	}
	dispatchLocalEvents(local);
}
function prepareRenderParam(renderParam) {
//	const renderParamByDescrId = new Map(),
	const byD = new Map();
console.log("prepareRenderParam", new Map(renderParam));
//console.time("p1")
	for (const [sId, r] of renderParam) {
		const src = srcById.get(sId);
		if (src === undefined) {//удалённые элементы, ссылки на переменные еще могут остаться так как они удаляются в фоне
			continue;
		}
		const descr = src.descr,
			dId = descr.id,
			p = byD.get(dId);
		if (p !== undefined) {
			if (descr.asOneSet === null) {//!!если в byD уже есть для этого описания, то это должен быть ку алгоритм
				p.srcIdSet.add(sId);
			}
			continue;
		}
		if (descr.asOneSet === null) {
			byD.set(dId, type_prepareByD(sId, new Set([sId]), r));
			continue;
		}
		//<div foreach><div foreach<-если мы здесь
		const $parentSet = new Set(),
			srcIdSet = new Set();
		for (const jId of descr.srcIdSet) {
			const $p = $srcById.get(jId).parentNode;
			if ($parentSet.has($p)) {
				continue;
			}
			$parentSet.add($p);
			srcIdSet.add(jId);
		}
		byD.set(dId, type_prepareByD(sId, srcIdSet, r));
	}
//console.timeEnd("p1")
//console.time("p2")
	for (const [dId, p] of byD) {//вычисляем когда мнго элементов типа: if-else or inc и оставляем только первый dId
		const $i = $srcById.get(p.sId);
		if (is$hide($i)) {//если элеменит скрыт template-ом
			byD.delete(dId);
//console.warn(byD.delete, dId);
			continue;
		}
		const descr = descrById.get(dId);
//console.log(descr.asOneSet !== null, descr.get$elsByStr === null, $i)
		if (descr.asOneSet !== null || descr.get$elsByStr === null) {
			continue;
		}
		const $els = get$els($i, descr.get$elsByStr, ""),
			$elsLen = $els.length;
		if ($elsLen === 1) {
			continue;
		}
		//if-else
		for (let i = 0; i < $elsLen; i++) {
			const iSrc = srcBy$src.get($els[i]);
			if (iSrc === undefined) {
				continue;
			}
			const iDId = iSrc.descr.id;
			if (iDId !== dId) {// && byD.has(iDId)) {
				byD.delete(iDId);
//console.warn(byD.delete, dId);
			}
		}
		p.$els = $els;//нужен для getPosStat() при проверке на отмену
	}
//console.timeEnd("p2")
//console.time("p3")
	const mergeByD = new Map(),
		$top = Tpl_$src.parentNode;
	for (const [dId, p] of byD) {//размечаем глубины и расширяем для get$els
		let $i = $srcById.get(p.sId),
			iSrc = srcBy$src.get($i);
		const mI = type_prepareMerge(0, iSrc.asOneIdx !== null ? iSrc.asOneIdx.values().next().value : "");
		mergeByD.set(dId, mI);
		for (; $i !== $top; $i = $i.parentNode, iSrc = srcBy$src.get($i)) {
/*
			if ($i === $top) {
				for (const iId of p.srcIdSet) {
//todo!!!!!!--
					if (iId !== p.sId && is$hide($srcById[iId])) {//из-за чего может получится что элемент в рендере и его нет в доме?
						p.srcIdSet.delete(iId);
					}
				}
//				renderParamByDescrId.set(dId, p);
				break;
			}*/
/*
			const iDId = $i[p_descrId];
			if (!iDId) {//защита от документФрагмента
//todo--
console.warn(2222, $i);
alert(222);
			}*/
                        const iDescr = iSrc.descr;
//change on firstAsOneIdx			if (iSrc.asOneIdx !== null && iSrc.id === p.sId) {
//				mI.asOneIdx.add(iSrc.asOneIdx.values().next().value);
//			} else 
			if (iDescr.get$elsByStr !== null) {
				const $els = get$els($i, iDescr.get$elsByStr, "");//todo <-- $els - для первого $i мы ранее уже вычисляли $els
//				if ($els) {
					for (let j = $els.length - 1; j > -1; j--) {
						const iSrc = srcBy$src.get($els[j]);
						if (iSrc !== undefined) {
							mI.descrId.add(iSrc.descr.id);
						}
					}
//				}
			} else {
				mI.descrId.add(iDescr.id);
			}
			mI.len++;
		}
	}
//console.timeEnd("p3")
//console.time("p4")
	const byDArr = Array.from(byD.keys()),
		byDArrLen = byDArr.length;
	for (let i = 0; i < byDArrLen; i++) {
		const iDId = byDArr[i];
//		if (!byD.has(iDId)) {
		if (iDId === 0) {
			continue;
		}
		const mI = mergeByD.get(iDId);
		for (let j = 0; j < byDArrLen; j++) {
			const jDId = byDArr[j];
			if (jDId === 0 || iDId === jDId) {
				continue;
			}
			const mJ = mergeByD.get(jDId);
			if (mI.len > mJ.len) {
				continue;
			}
//			if (mI.len !== mJ.len && mJ.descrId.has(iDId)) {
			if (mJ.descrId.has(iDId)) {
				byD.delete(jDId);
//console.warn(byD.delete, jDId);
				byDArr[j] = 0;
				continue;
			}
			if (mI.firstAsOneIdx !== "" && mI.firstAsOneIdx === mJ.firstAsOneIdx) {
				byD.delete(jDId);
//console.warn(byD.delete, dId);
				byDArr[j] = 0;
			}
/*
//change on firstAsOneIdx
			if (mI.asOneIdx.size === 0 || mJ.asOneIdx.size === 0) {
				continue;
			}
			for (const i of mI.asOneIdx) {
				if (mJ.asOneIdx.has(i)) {
					byD.delete(jDId);
//console.warn(byD.delete, dId);
					byDArr[j] = 0;
					break;
				}
			}*/
/*
			const mJ = mergeByD.get(jDId);
//console.log(2, mI, mJ, iDId, jDId);
			if (mI.len < mJ.len) {
				if (mJ.descrId.has(iDId)) {
					byD.delete(jDId);
					byDArr[j] = 0;
					continue;
				}
				if (mI.asOneIdx.size === 0 || mJ.asOneIdx.size === 0) {
					continue;
				}
				for (const i of mI.asOneIdx) {
					if (mJ.asOneIdx.has(i)) {
						byD.delete(jDId);
						byDArr[j] = 0;
						break;
					}
				}
				continue;
			}
//			if (mI.len > mJ.len && mI.descrId.has(jDId)) {
//			if (mI.len > mJ.len && mI.descrId[jDId]) {
			if (mI.len === mJ.len) {
				continue;
			}
			if (mI.descrId.has(jDId)) {
				byD.delete(iDId);
				break;
			}
			if (mI.asOneIdx.size === 0 || mJ.asOneIdx.size === 0) {
				continue;
			}
			let f = false;
			for (const idx of mJ.asOneIdx) {
				if (mI.asOneIdx.has(idx)) {
					byD.delete(iDId);
					f = true;
					break;
				}
			}
			if (f) {
				break;
			}*/
		}
	}
//console.timeEnd("p4")
	renderParam.clear();
console.log(2, new Map(byD));
//alert(1);
	return byD;
}
function checkSync(sync, prepareByD) {
//0 - parallel
//1 - new above
//2 - new eq
//3 - new below
//4 - ready
//console.log("cancel", sync.stat, sync, p);
	if (sync.stat !== 0) {
		return getPosStat(sync.p.sId, prepareByD);
	}
	const stat = getPosStat(sync.p.sId, prepareByD);
//	if (stat !== 0) {
//		_cancelSync(sync, stat);
//	}
	if (stat === 0) {
		return stat;
	}
	sync.stat = stat;
	sync.resolve();
//--	syncInRender.delete(sync);

//	dispatchLocalEvents(local);
	for (const [id, r] of sync.idleCallback) {
		cancelIdleCallback(id);
		r();
	}
	for (const [id, r] of sync.animationFrame) {
		cancelAnimationFrame(id);
		r();
	}
	for (const a of sync.scrollAnimation) {
		a.resolve();
	}
/*
	sync.scrollAnimation.clear();
	sync.beforeAnimation.clear();
	sync.animation.clear();
	sync.afterAnimation.clear();*/
	return stat;
}
function getPosStat(sId, prepareByD) {
	const $src = $srcById.get(sId);
//todo--
if (!$src) {
	throw new Error("!!! checkSync - hz");
}
	const $top = Tpl_$src.parentNode;
	if (prepareByD.$els === null) {
		for (let $i = $src; $i !== $top; $i = $i.parentNode) {
			const iId = srcBy$src.get($i).id;
			if (prepareByD.srcIdSet.has(iId)) {
				return iId === sId ? 2 : 1;
			}
		}
	} else {
		const $elsLen = prepareByD.$els.length;
		for (let i, $i = $src; $i !== $top; $i = $i.parentNode) {
			for (i = 0; i < $elsLen; i++) {
//				const iId = srcBy$src.get($i).id;
//				if (srcBy$src.get(prepareByD.$els[i]).id === iId) {
//					return iId === sId ? 2 : 1;
				if (prepareByD.$els[i] === $i) {
					return srcBy$src.get($i).id === sId ? 2 : 1;
				}
			}
		}
	}
//todo think about
	for (let $i = $srcById.get(prepareByD.sId).parentNode; $i !== $top; $i = $i.parentNode) {
		if (srcBy$src.get($i).id === sId) {
			return 3;
		}
	}
	return 0;
}
//todo удалить - я пока не вижу смысла в эих параметрах
function type_renderParam(scope, attr, isLinking) {
	return {
		scope,
		attr,
		isLinking
	};
}
function type_prepareMerge(len, firstAsOneIdx) {
	return {
		len,
		descrId: new Set(),
		firstAsOneIdx
//		asOneIdx: new Set()
	};
}
function type_prepareByD(sId, srcIdSet, renderParam) {
	return {
		sId,
		srcIdSet,
		$els: null,
		renderParam
	};
}
function type_sync(syncId, sId, p) {
	let resolve;
	const promise = new Promise(res => resolve = res);
	return {
		syncId,
//--		sId,
		p,
		isWhenVisible: false,

		beforeAnimation: new Set(),
		animation: new Set(),
		afterAnimation: new Set(),
		scrollAnimation: new Set(),
		onready: new Set(),

		idleCallback: new Map(),
		animationFrame: new Map(),
		stat: 0,
		promise,
		resolve
	};
}
function debugInfo(byD, toCancleSync) {
	const info = [];
	if (toCancleSync !== null) {
		const s = new Set();
		for (const i of toCancleSync) {
			s.add(i.p.sId);
		}
		info.push("cancel =>", infoBySrcIdSet(s), "\n");
	}
	const s = new Set();
	for (const p of byD.values()) {
		s.add(p.sId);
	}
	info.push("render =>", infoBySrcIdSet(s));
//		return {
//			dId: p[0],
//			sId,
//			$src: $srcById[sId],
//			srcIdSet: p[1].srcIdSet
//		};
	console.info(...info);//, "renderParam =>", Array.from(renderParam).map(p => ({
//		sId: p[0],
//		$src: $srcById[p[0]],
//		attr: p[1].attr
//	})));
}
function infoBySrcIdSet(sIdSet) {
	const i = {};
	for (const sId of sIdSet) {
		i[sId] = $srcById.get(sId);
	}
	return i;
}
