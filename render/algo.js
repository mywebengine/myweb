import {renderTag, q_renderTag, dispatchLocalEvents, type_isLast, type_q_arr} from "./render.js";
import {Tpl_$src/*, isWhenVisibleName*/, qPackLength} from "../config.js";
import {$srcById, srcById, srcBy$src, descrById, get$els} from "../descr.js";
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

export function renderBySrcIds(srcs, delay) {
//console.log("renderBySrcIds", srcs, cur$src);
	for (const sId of srcs) {
		if ($srcById.has(sId)) {
			renderParam.set(sId, type_renderParam(null, null, false));
//		} else {
//			console.error($srcById[sId], sId, srcs);//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
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
	const toCancleSync = new Set(),
		byD = prepareRenderParam(renderParam, toCancleSync),
		repeatByD = new Map();
	if (syncInRender.size !== 0) {
		const toRemByD = new Set(),
			s = new Set();//для того: если были уже отменены синки и мы их пустим на проверку то полдучится, что новые параметры будут удалены из-за условия curStat !== 0
		for (const sync of syncInRender) {
			if (sync.stat === 0) {//могут отмениться в prepareRenderParam
				s.add(sync);
			}
		}
		for (const sync of s) {
			for (const [dId, p] of byD) {
				const curStat = sync.stat,
					stat = curStat === 0 ? checkSync(sync, p) : curStat;
//console.log("1repeat", stat, curStat, sync.p.sId, p.sId, dId);
				if (stat === 0) {
					continue;
				}
				if (curStat !== 0) {
					if (stat === 3) {
						toRemByD.add(dId);
					}
					continue;
				}
				toCancleSync.add(sync);
				toRemByD.add(dId);//чтобы для следующих синков иметь возможнасть отменить их - для случая если этот ниже
				if (sync.p.renderParam.isLinking) {
					sync.p.renderParam.isLinking = false;
				}
				if (stat === 2) {//eq
					//повторить + новый
					renderParam.set(sync.p.sId, sync.p.renderParam);
					for (const sId of p.srcIds) {
						renderParam.set(sId, type_renderParam(null, null, false));
					}
					continue;
				}
				if (stat === 3) {//below
					repeatByD.set(srcById.get(sync.p.sId).descr.id, sync.p);
					continue;
				}
				//above
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
			for (const [dId, p] of prepareRenderParam(renderParam, toCancleSync)) {
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
//console.log("_R", byD, repeatByD, toCancleSync);
//alert(1)
	if (toCancleSync.size !== 0) {
		for (const sync of toCancleSync) {
			syncInRender.delete(sync);
			sync.resolve();
		}
	}
	if (byD.size !== 0) {
		const p = _render(byD);
		if (repeatByD.size === 0) {
			curRender = curRender
				.then(() => p);
		} else {
			curRender = curRender
				.then(() => _render(repeatByD))
				.then(() => p);
		}
	} else if (repeatByD.size !== 0) {
		curRender = curRender
			.then(() => _render(repeatByD));
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
function _render(byD) {
	if (self.Tpl_debugLevel !== 0) {
		debugInfo(byD);
	}
	const syncInThisRender = new Set(),
//		renderPack = [],
		pArr = [];
//	for (const p of byD.values()) {
//		const sync = type_sync(++Tpl_syncId, p);
//		syncInRender.add(sync);
//		syncInThisRender.add(sync);
//	}
//?? зачем два прохода? - из-за await
//	const syncIt = syncInThisRender.values();
	for (const [dId, p] of byD) {
//		const sync = syncIt.next().value;
		const sync = type_sync(++Tpl_syncId, p);
		syncInRender.add(sync);
		syncInThisRender.add(sync);
//		if (!sync.p.renderParam.attr) {
		if (!p.renderParam.attr) {
			p.renderParam.attr = descrById.get(dId).attr;
		}
		const $sync = $srcById.get(sync.p.sId);
		if ($sync === undefined) {
//todo
console.warn("_render !", sync.p.sId, sync);
			continue;
		}

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

		const arrLen = p.srcIds.size;
		if (arrLen === 1) {
//			renderPack.push($sync, p, sync);
			pArr.push(renderTag($sync, p.renderParam.scope, p.renderParam.attr, sync));
			continue;
		}
		const arr = new Array(arrLen);
		let i = 0;
		for (const sId of p.srcIds) {
			arr[i++] = type_q_arr($srcById.get(sId), p.renderParam.scope);
		}
		pArr.push(_q_renderPack(p, sync, arr, arrLen, 0));//todo не понимаю, почему этот вариант быстрее!
//		pArr.push(q_renderTag(arr, p.renderParam.attr, type_isLast(), sync));
//была проблема с с() из-за потери ид для обновлении при отмене				.then(() => !console.log(123, srcIdsByVarId.get(varIdByVarIdByProp[55].get("green")), arr) && q_renderTag(arr, p.renderParam.attr, type_isLast(), sync)));
	}
//	if (renderPack.length !== 0) {
//		pArr.push(_renderPack(renderPack, 0));
//	}
//self.syncInThisRender = syncInThisRender;
//alert(1);
	return Promise.all(pArr)
		.then(() => {
			const pArr = [];
			for (const sync of syncInThisRender) {
				pArr.push(sync.promise);
				sync.promise
					.then(() => {
						if (self.Tpl_debugLevel === 0) {
							return;
						}
						if (sync.stat === 0 || sync.stat === 7) {
							console.info("ready =>", infoBySrcIds([sync.p.sId]));
							return;
						}
						console.info("cancel =>", infoBySrcIds([sync.p.sId]));
					});
			}
			renderLoop(syncInThisRender);
			return Promise.all(pArr);
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
export function renderLoop(syncInThisRender) {
	const pSet = new Set();
//before
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.beforeAnimations.size === 0) {
			continue;
		}
		const animation = new Set(sync.beforeAnimations),
			aArr = new Array(animation.size);
		sync.beforeAnimations.clear();
		let i = 0;
		for (const a of animation) {
			aArr[i++] = a.handler();
		}
		pSet.add(Promise.all(aArr)
			.then(() => animationsReady(sync, animation)));
	}
	if (pSet.size !== 0) {
		Promise.all(pSet)
			.then(syncArr => renderLoop(syncArr));
		return;
	}
//amination
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.animations.size === 0) {
			continue;
		}
		const animation = new Set(sync.animations);
		sync.animations.clear();
		const p = addAnimation(sync, animation, false);
		if (p !== null) {
			pSet.add(p);
//		} else {
//todo
//console.log(11111111111111111);
		}
	}
	if (pSet.size !== 0) {
		Promise.all(pSet)
			.then(syncArr => renderLoop(syncArr));
		return;
	}
//after
	for (const sync of syncInThisRender) {
		if (sync.stat !== 0 || sync.afterAnimations.size === 0) {
			continue;
		}
		const animation = new Set(sync.afterAnimations),
			aArr = new Array(animation.size);
		sync.afterAnimations.clear();
		let i = 0;
		for (const a of animation) {
			aArr[i++] = a.handler();
		}
		pSet.add(Promise.all(aArr)
			.then(() => animationsReady(sync, animation)));
	}
	if (pSet.size !== 0) {
		Promise.all(pSet)
			.then(syncArr => renderLoop(syncArr));
		return;
	}
//scroll
	for (const sync of syncInThisRender) {
//console.log(sync, sync.stat, sync.scrollAnimations.size, sync.idleCallback.size)
		if (sync.stat === 0 && (sync.scrollAnimations.size !== 0 || sync.idleCallback.size !== 0)) {// || sync.animationFrame.size === 0) {
			continue;
		}
//		return;
//	}
//	for (const sync of syncInThisRender) {
		if (sync.stat !== 0) {
console.warn(23423423423);
			syncInRender.delete(sync);
			sync.resolve();
			continue;
		}
		//todo подумать - наверное есть другой способ - слишком жирно для одного вотч-а
		if (sync.onreadies.size !== 0) {
			for (const h of sync.onreadies) {
				h();
			}
		}
		sync.stat = 7;
		syncInRender.delete(sync);
		sync.resolve();
/*
		for (const [iId, p] of sync.local) {
			if (p.animationsCount !== 0) {
				console.log(222222, iId, p);
			}
		}*/
	}
}
export function addAnimation(sync, animation, isSet) {
//todo
if (sync.stat !== 0) {
console.warn(1111111111);
	return sync;
}
//	const isSet = syncInThisRender === null,
	const nows = isSet ? animation : new Set(),
		deferreds = new Set();
	if (!isSet) {
		for (const a of animation) {
//todo
if (a.promise) {
	console.warn("a.promise !== null");
	alert(1)
	continue;
}
			if (isAnimationVisible(a)) {
				nows.add(a);
				continue;
			}
			if (!sync.isWhenVisible) {
				deferreds.add(a);
				continue;
			}
			sync.scrollAnimations.add(a);
//todo
a.promise = 1;
		}
	}
//console.error(nows.size, deferreds.size, sync.scrollAnimations.size, isSet);
//alert(1);
	if (nows.size !== 0) {
		return new Promise(rafResolve => {
			const rafId = requestAnimationFrame(() => {
				sync.animationFrame.delete(rafId);
				if (sync.stat !== 0) {
					rafResolve(sync);
					return;
				}
				for (const a of nows) {
					a.handler();
				}
				animationsReady(sync, nows);
				if (deferreds.size === 0) {
					rafResolve(sync);
					return;
				}
				requestIdleCallback(() => {
					if (sync.stat !== 0) {
						rafResolve(sync);
						return;
					}
					addAnimation(sync, deferreds, false)
						.then(rafResolve);
				}, {
					timeout: 1000
				});
			});
			sync.animationFrame.set(rafId, rafResolve);
		});
	}
	if (deferreds.size === 0) {
		return sync;
	}
	return new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			sync.idleCallback.delete(ricId);
			requestAnimationFrame(() => {
				if (sync.stat !== 0) {
					ricResolve(sync);
					return;
				}
				for (const a of deferreds) {
					a.handler();
				}
				animationsReady(sync, deferreds);
				ricResolve(sync);
				return;
			});
		}, {
			timeout: 1000
		});
		sync.idleCallback.set(ricId, ricResolve);
	});
}
function animationsReady(sync, animation) {
	const ls = new Set(),
		local = new Map();
	for (const a of animation) {
//todo
		if (!ls.has(a.local)) {
//console.warn("lSet.has(a.local)");
			ls.add(a.local);
		}
	}
	for (const lMap of ls) {
		for (const [sId, l] of lMap) {
//todo
//if (local.has(sId)) {
//	console.warn(234234, sId, l === local.get(sId), local);
//}
//			if (!local.has(sId)) {
				local.set(sId, l);
//			}
		}
	}
	dispatchLocalEvents(local);
	return sync;
}
function prepareRenderParam(renderParam, toCancleSync) {
//	const renderParamByDescrId = new Map(),
	const byD = new Map();
//console.log("prepareRenderParam", new Map(renderParam));
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
			if (descr.asOnes === null) {//!!если в byD уже есть для этого описания, то это должен быть ку алгоритм
				p.srcIds.add(sId);
			}
			continue;
		}
		if (descr.asOnes === null) {
			byD.set(dId, type_prepareByD(sId, new Set([sId]), r));
			continue;
		}
		//<div foreach><div foreach<-если мы здесь
		const $parents = new Set(),
			srcIds = new Set();
		for (const jId of descr.srcIds) {
			const $p = $srcById.get(jId).parentNode;
			if ($parents.has($p)) {
				continue;
			}
			$parents.add($p);
			srcIds.add(jId);
		}
		byD.set(dId, type_prepareByD(sId, srcIds, r));
	}
//console.timeEnd("p1")
//console.time("p2")
	for (const [dId, p] of byD) {//вычисляем когда мнго элементов типа: if-else or inc и оставляем только первый dId
		const $i = $srcById.get(p.sId);
		if (is$hide($i)) {//если элеменит скрыт template-ом
			prpDeleteDescrId(byD, dId, toCancleSync);
			continue;
		}
		const descr = descrById.get(dId);
		if (descr.asOnes !== null || descr.get$elsByStr === null) {
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
				prpDeleteDescrId(byD, iDId, toCancleSync);
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
		const mI = type_prepareMerge(0, iSrc.asOneIdx !== null ? iSrc.asOneIdx.values().next().value : 0);
		mergeByD.set(dId, mI);
		for (; $i !== $top; $i = $i.parentNode, iSrc = srcBy$src.get($i)) {
/*
			if ($i === $top) {
				for (const iId of p.srcIds) {
//todo!!!!!!--
					if (iId !== p.sId && is$hide($srcById[iId])) {//из-за чего может получится что элемент в рендере и его нет в доме?
						p.srcIds.delete(iId);
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
			mI.len++;
                        const iDescr = iSrc.descr;
			if (iSrc.asOneIdx !== null || iDescr.get$elsByStr === null) {
				mI.descrId.add(iDescr.id);
				continue;
			}
			const $els = get$els($i, iDescr.get$elsByStr, "");//todo <-- $els - для первого $i мы ранее уже вычисляли $els
//			if ($els) {
				for (let j = $els.length - 1; j > -1; j--) {
					const iSrc = srcBy$src.get($els[j]);
					if (iSrc !== undefined) {
						mI.descrId.add(iSrc.descr.id);
					}
				}
//			}
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
				prpDeleteDescrId(byD, jDId, toCancleSync);
				byDArr[j] = 0;
				continue;
			}
//console.log(444, mI.firstAsOneIdx, mJ.firstAsOneIdx, iDId, jDId)
			if (mI.firstAsOneIdx !== 0 && mI.firstAsOneIdx === mJ.firstAsOneIdx) {
				prpDeleteDescrId(byD, jDId, toCancleSync);
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
//console.log(2, new Map(byD), toCancleSync);
//alert(1);
	return byD;
}
function prpDeleteDescrId(byD, dId, toCancleSync) {
	if (!byD.has(dId)) {
		return;
	}
	const s = byD.get(dId).srcIds;
//	let sId;
	for (const sync of syncInRender) {
//		sId = sync.p.sId;
//		for (let l = sync.local.get(sId); l.newSrcId !== 0; l = sync.local.get(sId)) {
//			sId = l.newSrcId;
//		}
		if (s.has(sync.p.sId)) {
			sync.stat = 4;
			toCancleSync.add(sync);
		}
	}
	byD.delete(dId);
}
function checkSync(sync, prepareByD) {
//0 - parallel
//1 - new above
//2 - new eq
//3 - new below
//4 - by prepare
//5 - not found sync p.sId
//7 - ready
//console.log("cancel", sync.stat, sync, p);
	if (sync.stat !== 0) {
		return getPosStat(sync, prepareByD);
	}
	const stat = getPosStat(sync, prepareByD);
//	if (stat !== 0) {
//		_cancelSync(sync, stat);
//	}
	if (stat === 0) {
		return stat;
	}
	sync.stat = stat;
//	sync.resolve();
//	syncInRender.delete(sync);

//	dispatchLocalEvents(local);
	for (const [id, r] of sync.idleCallback) {
		cancelIdleCallback(id);
		r(sync);
	}
	for (const [id, r] of sync.animationFrame) {
		cancelAnimationFrame(id);
		r(sync);
	}
//	for (const a of sync.scrollAnimations) {
//		a.resolve();
//	}
/*
	sync.scrollAnimations.clear();
	sync.beforeAnimations.clear();
	sync.animations.clear();
	sync.afterAnimations.clear();*/
	return stat;
}
function getPosStat(sync, prepareByD) {
	let sId = sync.p.sId;
	if (!srcById.has(sId)) {
		for (let l = sync.local.get(sId); l.newSrcId !== 0; l = sync.local.get(sId)) {
			sId = l.newSrcId;
		}
	}
	const $src = $srcById.get(sId);
//todo--
	if ($src === undefined) {
//		throw new Error("!!! checkSync - hz " + sId);
		console.warn("!!! checkSync - hz " + sId);
		return 5;
	}
	const $top = Tpl_$src.parentNode;
	if (prepareByD.$els === null) {
		for (let $i = $src; $i !== $top; $i = $i.parentNode) {
			const iId = srcBy$src.get($i).id;
			if (prepareByD.srcIds.has(iId)) {
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
function type_prepareByD(sId, srcIds, renderParam) {
	return {
		sId,
		srcIds,
		$els: null,
		renderParam
	};
}
function type_sync(syncId, p) {
	let resolve;
	const promise = new Promise(res => resolve = res);
	return {
		syncId,
		p,
		isWhenVisible: false,
		local: new Map(),

		beforeAnimations: new Set(),
		animations: new Set(),
		afterAnimations: new Set(),
		scrollAnimations: new Set(),
		onreadies: new Set(),

		idleCallback: new Map(),
		animationFrame: new Map(),
		stat: 0,
		promise,
		resolve
	};
}
function debugInfo(byD) {
	const s = new Set();
	for (const p of byD.values()) {
		s.add(p.sId);
	}
	console.info("render =>", infoBySrcIds(s));
}
function infoBySrcIds(sIds) {
	const i = {};
	for (const sId of sIds) {
		i[sId] = $srcById.get(sId);
	}
	return i;
}
