import {renderTag, q_renderTag, dispatchLocalEvents, type_isLast, type_q_arr, type_animation} from "./render.js";
import {mw_$src, renderPackSize, lazyRenderName, defIdleCallbackOpt} from "../config.js";
import {$srcById, srcById, srcBy$src, descrById, get$els} from "../descr.js";
import {preRender, is$hide, is$visible, isAnimationVisible} from "../dom.js";
import {loadingCount} from "./loading.js";

const renderParams = new Set();
let mw_delay = 0,
	mw_delayId = 0,
	mw_syncId = 0;
const delayParams = new Set();
export const syncInRender = new Set();
export let curRender = Promise.resolve();

export function render($src = mw_$src, delay, scope, isLinking = false) {
	if (!srcBy$src.has($src)) {
		preRender($src, isLinking);
	}
	const sId = srcBy$src.get($src).id;
	renderParams.add(type_renderParam(sId, scope || null, null, isLinking));
	return tryRender(delay, sId);
}
export function renderBySrcIds(srcs, delay) {
	for (const sId of srcs) {
		if ($srcById.has(sId)) {//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
			renderParams.add(type_renderParam(sId, null, null, false));
		}
	}
	tryRender(delay, 0);
}
export function setDelay(t, cb) {
	if (!cb) {
		mw_delay = t;
		return;
	}
	const old = mw_delay;
	mw_delay = t;
	cb();
	mw_delay = old;
}
function tryRender(delay = mw_delay, sId) {
	const delayId = ++mw_delayId;
	return new Promise((resolve, reject) => {
		setTimeout(() => {//по этому отмена не идёт сразу
			if (sId !== 0) {
				delayParams.add(type_delayParam(sId, resolve, reject));
			}
			if (delayId !== mw_delayId || renderParams.size === 0) {
				return;
			}
			const delayP = new Set(delayParams);
			delayParams.clear();
			_tryRender(delayP)
				.then(resolve)
				.catch(err => {
//todo нужно подумать что еще надо почистить
					for (const sync of syncInRender) {
						sync.resolve();
					}
					syncInRender.clear();
					curRender = Promise.resolve();
					loadingCount.clear();
//					throw err;
					reject(err);
				});
		}, delay);
	});
}
function _tryRender(delayP) {
	const toCancleSync = new Set(),
		byD = prepareRenderParam(toCancleSync),
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
			for (const [dId, r] of byD) {
				const curStat = sync.stat,
					stat = curStat === 0 ? checkSync(sync, r) : curStat;
//console.log("1repeat", stat, curStat, sync.renderParam.sId, r.sId, dId);
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
				if (sync.renderParam.isLinking) {
					sync.renderParam.isLinking = false;
				}
				if (stat === 2) {//eq
					//повторить + новый
					renderParams.add(sync.renderParam);
					for (const sId of r.srcIds) {
						renderParams.add(type_renderParam(sId, null, null, false));
					}
					continue;
				}
				if (stat === 3) {//below
					repeatByD.set(srcById.get(sync.renderParam.sId).descr.id, sync.renderParam);
					continue;
				}
				//above
				if (r.isLinking) {
					r.isLinking = false;
				}
				repeatByD.set(dId, r);
			}
		}
		if (toRemByD.size !== 0) {
			for (const dId of toRemByD) {
				byD.delete(dId);
			}
		}
		if (renderParams.size !== 0) {
			for (const [dId, r] of prepareRenderParam(toCancleSync)) {
				repeatByD.set(dId, r);
			}
		}
	}
//console.log("_R", byD, repeatByD, toCancleSync);
	if (toCancleSync.size !== 0) {
		for (const sync of toCancleSync) {
			syncInRender.delete(sync);
			sync.resolve();
		}
	}
	if (byD.size !== 0) {
		const p = _render(byD, delayP);
		if (repeatByD.size === 0) {
			curRender = curRender
				.then(() => p);
		} else {
			curRender = curRender
				.then(() => _render(repeatByD, delayP))
				.then(() => p);
		}
	} else if (repeatByD.size !== 0) {
		curRender = curRender
			.then(() => _render(repeatByD, delayP));
//	} else {
//		return curRender;
	}
//	if (delayP.size === 0) {
		return curRender;
//	}
//	return curRender
//		.then(() => {
//			for (const resolve of delayP) {
//				resolve();
//			}
//		});
}
function _render(byD, delayP) {
	if (self.mw_debugLevel !== 0) {
		debugInfo(byD);
	}
	const syncInThisRender = new Set(),
//		renderPack = [],
		pSet = new Set();
	for (const [dId, r] of byD) {
		const sync = type_sync(++mw_syncId, r);
		syncInRender.add(sync);
		syncInThisRender.add(sync);
		if (r.attr === null) {
			r.attr = descrById.get(dId).attr;
		}
		const $sync = $srcById.get(r.sId);
//todo
if ($sync === undefined) {
	console.warn("_render !", r.sId, sync);
	continue;
}
		const arrLen = r.srcIds.size;
		if (arrLen === 1) {
//			renderPack.push({$src: $sync, renderParam: r, sync});
			pSet.add(renderTag($sync, r.scope, r.attr, sync));
			continue;
		}
		const arr = new Array(arrLen);
		let i = 0;
		for (const sId of r.srcIds) {
			arr[i++] = type_q_arr($srcById.get(sId), r.scope);
		}
//todo не могу сообразить, почему этот (1) вариант быстрее! неужелди выполняется в нескольких потоках?
//console.time(111);
		pSet.add(_q_renderPack(r, sync, arr));
//		pSet.add(q_renderTag(arr, r.attr, type_isLast(), sync)
//.then(() => console.timeEnd(111)));
//была проблема с с() из-за потери ид для обновлении при отмене				.then(() => !console.log(123, srcIdsByVarId.get(varIdByVarIdByProp[55].get("green")), arr) && q_renderTag(arr, r.attr, type_isLast(), sync)));
	}
//	if (renderPack.length !== 0) {
//		pSet.add(_renderPack(renderPack));
//	}
	return Promise.all(pSet)
		.then(() => {
			const pSet = new Set();
			for (const sync of syncInThisRender) {
				pSet.add(sync.promise);
				if (self.mw_debugLevel === 0) {
					continue;
				}
				sync.promise
					.then(() => {
						if (sync.stat === 0) {
//todo
							console.warn("0 0 sdfsdfsd");
						}
						if (sync.stat === 7) {
							console.info("ready =>", infoBySrcIds([sync.renderParam.sId]));
							return;
						}
						console.info("cancel =>", infoBySrcIds([sync.renderParam.sId]));
					});
			}
			renderLoop(syncInThisRender);
			return Promise.all(pSet);
		})
		.then(() => {
			for (const d of delayP) {
				for (const sync of syncInThisRender) {
					let l = sync.local.get(d.sId);
					if (l === undefined) {
						continue;
					}
					for (; l.newSrcId !== 0; l = sync.local.get(d.sId)) {
						d.sId = l.newSrcId;
					}
					d.resolve(sync);
					break;
				}
			}
		})
		.catch(err => {
			for (const d of delayP) {
				d.reject(err);
			}
			throw err;
		});
}
/*
function _renderPack(arr) {
	const nows = [],
		deferreds = [],
		arrLen = arr.length;
	for (let i = 0; i < arrLen; i++) {
		const arrI = arr[i];
		if (is$visible(arrI.$src)) {
			nows.push(arrI);
			continue;
		}
		deferreds.push(arrI);
	}
	if (nows.length !== 0) {
console.log(1, nows)
		const pSet = new Set(),
			l = nows.length;
		for (let i = 0; i < l; i++) {
			const e = nows[i];
			pSet.add(renderTag(e.$src, e.renderParam.scope, e.renderParam.attr, e.sync));
		}
		return Promise.all(pSet)
			.then(() => deferreds.length !== 0 && _renderPack(deferreds));
//			.then(() => deferreds.length !== 0 && sync.afterAnimations.add(type_animation(() => _q_renderPack(renderParam, sync, deferreds), sync.local, 0)));
	}
console.log(2, deferreds)
	const pSet = new Set(),
		l = deferreds.length;
	for (let i = 0; i < l; i++) {
		const e = deferreds[i];
		pSet.add(new Promise(ricResolve => {
			const ricId = requestIdleCallback(() => {
alert(1)
				e.sync.idleCallback.delete(ricId);
				renderTag(e.$src, e.renderParam.scope, e.renderParam.attr, e.sync)
					.then(ricResolve);
			});
			e.sync.idleCallback.set(ricId, ricResolve);
		}, defIdleCallbackOpt));
	}
	return Promise.all(pSet);
}*/
function _q_renderPack(renderParam, sync, arr) {
	const nows = [],
		deferreds = [],
		arrLen = arr.length;
	for (let i = 0; i < arrLen; i++) {
		const arrI = arr[i];
		if (is$visible(arrI.$src)) {
			nows.push(arrI);
			continue;
		}
		deferreds.push(arrI);
	}
	if (nows.length !== 0) {
//console.log(1, nows)
		return q_renderTag(nows, renderParam.attr, type_isLast(), sync)
			.then(() => deferreds.length !== 0 && sync.afterAnimations.add(type_animation(() => _q_renderPack(renderParam, sync, deferreds), sync.local, 0)));
	}
//console.log(2, deferreds)
	return new Promise(ricResolve => {
		const ricId = requestIdleCallback(() => {
			sync.idleCallback.delete(ricId);
			q_renderTag(deferreds.splice(0, renderPackSize), renderParam.attr, type_isLast(), sync)
				.then(() => {
					if (deferreds.length !== 0) {
						return _q_renderPack(renderParam, sync, deferreds)
							.then(ricResolve);
					}
					ricResolve();
				});
		});
		sync.idleCallback.set(ricId, ricResolve);
	}, defIdleCallbackOpt);
}
export async function renderLoop(syncInThisRender) {
//console.log(1111111111111111111)
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
			.then(() => dispatchLocalEvents(sync.local)));
	}
	if (pSet.size !== 0) {
		await Promise.all(pSet);
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
		}
	}
	if (pSet.size !== 0) {
		await Promise.all(pSet);
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
			.then(() => dispatchLocalEvents(sync.local)));
	}
	if (pSet.size !== 0) {
		await Promise.all(pSet);
	}
	const repeatSyncs = new Set();
//scroll
	for (const sync of syncInThisRender) {
//console.log(sync, sync.stat, sync.beforeAnimations.size, sync.animations.size, sync.afterAnimations.size, sync.scrollAnimations.size, sync.idleCallback.size, sync.animationFrame.size)
		if (sync.stat === 0) {
			if (sync.beforeAnimations.size !== 0 || sync.animations.size !== 0 || sync.afterAnimations.size !== 0) {
				repeatSyncs.add(sync);
				continue;
			}
			if (sync.scrollAnimations.size !== 0 || sync.idleCallback.size !== 0 || sync.animationFrame.size !== 0) {//если ктьо-то работает в с этим, то он сам ответственен за запуск рендерЛупа
				continue;
			}
		}
		if (sync.stat !== 0) {
//console.warn(23423423423);
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
		for (const [iId, l] of sync.local) {
			if (l.animationsCount !== 0) {
				console.log(222222, iId, l);
			}
		}*/
	}
	if (repeatSyncs.size !== 0) {
//todo
//console.warn("repeatSyncs", repeatSyncs);
		return renderLoop(repeatSyncs);
	}
}
export function addAnimation(sync, animation, isSet) {
//todo
if (sync.stat !== 0) {
console.warn(1111111111);
	return null;
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
			if (!sync.renderParam.isLazyRender) {
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
					rafResolve();
					return;
				}
				for (const a of nows) {
					a.handler();
				}
				dispatchLocalEvents(sync.local);
				if (deferreds.size === 0) {
					rafResolve();
					return;
				}
				requestIdleCallback(() => {
					if (sync.stat !== 0) {
						rafResolve();
						return;
					}
					addAnimation(sync, deferreds, false)
						.then(rafResolve);
				}, defIdleCallbackOpt);
			});
			sync.animationFrame.set(rafId, rafResolve);
		});
	}
	if (deferreds.size === 0) {
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
				for (const a of deferreds) {
					a.handler();
				}
				dispatchLocalEvents(sync.local);
				ricResolve();
				return;
			});
		}, defIdleCallbackOpt);
		sync.idleCallback.set(ricId, ricResolve);
	});
}
function prepareRenderParam(toCancleSync) {
//	const renderParamByDescrId = new Map(),
	const byD = new Map();
//console.log("prepareRenderParam", new Set(renderParams));
//console.time("p1")
	for (const r of renderParams) {
		const sId = r.sId,
			src = srcById.get(sId);
		if (src === undefined) {//удалённые элементы, ссылки на переменные еще могут остаться так как они удаляются в фоне
			continue;
		}
		const descr = src.descr,
			dId = descr.id,
			rr = byD.get(dId);
		if (rr !== undefined) {
			if (descr.asOnes === null) {//!!если в byD уже есть для этого описания, то это должен быть ку алгоритм
				rr.srcIds.add(sId);
			}
			continue;
		}
		byD.set(dId, r);
		if (descr.asOnes === null) {
//11			byD.set(dId, type_prepareByD(sId, new Set([sId]), r));
			r.srcIds.add(sId);
			continue;
		}
		//<div foreach><div foreach<-если мы здесь
		const $parents = new Set();//,
//11			srcIds = new Set();
		for (const jId of descr.srcIds) {
			const $p = $srcById.get(jId).parentNode;
			if ($parents.has($p)) {
				continue;
			}
			$parents.add($p);
//11			srcIds.add(jId);
			r.srcIds.add(jId);
		}
//11		byD.set(dId, type_prepareByD(sId, srcIds, r));
	}
//console.timeEnd("p1")
//console.time("p2")
	for (const [dId, r] of byD) {//вычисляем когда мнго элементов типа: if-else or inc и оставляем только первый dId
		const $i = $srcById.get(r.sId);
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
		r.$els = $els;//нужен для getPosStat() при проверке на отмену
	}
//console.timeEnd("p2")
//console.time("p3")
	const mergeByD = new Map(),
		$top = mw_$src.parentNode;
	for (const [dId, r] of byD) {//размечаем глубины и расширяем для get$els
		let $i = $srcById.get(r.sId),
			iSrc = srcBy$src.get($i);
		const mI = type_prepareMerge(0, iSrc.asOneIdx !== null ? iSrc.asOneIdx.values().next().value : 0);
		mergeByD.set(dId, mI);
		for (; $i !== $top; $i = $i.parentNode, iSrc = srcBy$src.get($i)) {
/*
			if ($i === $top) {
				for (const iId of r.srcIds) {
//todo!!!!!!--
					if (iId !== r.sId && is$hide($srcById[iId])) {//из-за чего может получится что элемент в рендере и его нет в доме?
						r.srcIds.delete(iId);
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
			if ($i.getAttribute(lazyRenderName) !== null) {
				r.isLazyRender = true;
			}
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
	renderParams.clear();
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
//		sId = sync.renderParam.sId;
//		for (let l = sync.local.get(sId); l.newSrcId !== 0; l = sync.local.get(sId)) {
//			sId = l.newSrcId;
//		}
		if (s.has(sync.renderParam.sId)) {
			sync.stat = 4;
			toCancleSync.add(sync);
		}
	}
	byD.delete(dId);
}
function checkSync(sync, newRenderParam) {
//0 - parallel
//1 - new above
//2 - new eq
//3 - new below
//4 - by prepare
//5 - not found sync.renderParam.sId
//7 - ready
//console.log("cancel", sync.stat, sync, p);
	if (sync.stat !== 0) {
		return getPosStat(sync, newRenderParam);
	}
	const stat = getPosStat(sync, newRenderParam);
	if (stat === 0) {
		return stat;
	}
	sync.stat = stat;
	for (const [id, r] of sync.idleCallback) {
		cancelIdleCallback(id);
		r();
	}
	for (const [id, r] of sync.animationFrame) {
		cancelAnimationFrame(id);
		r();
	}
	return stat;
}
function getPosStat(sync, newRenderParam) {
	let syncSrcId = sync.renderParam.sId;
	if (!srcById.has(syncSrcId)) {
		for (let l = sync.local.get(syncSrcId); l.newSrcId !== 0; l = sync.local.get(syncSrcId)) {
			syncSrcId = l.newSrcId;
		}
	}
	const $sync = $srcById.get(syncSrcId);
//todo--
	if ($sync === undefined) {
//		throw new Error("!!! checkSync - hz " + syncSrcId);
		console.warn("!!! checkSync - hz " + syncSrcId);
		return 5;
	}
	const $top = mw_$src.parentNode;
	if (newRenderParam.$els === null) {
		for (let $i = $sync; $i !== $top; $i = $i.parentNode) {
			const iId = srcBy$src.get($i).id;
			if (newRenderParam.srcIds.has(iId)) {
				return iId === syncSrcId ? 2 : 1;
			}
		}
	} else {
		const $elsLen = newRenderParam.$els.length;
		for (let i, $i = $sync; $i !== $top; $i = $i.parentNode) {
			for (i = 0; i < $elsLen; i++) {
				const iId = srcBy$src.get($i).id;
				if (iId === srcBy$src.get(newRenderParam.$els[i]).id) {//если будет большой делаэй, то новый параметр могут скрыть - и поэтому нужнго по ид
					return iId === syncSrcId ? 2 : 1;
//				if ($i === newRenderParam.$els[i]) {
//					return srcBy$src.get($i).id === syncSrcId ? 2 : 1;
				}
			}
		}
	}
//todo think about
	for (let $i = $srcById.get(newRenderParam.sId).parentNode; $i !== $top; $i = $i.parentNode) {
		if (srcBy$src.get($i).id === syncSrcId) {
			return 3;
		}
	}
	return 0;
}
function type_delayParam(sId, resolve, reject) {
	return {
		sId,
		resolve,
		reject
	};
}
function type_renderParam(sId, scope, attr, isLinking) {
	return {
		sId,
		scope,
		attr,
		isLinking,
		isLazyRender: false,
		srcIds: new Set(),
		$els: null
	};
}
/*--
function type_prepareByD(sId, srcIds, renderParam) {
	return {
		sId,
		srcIds,
		$els: null,
		renderParam
	};
}*/
function type_prepareMerge(len, firstAsOneIdx) {
	return {
		len,
		descrId: new Set(),
		firstAsOneIdx
//		asOneIdx: new Set()
	};
}
function type_sync(syncId, renderParam) {
	let resolve;
	const promise = new Promise(res => resolve = res);
	return {
		syncId,
		renderParam,
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
	for (const r of byD.values()) {
		s.add(r.sId);
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
//API
self.mw_render = render;
self.mw_curRender = curRender;
self.mw_setDelay = setDelay;
self.mw_syncInRender = syncInRender;//todo close
