import Config from "../../config/Config.js";
import Q_arr from "./Q_arr.js";
import Animation from "./Animation.js";
import DelayParam from "./DelayParam.js";
import QRenderTag from "./QRenderTag.js";
import RenderParam from "./RenderParam.js";
import PrepareMerge from "./PrepareMerge.js";
import Sync from "./Sync.js";

/*
//import {renderBatchSize, lazyRenderName, defIdleCallbackOpt} from "../config/config.js";
//import {getSrcId, get$els} from "../description/descr.js";
//import {preRender, is$hide, is$visible, isAnimationVisible} from "../dom/dom.js";
////import {loadingCount} from "../loading/loading.js";
//import {renderTag, q_renderTag, dispatchLocalEvents} from "./render.js";

//import {IsLast} from "./IsLast.js";
import {type_q_arr} from "./Q_arr.js";
import {Animation} from "./Animation.js";
import {type_delayParam} from "./DelayParam.js";
import {type_renderParam} from "./RenderParam.js";
import {type_prepareMerge} from "./PrepareMerge.js";
import {type_sync} from "./Sync.js";*/
/*
//!!instance
const renderParams = new Set();
let mw_delay = 0,
	mw_delayId = 0,
	mw_syncId = 0,
	__oldLocHash = "";
const delayParams = new Set();
export const syncInRender = new Set();
let curRender = Promise.resolve();*/

export class Render extends QRenderTag {
	getCurRender() {
		return this.ctx.curRender;
	}
	render($src = this.rootElement, delay, scope, isLinking = false) {
		if (!this.ctx.srcBy$src.has($src)) {
			this.preRender($src, isLinking);
		}
		const sId = this.ctx.srcBy$src.get($src).id;
		this.ctx.renderParams.add(new RenderParam(sId, scope || null, "", isLinking));
		return this.tryRender(delay, sId);
	}
	renderBySrcIds(srcs) {
		for (const sId of srcs) {
			if (this.ctx.$srcById.has(sId)) {//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
				this.ctx.renderParams.add(new RenderParam(sId, null, "", false));
			}
		}
		this.tryRender(this.ctx.mw_delay, 0);
	}
	setDelay(time, cb) {
		if (!cb) {
			this.ctx.mw_delay = time;
			return;
		}
		const old = this.ctx.mw_delay;
		this.ctx.mw_delay = time;
		cb();
		this.ctx.mw_delay = old;
	}
	//private
	tryRender(delay = this.ctx.mw_delay, sId) {
		const delayId = ++this.ctx.mw_delayId;
		return new Promise((resolve, reject) => {
			setTimeout(() => {//по этому отмена не идёт сразу
				if (sId !== 0) {
					this.ctx.delayParams.add(new DelayParam(sId, resolve, reject));
				}
				if (delayId !== this.ctx.mw_delayId || this.ctx.renderParams.size === 0) {
					return;
				}
				const delayP = new Set(this.ctx.delayParams);
				this.ctx.delayParams.clear();
				this._tryRender(delayP)
					.then(resolve)
					.catch(err => {
//todo нужно подумать что еще надо почистить
						for (const sync of this.ctx.syncInRender) {
							sync.resolve();
						}
						this.ctx.syncInRender.clear();
						this.ctx.curRender = Promise.resolve();
						this.ctx.loadingCount.clear();
//						throw err;
						reject(err);
					});
			}, delay);
		});
	}
	//private
	_tryRender(delayP) {
		const toCancleSync = new Set(),
			byD = this.prepareRenderParam(toCancleSync),
			repeatByD = new Map();
		if (this.ctx.syncInRender.size !== 0) {
			const toRemByD = new Set(),
				s = new Set();//для того: если были уже отменены синки и мы их пустим на проверку то полдучится, что новые параметры будут удалены из-за условия curStat !== 0
			for (const sync of this.ctx.syncInRender) {
				if (sync.stat === 0) {//могут отмениться в prepareRenderParam
					s.add(sync);
				}
			}
			for (const sync of s) {
				for (const [dId, r] of byD) {
					const curStat = sync.stat,
						stat = curStat === 0 ? this.checkSync(sync, r) : curStat;
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
						this.ctx.renderParams.add(sync.renderParam);
						for (const sId of r.srcIds) {
							this.ctx.renderParams.add(new RenderParam(sId, null, "", false));
						}
						continue;
					}
					if (stat === 3) {//below
						repeatByD.set(this.ctx.srcById.get(sync.renderParam.sId).descr.id, sync.renderParam);
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
			if (this.ctx.renderParams.size !== 0) {
				for (const [dId, r] of this.prepareRenderParam(toCancleSync)) {
					repeatByD.set(dId, r);
				}
			}
		}
//console.log("_R", byD, repeatByD, toCancleSync);
//		if (toCancleSync.size !== 0) {
//			for (const sync of toCancleSync) {
//				this.ctx.syncInRender.delete(sync);
//				sync.resolve();
//			}
//		}
		if (byD.size !== 0) {
			const p = _render(byD, delayP);
			if (repeatByD.size === 0) {
				this.ctx.curRender = this.ctx.curRender
					.then(() => p);
			} else {
				this.ctx.curRender = this.ctx.curRender
					.then(() => this._render(repeatByD, delayP))
					.then(() => p);
			}
		} else if (repeatByD.size !== 0) {
			this.ctx.curRender = this.ctx.curRender
				.then(() => this._render(repeatByD, delayP));
//		} else {
//			return this.ctx.curRender;
		}
//		if (delayP.size === 0) {
			return this.ctx.curRender;
//		}
//		return this.ctx.curRender
//			.then(() => {
//				for (const resolve of delayP) {
//					resolve();
//				}
//			});
	}
	//private
	_render(byD, delayP) {
		if (my.debugLevel !== 0) {
			const sIds = new Set();
			for (const r of byD.values()) {
				if (r.srcIds.size === 0) {
					sIds.add(r.sId);
					continue;
				}
				for (const iId of r.srcIds) {
					sIds.add(iId);
				}
			}
			console.info("render =>", this.infoBySrcIds(sIds));
//			console.info("render =>", infoBySrcIds(new Set(Array.from(byD.values()).map(i => i.srcIds.size === 0 ? i.sId : Array.from(i.srcIds)).flat())));
		}
		const syncInThisRender = new Set(),
//			renderPack = [],
			pSet = new Set();
		for (const [dId, r] of byD) {
			const sync = new Sync(++this.ctx.mw_syncId, r),
				$sync = this.ctx.$srcById.get(r.sId),
				arrLen = r.srcIds.size;
			this.ctx.syncInRender.add(sync);
			this.ctx.syncInThisRender.add(sync);
//--			if (r.attr === null) {
//--				r.attr = my.ctx.descrById.get(dId).attr;
//--			}
//todo
//if ($sync === undefined) {
//	console.warn("_render !", r.sId, sync);
//	continue;
//}
			if (arrLen === 1) {
//				renderPack.push({$src: $sync, renderParam: r, sync});
				pSet.add(this.renderTag($sync, r.scope, r.str, sync));
				continue;
			}
			const arr = new Array(arrLen);
			let i = 0;
			for (const sId of r.srcIds) {
				arr[i++] = new Q_arr(this.ctx.$srcById.get(sId), r.scope);
			}
//todo не могу сообразить, почему этот (1) вариант быстрее! неужелди выполняется в нескольких потоках?
//console.time(111);
			pSet.add(this._q_batchingRender (r, sync, arr));
//			pSet.add(this.q_renderTag(arr, "", new Set(), sync)
//.then(() => console.timeEnd(111)));
//была проблема с с() из-за потери ид для обновлении при отмене				.then(() => !console.log(123, my.ctx.srcIdsByVarId.get(my.ctx.varIdByVarIdByProp[55].get("green")), arr) && this.q_renderTag(arr, "", new Set(), sync)));
		}
//		if (renderPack.length !== 0) {
//			pSet.add(this._renderPack(renderPack));
//		}
		return Promise.all(pSet)
			.then(() => {
				const pSet = new Set();
				for (const sync of syncInThisRender) {
					pSet.add(sync.promise);
					if (my.debugLevel === 0) {
						continue;
					}
					sync.promise
						.then(() => {
							if (sync.stat === 0) {
//todo
								console.warn("0 0 sdfsdfsd");
							}
							const sIds = sync.renderParam.srcIds.size === 0 ? [sync.renderParam.sId] : sync.renderParam.srcIds;
							if (sync.stat === 7) {
								console.info("ready =>", this.infoBySrcIds(sIds));
								return;
							}
							console.info("cancel =>", this.infoBySrcIds(sIds));
						});
					}
				this.renderLoop(syncInThisRender);
				return Promise.all(pSet);
			})
			.then(() => {
				for (const d of delayP) {
					for (const sync of syncInThisRender) {
						let l = sync.local.get(d.sId);
						if (l !== undefined) {
//							for (; l !== undefined && l.newSrcId !== 0; l = sync.local.get(d.sId)) {
//							d.sId = l.newSrcId;
//							}
//							d.sId = this.getSrcId(sync.local, d.sId);
							d.resolve(sync);
							break;
						}
					}
				}
				//todo
				const h = location.hash;
				if (h === this.ctx.__oldLocHash) {
					return;
				}
				const $h = document.getElementById(h.substr(1));
				if ($h) {
					this.ctx.__oldLocHash = h;
					$h.scrollIntoView();
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
			if (this.is$visible(arrI.$src)) {
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
				pSet.add(this.renderTag(e.$src, e.renderParam.scope, e.renderParam.str, e.sync));
			}
			return Promise.all(pSet)
				.then(() => deferreds.length !== 0 && _renderPack(deferreds));
//				.then(() => deferreds.length !== 0 && sync.afterAnimations.add(new Animation(() => _q_batchingRender (renderParam, sync, deferreds), sync.local, 0)));
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
					this.renderTag(e.$src, e.renderParam.scope, e.renderParam.str, e.sync)
						.then(ricResolve);
				});
				e.sync.idleCallback.set(ricId, ricResolve);
			}, Config.defIdleCallbackOpt));
		}
		return Promise.all(pSet);
	}*/
	//private
	_q_batchingRender (renderParam, sync, arr) {
		const nows = [],
			deferreds = [],
			arrLen = arr.length;
		for (let i = 0; i < arrLen; i++) {
			const arrI = arr[i];
			if (this.is$visible(arrI.$src)) {
				nows.push(arrI);
				continue;
			}
			deferreds.push(arrI);
		}
		if (nows.length !== 0) {
//console.log(1, nows)
			return this.q_renderTag(nows, renderParam.str, new Set(), sync)
				.then(() => deferreds.length !== 0 && sync.afterAnimations.add(new Animation(() => this._q_batchingRender (renderParam, sync, deferreds), sync.local, 0)));
		}
//console.log(2, deferreds)
		return new Promise(ricResolve => {
			const ricId = requestIdleCallback(() => {
				sync.idleCallback.delete(ricId);
				this.q_renderTag(deferreds.splice(0, Config.renderBatchSize), renderParam.str, new Set(), sync)
					.then(() => {
						if (deferreds.length !== 0) {
							return this._q_batchingRender (renderParam, sync, deferreds)
								.then(ricResolve);
						}
						ricResolve();
					});
			});
			sync.idleCallback.set(ricId, ricResolve);
		}, Config.defIdleCallbackOpt);
	}
	async function renderLoop(syncInThisRender) {
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
				aArr[i++] = a.execute();
			}
			pSet.add(Promise.all(aArr)
				.then(() => this.dispatchLocalEvents(sync.local)));
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
			const p = this.addAnimation(sync, animation, false);
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
				aArr[i++] = a.execute();
			}
			pSet.add(Promise.all(aArr)
				.then(() => this.dispatchLocalEvents(sync.local)));
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
				this.ctx.syncInRender.delete(sync);
				sync.resolve();
				continue;
			}
			//todo подумать - наверное есть другой способ - слишком жирно для одного вотч-а
			if (sync.onreadies.size !== 0) {
				for (const h of sync.onreadies) {
					h();
				}
			}
			sync.stat = 7;//ready
			this.ctx.syncInRender.delete(sync);
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
			return this.renderLoop(repeatSyncs);
		}
	}
	addAnimation(sync, animation, isSet) {
//todo
if (sync.stat !== 0) {
console.warn(1111111111);
	return null;
}
//		const isSet = syncInThisRender === null,
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
				if (this.isAnimationVisible(a)) {
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
/*!!!!!
					if (sync.stat !== 0) {
						rafResolve();
						return;
					}*/
					for (const a of nows) {
						a.handler();
					}
					this.dispatchLocalEvents(sync.local);
					if (deferreds.size === 0) {
						rafResolve();
						return;
					}
/*
					requestIdleCallback(() => {
						if (sync.stat !== 0) {
							rafResolve();
							return;
						}*/
					const ricId = requestIdleCallback(() => {
						sync.idleCallback.delete(ricId);
						this.addAnimation(sync, deferreds, false)
							.then(rafResolve);
					}, Config.defIdleCallbackOpt);
					sync.idleCallback.set(ricId, rafResolve);
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
				const rafId = requestAnimationFrame(() => {
					sync.animationFrame.delete(rafId);
/*!!!!!
					if (sync.stat !== 0) {
						ricResolve();
						return;
					}*/
					for (const a of deferreds) {
						a.handler();
					}
					this.dispatchLocalEvents(sync.local);
					ricResolve();
					return;
				});
				sync.animationFrame.set(rafId, ricResolve);
			}, Config.defIdleCallbackOpt);
			sync.idleCallback.set(ricId, ricResolve);
		});
	}
	checkScrollAnimations() {
		const pSet = new Set(),
			scrollSync = new Set(),
			$srcById = this.ctx.$srcById;
		for (const sync of this.ctx.syncInRender) {
			if (sync.stat !== 0 || sync.scrollAnimations.size === 0) {
				continue;
			}
			const animation = new Set();
			for (const a of sync.scrollAnimations) {
				if (!$srcById.has(a.viewedSrcId)) {
					sync.scrollAnimations.delete(a);
					if (sync.scrollAnimations.size === 0) {
						scrollSync.add(sync);
					}
					continue;
				}
				if (this.isAnimationVisible(a)) {
					sync.scrollAnimations.delete(a);
					animation.add(a);
				}
			}
			if (animation.size !== 0) {
				pSet.add(this.addAnimation(sync, animation, true));
				scrollSync.add(sync);
			}
		}
		if (pSet.size !== 0) {
//console.log("animation")
			Promise.all(pSet)
				.then(() => this.renderLoop(scrollSync));
			return;
		}
//todo--
		if (scrollSync.size !== 0) {
console.warn("2animation")
			this.renderLoop(scrollSync);
		}
	}
	dispatchLocalEvents(local) {
		for (const [sId, l] of local) {
			if (l.animationsCount === 0) {
				this._dispatchLocalEventsBySrcId(sId, l);
			}
		}
	}
	//private
	prepareRenderParam(toCancleSync) {
//		const renderParamByDescrId = new Map(),
		const srcById = this.ctx.srcById,
			descrById = this.ctx.descrById,
			srcBy$src = this.ctx.srcBy$src,
			$srcById = this.ctx.$srcById,
			byD = new Map();
//console.log("prepareRenderParam", new Set(this.ctx.renderParams));
//console.time("p1")
		for (const r of this.ctx.renderParams) {
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
				r.srcIds.add(sId);
				continue;
			}
		//<div foreach.1><div foreach.2<-если мы здесь, т.е во всех 1 собраем все 2
			const $parents = new Set();
			for (const jId of descr.srcIds) {
				const $p = $srcById.get(jId).parentNode;
				if ($parents.has($p)) {
					continue;
				}
				$parents.add($p);
				r.srcIds.add(jId);
			}
		}
//console.timeEnd("p1")
//console.time("p2")
		for (const [dId, r] of byD) {//вычисляем когда много элементов типа: if-else or inc и оставляем только первый dId
			const $i = $srcById.get(r.sId);
			if (this.is$hide($i)) {//если элеменит скрыт template-ом
				this.prpDeleteDescrId(byD, dId, toCancleSync);
				continue;
			}
			const descr = descrById.get(dId);
			if (descr.asOnes !== null || descr.get$elsByStr === null) {
				continue;
			}
			const $els = this.get$els($i, descr.get$elsByStr, ""),
				$elsLen = $els.length;
			if ($elsLen === 1) {
				continue;
			}
			//if-else, inc
			for (let f = true, i = 0; i < $elsLen; i++) {
				const iSrc = srcBy$src.get($els[i]);
				if (iSrc === undefined) {
					continue;
				}
				const iDId = iSrc.descr.id;
				if (iDId !== dId) {// && byD.has(iDId)) {
					this.prpDeleteDescrId(byD, iDId, toCancleSync);
				}
/*
				if (f && iSrc.isCmd) {//!!эта оптимизация не имеет особого приемущества
					f = false;
					r.sId = iSrc.id;
					byD.set(iSrc.descr.id, r);
					continue;
				}
				this.prpDeleteDescrId(byD, iSrc.descr.id, toCancleSync);*/
			}
			r.$els = $els;//нужен для getPosStat() при проверке на отмену
		}
//console.timeEnd("p2")
//console.time("p3")
		const mergeByD = new Map(),
			$top = this.ctx.rootElement.parentNode;
		for (const [dId, r] of byD) {//размечаем глубины и расширяем для get$els
			let $i = $srcById.get(r.sId),
				iSrc = srcBy$src.get($i);//todo by id
			const mI = new PrepareMerge(0, iSrc.asOneIdx !== null ? iSrc.asOneIdx.values().next().value : 0);
			mergeByD.set(dId, mI);
			for (; $i !== $top; $i = $i.parentNode, iSrc = srcBy$src.get($i)) {
/*
				if ($i === $top) {
					for (const iId of r.srcIds) {
//todo!!!!!!--
						if (iId !== r.sId && this.is$hide($srcById[iId])) {//из-за чего может получится что элемент в рендере и его нет в доме?
							r.srcIds.delete(iId);
						}
					}
//					renderParamByDescrId.set(dId, p);
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
				if ($i.getAttribute(Config.lazyRenderName) !== null) {
					r.isLazyRender = true;
					//todo, наверное, нужно пробудмать удаление слушателя при изменении атрибута
					//так тто мы не удаляем его никогда только добавляем
					this.addScrollAnimationsEvent($i);
				}
                        	const iDescr = iSrc.descr;
				if (iSrc.asOneIdx !== null || iDescr.get$elsByStr === null) {
					mI.descrId.add(iDescr.id);
					continue;
				}
				const $els = this.get$els($i, iDescr.get$elsByStr, "");//todo <-- $els - для первого $i мы ранее уже вычисляли $els
//				if ($els) {
					for (let j = $els.length - 1; j > -1; j--) {
						const iSrc = srcBy$src.get($els[j]);
						if (iSrc !== undefined) {
							mI.descrId.add(iSrc.descr.id);
						}
					}
//				}
			}
		}
//console.timeEnd("p3")
//console.time("p4")
		const byDArr = Array.from(byD.keys()),
			byDArrLen = byDArr.length;
		for (let $l, l, j, i = 0; i < byDArrLen; i++) {
			const iDId = byDArr[i];
//			if (!byD.has(iDId)) {
			if (iDId === 0) {
				continue;
			}
			const mI = mergeByD.get(iDId);
			for (j = 0; j < byDArrLen; j++) {
				const jDId = byDArr[j];
				if (jDId === 0 || iDId === jDId) {
					continue;
				}
				const mJ = mergeByD.get(jDId);
				if (mI.len > mJ.len) {
					continue;
				}
//				if (mI.len !== mJ.len && mJ.descrId.has(iDId)) {
				if (mJ.descrId.has(iDId)) {
/*
					$l = $srcById.get(byD.get(jDId).sId);
					for (l = mJ.len - mI.len; l !== -1; l--) {
						$l = $l.parentNode;
					}
console.log(444, mJ.len - mI.len, $l, $srcById.get(byD.get(iDId).sId), descrById.get(jDId), byD.get(jDId));
					if ($srcById.get(byD.get(iDId).sId).parentNode === $l) {
						prpDeleteDescrId(byD, jDId, toCancleSync);
						byDArr[j] = 0;
					}*/
					const $p = $srcById.get(byD.get(iDId).sId).parentNode,
						lLen = mJ.len - mI.len;
					for (const lId of descrById.get(jDId).srcIds) {
						$l = $srcById.get(lId);
						for (l = lLen; $l !== null && l !== -1; l--) {//может быть стрытым
							$l = $l.parentNode;
						}
						if ($l === $p) {
							this.prpDeleteDescrId(byD, jDId, toCancleSync);
							byDArr[j] = 0;
							break;
						}
					}
					continue;
				}
//console.log(444, mI.firstAsOneIdx, mJ.firstAsOneIdx, iDId, jDId)
				if (mI.firstAsOneIdx !== 0 && mI.firstAsOneIdx === mJ.firstAsOneIdx) {
					this.prpDeleteDescrId(byD, jDId, toCancleSync);
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
//				if (mI.len > mJ.len && mI.descrId.has(jDId)) {
//				if (mI.len > mJ.len && mI.descrId[jDId]) {
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
//console.log(2, new Map(byD), toCancleSync);
//alert(1);
		this.ctx.renderParams.clear();
		return byD;
	}
	//private
	prpDeleteDescrId(byD, dId, toCancleSync) {
		if (!byD.has(dId)) {
			return;
		}
		const s = byD.get(dId).srcIds;
//		let sId;
		for (const sync of this.ctx.syncInRender) {
//			sId = sync.renderParam.sId;
//			for (let l = sync.local.get(sId); l.newSrcId !== 0; l = sync.local.get(sId)) {
//				sId = l.newSrcId;
//			}
//			sId = this.getSrcId(sync.local, sync.renderParam.sId);
			if (s.has(sync.renderParam.sId)) {
				sync.stat = 4;
				toCancleSync.add(sync);
			}
		}
//console.error(dId);
		byD.delete(dId);
	}
	//private
	checkSync(sync, newRenderParam) {
//0 - parallel
//1 - new above
//2 - new eq
//3 - new below
//4 - by prepare
//5 - not found sync.renderParam.sId
//7 - ready
//8 - cancel
//console.log("cancel", sync.stat, sync, p);
		const stat = this.getPosStat(sync, newRenderParam);
		if (sync.stat !== 0) {
			return stat;
		}
		if (stat !== 0) {
			this.cancelSync(sync, stat);
		}
		return stat;
	}
	function cancelSync(sync, stat) {
		sync.stat = stat;
		for (const [id, r] of sync.idleCallback) {
			cancelIdleCallback(id);
			r();
		}
		for (const [id, r] of sync.animationFrame) {
			cancelAnimationFrame(id);
			r();
		}
		this.ctx.syncInRender.delete(sync);
		sync.resolve();
		return stat;
	}
	//private
	getPosStat(sync, newRenderParam) {
//		let syncSrcId = sync.renderParam.sId;
//		if (!my.ctx.srcById.has(syncSrcId)) {
//			for (let l = sync.local.get(syncSrcId); l.newSrcId !== 0; l = sync.local.get(syncSrcId)) {
//				syncSrcId = l.newSrcId;
//			}
//		}
		const syncSrcId = this.getSrcId(sync.local, sync.renderParam.sId),
			$sync = this.ctx.$srcById.get(syncSrcId);
//todo--
		if ($sync === undefined) {
//			throw new Error("!!! checkSync - hz " + syncSrcId);
			console.warn("!!! checkSync - hz " + syncSrcId);
			return 5;
		}
		const srcBy$src = this.ctx.srcBy$src,
			$top = this.rootElement.parentNode;
		if (newRenderParam.$els === null) {
			for (let $i = $sync; $i !== $top; $i = $i.parentNode) {
				const iId = this.ctx.srcBy$src.get($i).id;
				if (newRenderParam.srcIds.has(iId)) {
					return iId === syncSrcId ? 2 : 1;
				}
			}
		} else {
			const $els = newRenderParam.$els,
				$elsLen = $els.length;
			for (let j, $i = $sync; $i !== $top; $i = $i.parentNode) {
//				const iId = srcBy$src.get($i).id;
				for (j = 0; j < $elsLen; j++) {
					const $j = $els[j];//,
//						jSrc = srcBy$src.get($j);
//					if (jSrc === undefined) {
//						continue;
//					}
//					const jId = jSrc.id;
//					if (jId === iId) {//если будет большой делаэй, то новый параметр могут скрыть - и поэтому нужнго по ид
//						return iId === syncSrcId ? 2 : 1;
					if ($j === $i) {
						return this.ctx.srcBy$src.get($i).id === syncSrcId ? 2 : 1;
					}
				}
			}
		}
//todo think about
		for (let $i = this.ctx.$srcById.get(newRenderParam.sId).parentNode; $i !== $top; $i = $i.parentNode) {
			if (this.ctx.srcBy$src.get($i).id === syncSrcId) {
				return 3;
			}
		}
		return 0;
	}
	//private
	infoBySrcIds(sIds) {
		const i = {};
		for (const sId of sIds) {
			i[sId] = this.ctx.$srcById.get(sId);
		}
		return i;
	}
};
