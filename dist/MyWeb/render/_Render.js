"use strict";
// import {config} from "../../config.js";
// import {Q_arr} from "./Q_arr.js";
// import {Task} from "./Task.js";
// import {DelayParam} from "./DelayParam.js";
// import {Q_renderTag} from "./Q_renderTag.js";
// import {RenderParam} from "./RenderParam.js";
// import {PrepareMerge} from "./PrepareMerge.js";
// import {Sync} from "./Sync.js";
// import {Src} from "../dom/Src.js";
// import {Descr} from "../dom/Descr.js";
// import {LocalState} from "./LocalState.js";
//
// //todo my
// const my = (self as unknown as {my: {getLineNo: Function; debugLevel: number}}).my;
//
// export class Render extends Q_renderTag {
// 	getCurRender() {
// 		return this.context.currentRender;
// 	}
//
// 	render($src = this.context.rootElement, delay: number | undefined, scope: Record<string | symbol, unknown> | null = null, isLinking = false) {
// 		if (!this.context.srcBy$src.has($src)) {
// 			this.prepare$src($src, isLinking);
// 		}
// 		const srcId = (this.context.srcBy$src.get($src) as Src).id; //!!
// 		this.context.renderParams.add(new RenderParam(srcId, scope, "", isLinking));
// 		return this.runRender(delay, srcId);
// 	}
//
// 	renderBySrcIds(srcIds: Set<number>) {
// 		for (const sId of srcIds) {
// 			if (this.context.$srcById.has(sId)) {
// 				//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
// 				this.context.renderParams.add(new RenderParam(sId, null, "", false));
// 			}
// 		}
// 		return this.runRender(this.context.delayInMs, 0);
// 	}
//
// 	setDelay(time: number, cb?: Function) {
// 		if (!cb) {
// 			this.context.delayInMs = time;
// 			return;
// 		}
// 		const old = this.context.delayInMs;
// 		this.context.delayInMs = time;
// 		cb();
// 		this.context.delayInMs = old;
// 	}
//
// 	private runRender(delay = this.context.delayInMs, srcId: number) {
// 		const delayId = ++this.context.delayId;
// 		return new Promise((resolve, reject) => {
// 			setTimeout(() => {
// 				//по этому отмена не идёт сразу
// 				if (srcId !== 0) {
// 					this.context.delayParams.add(new DelayParam(srcId, resolve, reject));
// 				}
// 				if (delayId !== this.context.delayId || this.context.renderParams.size === 0) {
// 					return;
// 				}
// 				const delayParams = new Set(this.context.delayParams);
// 				this.context.delayParams.clear();
// 				this.renderRenderParams(delayParams)
// 					.then(resolve)
// 					.catch(err => {
// 						//todo нужно подумать что еще надо почистить
// 						for (const sync of this.context.syncInRender) {
// 							sync.resolve();
// 						}
// 						this.context.syncInRender.clear();
// 						this.context.currentRender = Promise.resolve();
// 						this.context.loadingCount.clear();
// 						//throw err;
// 						reject(err);
// 					});
// 			}, delay);
// 		});
// 	}
//
// 	private renderRenderParams(delayParams: Set<DelayParam>) {
// 		const toCancelSync = new Set<Sync>();
// 		const byDescr = this.prepareRenderParam(toCancelSync);
// 		const repeatByD = new Map();
// 		if (this.context.syncInRender.size !== 0) {
// 			const toRemByD = new Set<number>();
// 			const s = new Set<Sync>(); //для того: если были уже отменены синки и мы их пустим на проверку то получится, что новые параметры будут удалены из-за условия curStat !== 0
// 			for (const sync of this.context.syncInRender) {
// 				if (sync.stat === 0) {
// 					//могут отмениться в prepareRenderParam
// 					s.add(sync);
// 				}
// 			}
// 			for (const sync of s) {
// 				for (const [dId, r] of byDescr) {
// 					const curStat = sync.stat;
// 					const stat = curStat === 0 ? this.checkSync(sync, r) : curStat;
// 					//console.log("1repeat", stat, curStat, sync.renderParam.srcId, r.srcId, dId);
// 					if (stat === 0) {
// 						continue;
// 					}
// 					if (curStat !== 0) {
// 						if (stat === 3) {
// 							toRemByD.add(dId);
// 						}
// 						continue;
// 					}
// 					toCancelSync.add(sync);
// 					toRemByD.add(dId); //чтобы для следующих синков иметь возможность отменить их - для случая если этот ниже
// 					//todo rem
// 					if (sync.renderParam.isLinking) {
// 						sync.renderParam.isLinking = false;
// 					}
// 					if (stat === 2) {
// 						//eq
// 						//повторить + новый
// 						this.context.renderParams.add(sync.renderParam);
// 						for (const sId of r.srcIds) {
// 							this.context.renderParams.add(new RenderParam(sId, null, "", false));
// 						}
// 						continue;
// 					}
// 					if (stat === 3) {
// 						//new below ниже
// 						repeatByD.set((this.context.srcById.get(sync.renderParam.srcId) as Src).descr.id, sync.renderParam); //!!
// 						continue;
// 					}
// 					//new above
// 					//todo rem
// 					if (r.isLinking) {
// 						r.isLinking = false;
// 					}
// 					repeatByD.set(dId, r);
// 				}
// 			}
// 			if (toRemByD.size !== 0) {
// 				for (const dId of toRemByD) {
// 					byDescr.delete(dId);
// 				}
// 			}
// 			if (this.context.renderParams.size !== 0) {
// 				for (const [dId, r] of this.prepareRenderParam(toCancelSync)) {
// 					repeatByD.set(dId, r);
// 				}
// 			}
// 		}
// 		//console.log("_R", byD, repeatByD, toCancelSync);
// 		//if (toCancelSync.size !== 0) {
// 		//	for (const sync of toCancelSync) {
// 		//		this.context.syncInRender.delete(sync);
// 		//		sync.resolve();
// 		//	}
// 		//}
// 		if (byDescr.size !== 0) {
// 			const p = this.renderByRenderParamsGroupedByDescr(byDescr, delayParams);
// 			if (repeatByD.size === 0) {
// 				this.context.currentRender = this.context.currentRender.then(() => p);
// 			} else {
// 				this.context.currentRender = this.context.currentRender
// 					.then(() => this.renderByRenderParamsGroupedByDescr(repeatByD, delayParams))
// 					.then(() => p);
// 			}
// 		} else if (repeatByD.size !== 0) {
// 			this.context.currentRender = this.context.currentRender.then(() =>
// 				this.renderByRenderParamsGroupedByDescr(repeatByD, delayParams)
// 			);
// 			//} else {
// 			//	return this.context.currentRender;
// 		}
// 		//if (delayP.size === 0) {
// 		return this.context.currentRender;
// 		//}
// 		//return this.context.currentRender
// 		//	.then(() => {
// 		//		for (const resolve of delayP) {
// 		//			resolve();
// 		//		}
// 		//	});
// 	}
//
// 	//todo rename
// 	private renderByRenderParamsGroupedByDescr(byDescr: Map<number, RenderParam>, delayParams: Set<DelayParam>) {
// 		if (my.debugLevel !== 0) {
// 			const sIds = new Set<number>();
// 			for (const r of byDescr.values()) {
// 				if (r.srcIds.size === 0) {
// 					sIds.add(r.srcId);
// 					continue;
// 				}
// 				for (const iId of r.srcIds) {
// 					sIds.add(iId);
// 				}
// 			}
// 			console.info("render =>", this.infoBySrcIds(sIds));
// 			//console.info("render =>", infoBySrcIds(new Set(Array.from(byD.values()).map(i => i.srcIds.size === 0 ? i.srcId : Array.from(i.srcIds)).flat())));
// 		}
// 		const syncInThisRender = new Set<Sync>();
// 		//const renderPack = [];
// 		const pSet = new Set();
// 		for (const [dId, r] of byDescr) {
// 			const sync = new Sync(++this.context.syncId, r);
// 			const $sync = this.context.$srcById.get(r.srcId) as HTMLElement; //!!
// 			const arrLen = r.srcIds.size;
// 			this.context.syncInRender.add(sync);
// 			syncInThisRender.add(sync);
// 			//--if (r.attr === null) {
// 			//--	r.attr = my.context.descrById.get(dId).attr;
// 			//--}
// 			//todo
// 			//if ($sync === undefined) {
// 			//	console.warn("_render !", r.srcId, sync);
// 			//	continue;
// 			//}
// 			if (r.scope === null) {
// 				//info такое может быть тогда, когда выше нигде не использовалась запись в скуоп и стртовый скоуп нулл
// 				r.scope = this.getScopeReact({});
// 			}
// 			if (arrLen === 1) {
// 				//renderPack.push({$src: $sync, renderParam: r, sync});
// 				pSet.add(this.renderTag($sync, r.scope, r.str, sync));
// 				continue;
// 			}
// 			const arr = new Array(arrLen);
// 			let i = 0;
// 			for (const sId of r.srcIds) {
// 				arr[i++] = new Q_arr(this.context.$srcById.get(sId) as HTMLElement, r.scope, null); //!!
// 			}
// 			//todo не могу сообразить, почему этот (1) вариант быстрее! неужели выполняется в нескольких потоках?
// 			//console.time(111);
// 			pSet.add(this.q_renderByRenderParams(r, sync, arr));
// 			//pSet.add(this.q_renderTag(arr, "", new Set(), sync)
// 			//	.then(() => console.timeEnd(111)));
// 			//была проблема с с() из-за потери ид для обновлении при отмене				.then(() => !console.log(123, my.context.srcIdsByVarId.get(my.context.varIdByVarIdByProp[55].get("green")), arr) && this.q_renderTag(arr, "", new Set(), sync)));
// 		}
// 		//if (renderPack.length !== 0) {
// 		//	pSet.add(this._renderPack(renderPack));
// 		//}
// 		return Promise.all(pSet)
// 			.then(() => {
// 				const pSet = new Set();
// 				for (const sync of syncInThisRender) {
// 					pSet.add(sync.promise);
// 					if (my.debugLevel === 0) {
// 						continue;
// 					}
// 					sync.promise.then(() => {
// 						if (sync.stat === 0) {
// 							//todo
// 							console.warn("0 0 sdfsdfsd");
// 						}
// 						const sIds =
// 							sync.renderParam.srcIds.size === 0
// 								? new Set([sync.renderParam.srcId])
// 								: sync.renderParam.srcIds;
// 						if (sync.stat === 7) {
// 							console.info("ready =>", this.infoBySrcIds(sIds));
// 							return;
// 						}
// 						console.info("cancel =>", this.infoBySrcIds(sIds));
// 					});
// 				}
// 				this.renderLoop(syncInThisRender);
// 				return Promise.all(pSet);
// 			})
// 			.then(() => {
// 				for (const d of delayParams) {
// 					for (const sync of syncInThisRender) {
// 						let l = sync.local.get(d.srcId);
// 						if (l !== undefined) {
// 							//for (; l !== undefined && l.newSrcId !== 0; l = sync.local.get(d.srcId)) {
// 							//	d.srcId = l.newSrcId;
// 							//}
// 							//d.srcId = this.getSrcId(sync.local, d.srcId);
// 							d.resolve(sync);
// 							break;
// 						}
// 					}
// 				}
// 				//todo
// 				const h = location.hash;
// 				if (h === this.context._oldLocHash) {
// 					return;
// 				}
// 				const $h = document.getElementById(h.substring(1));
// 				if ($h) {
// 					//!! todo !! this.context.__oldLocHash = h;
// 					$h.scrollIntoView();
// 				}
// 			})
// 			.catch(err => {
// 				for (const d of delayParams) {
// 					d.reject(err);
// 				}
// 				throw err;
// 			});
// 	}
//
// 	//todo ??
// 	get$srcScope($e: HTMLElement) {
// 		const srcBy$src = this.context.srcBy$src,
// 			$top = this.context.rootElement.parentNode;
// 		for (let $i = $e; $i !== $top; $i = $i.parentNode as HTMLElement) {
// 			//!!
// 			const iSrc = srcBy$src.get($i) as Src; //!!
// 			if (iSrc.scope !== null) {
// 				return iSrc.scope;
// 			}
// 		}
// 		return this.getScopeReact({});
// 	}
//
// 	/*
// 	function _renderPack(arr) {
// 		const nows = [],
// 			deferreds = [],
// 			arrLen = arr.length;
// 		for (let i = 0; i < arrLen; ++i) {
// 			const arrI = arr[i];
// 			if (this.is$visible(arrI.$src)) {
// 				nows.push(arrI);
// 				continue;
// 			}
// 			deferreds.push(arrI);
// 		}
// 		if (nows.length !== 0) {
// console.log(1, nows)
// 			const pSet = new Set(),
// 				l = nows.length;
// 			for (let i = 0; i < l; ++i) {
// 				const e = nows[i];
// 				pSet.add(this.renderTag(e.$src, e.renderParam.scope, e.renderParam.str, e.sync));
// 			}
// 			return Promise.all(pSet)
// 				.then(() => deferreds.length !== 0 && _renderPack(deferreds));
// //				.then(() => deferreds.length !== 0 && sync.afterAnimations.add(new Task(() => _q_batchingRender (renderParam, sync, deferreds), sync.local, 0)));
// 		}
// console.log(2, deferreds)
// 		const pSet = new Set(),
// 			l = deferreds.length;
// 		for (let i = 0; i < l; ++i) {
// 			const e = deferreds[i];
// 			pSet.add(new Promise(ricResolve => {
// 				const ricId = requestIdleCallback(() => {
// alert(1)
// 					e.sync.idleCallback.delete(ricId);
// 					this.renderTag(e.$src, e.renderParam.scope, e.renderParam.str, e.sync)
// 						.then(ricResolve);
// 				});
// 				e.sync.idleCallback.set(ricId, ricResolve);
// 			}, config.defIdleCallbackOpt));
// 		}
// 		return Promise.all(pSet);
// 	}*/
//
// 	private q_renderByRenderParams(renderParam: RenderParam, sync: Sync, arr: Q_arr[]): Promise<unknown> {
// 		const nows: Q_arr[] = [];
// 		const deferreds: Q_arr[] = [];
// 		const arrLen = arr.length;
// 		const srcBy$src = this.context.srcBy$src;
// 		for (let i = 0; i < arrLen; ++i) {
// 			const arrI = arr[i];
// 			if (this.is$visible(arrI.$src)) {
// 				nows.push(arrI);
// 				continue;
// 			}
// 			deferreds.push(arrI);
// 		}
// 		if (nows.length !== 0) {
// 			//console.log(1, nows)
// 			return this.q_renderTag(nows, renderParam.str, new Set(), sync).then(
// 				() =>
// 					deferreds.length !== 0 &&
// 					sync.afterAnimations.add(
// 						new Task(() => this.q_renderByRenderParams(renderParam, sync, deferreds), sync.local, 0)
// 					)
// 			);
// 		}
// 		//console.log(2, deferreds)
// 		return new Promise(ricResolve => {
// 			const ricId = requestIdleCallback(() => {
// 				sync.idleCallback.delete(ricId);
// 				this.q_renderTag(deferreds.splice(0, config.renderBatchSize), renderParam.str, new Set(), sync).then(() => {
// 					if (deferreds.length !== 0) {
// 						return this.q_renderByRenderParams(renderParam, sync, deferreds).then(ricResolve);
// 					}
// 					ricResolve(undefined);
// 				});
// 			}, config.defIdleCallbackOpt);
// 			sync.idleCallback.set(ricId, ricResolve);
// 		});
// 	}
//
// 	// private async renderLoop(syncInThisRender: Set<Sync>) {
// 	// 	//console.log(1111111111111111111)
// 	// 	while (true) {
// 	// 		const pSet = new Set();
// 	// 		//before
// 	// 		for (const sync of syncInThisRender) {
// 	// 			if (sync.stat !== 0 || sync.beforeAnimations.size === 0) {
// 	// 				continue;
// 	// 			}
// 	// 			const tasks = new Set(sync.beforeAnimations);
// 	// 			const pTasks = new Set();
// 	// 			sync.beforeAnimations.clear();
// 	// 			for (const task of tasks) {
// 	// 				pTasks.add(task.execute());
// 	// 			}
// 	// 			pSet.add(Promise.all(pTasks).then(() => this.dispatchLocalEvents(sync.local)));
// 	// 		}
// 	// 		if (pSet.size !== 0) {
// 	// 			await Promise.all(pSet);
// 	// 			pSet.clear();
// 	// 		}
// 	// 		//animation
// 	// 		for (const sync of syncInThisRender) {
// 	// 			if (sync.stat !== 0 || sync.animations.size === 0) {
// 	// 				continue;
// 	// 			}
// 	// 			const tasks = new Set(sync.animations);
// 	// 			sync.animations.clear();
// 	// 			const p = this.addAnimation(sync, tasks, false);
// 	// 			if (p !== null) {
// 	// 				pSet.add(p);
// 	// 			}
// 	// 		}
// 	// 		if (pSet.size !== 0) {
// 	// 			await Promise.all(pSet);
// 	// 			pSet.clear();
// 	// 		}
// 	// 		//after
// 	// 		for (const sync of syncInThisRender) {
// 	// 			if (sync.stat !== 0 || sync.afterAnimations.size === 0) {
// 	// 				continue;
// 	// 			}
// 	// 			const tasks = new Set(sync.afterAnimations);
// 	// 			const pTasks = new Set();
// 	// 			sync.afterAnimations.clear();
// 	// 			for (const task of tasks) {
// 	// 				pTasks.add(task.execute());
// 	// 			}
// 	// 			pSet.add(Promise.all(pTasks).then(() => this.dispatchLocalEvents(sync.local)));
// 	// 		}
// 	// 		if (pSet.size !== 0) {
// 	// 			await Promise.all(pSet);
// 	// 		}
// 	// 		const repeatSyncs = new Set<Sync>();
// 	// 		//scroll
// 	// 		for (const sync of syncInThisRender) {
// 	// 			//console.log(sync, sync.stat, sync.beforeAnimations.size, sync.animations.size, sync.afterAnimations.size, sync.scrollAnimations.size, sync.idleCallback.size, sync.animationFrame.size)
// 	// 			if (sync.stat === 0) {
// 	// 				if (sync.beforeAnimations.size !== 0 || sync.animations.size !== 0 || sync.afterAnimations.size !== 0) {
// 	// 					repeatSyncs.add(sync);
// 	// 					continue;
// 	// 				}
// 	// 				if (sync.scrollAnimations.size !== 0 || sync.idleCallback.size !== 0 || sync.animationFrame.size !== 0) {
// 	// 					//если кто-то работает с этим, то он сам ответственен за запуск рендерЛуп
// 	// 					continue;
// 	// 				}
// 	// 			}
// 	// 			if (sync.stat !== 0) {
// 	// 				//console.warn(23423423423);
// 	// 				this.context.syncInRender.delete(sync);
// 	// 				sync.resolve();
// 	// 				continue;
// 	// 			}
// 	// 			/*!!!!!!!!07.11.2022
// 	// 			//todo подумать - наверное есть другой способ - слишком жирно для одного вотч-а
// 	// 			//todo подумать что бы совсем убрать вотч
// 	// 			// watch
// 	// 			if (sync.onreadies.size !== 0) {
// 	// 				for (const h of sync.onreadies) {
// 	// 					h();
// 	// 				}
// 	// 			}*/
// 	// 			sync.stat = 7; //ready
// 	// 			this.context.syncInRender.delete(sync);
// 	// 			sync.resolve();
// 	// 			/*
// 	// 			for (const [iId, l] of sync.local) {
// 	// 				if (l.animationsCount !== 0) {
// 	// 					console.log(222222, iId, l);
// 	// 				}
// 	// 			}*/
// 	// 		}
// 	// 		if (repeatSyncs.size === 0) {
// 	// 			return;
// 	// 		}
// 	// 		syncInThisRender = repeatSyncs;
// 	// 		//return this.renderLoop(repeatSyncs);
// 	// 	}
// 	// }
// 	//
// 	// private addAnimation(sync: Sync, tasks: Set<Task>, isSet: boolean) {
// 	// 	//todo
// 	// 	if (sync.stat !== 0) {
// 	// 		console.warn(1111111111);
// 	// 		return null;
// 	// 	}
// 	// 	//const isSet = syncInThisRender === null,
// 	// 	const nows = isSet ? tasks : new Set<Task>();
// 	// 	const deferreds = new Set<Task>();
// 	// 	if (!isSet) {
// 	// 		for (const task of tasks) {
// 	// 			if (this.isAnimationVisible(task)) {
// 	// 				nows.add(task);
// 	// 				continue;
// 	// 			}
// 	// 			if (sync.renderParam.isLazyRender) {
// 	// 				sync.scrollAnimations.add(task);
// 	// 				continue;
// 	// 			}
// 	// 			deferreds.add(task);
// 	// 		}
// 	// 	}
// 	// 	//console.error(nows.size, deferreds.size, sync.scrollAnimations.size, isSet);
// 	// 	//alert(1);
// 	// 	if (nows.size !== 0) {
// 	// 		return new Promise(rafResolve => {
// 	// 			const rafId = requestAnimationFrame(() => {
// 	// 				sync.animationFrame.delete(rafId);
// 	// 				/*!!!!!
// 	// 				if (sync.stat !== 0) {
// 	// 					rafResolve();
// 	// 					return;
// 	// 				}*/
// 	// 				for (const a of nows) {
// 	// 					a.handler();
// 	// 				}
// 	// 				this.dispatchLocalEvents(sync.local);
// 	// 				if (deferreds.size === 0) {
// 	// 					rafResolve(undefined);
// 	// 					return;
// 	// 				}
// 	// 				/*
// 	// 				requestIdleCallback(() => {
// 	// 					if (sync.stat !== 0) {
// 	// 						rafResolve();
// 	// 						return;
// 	// 					}*/
// 	// 				const ricId = requestIdleCallback(() => {
// 	// 					sync.idleCallback.delete(ricId);
// 	// 					this.addAnimation(sync, deferreds, false)?.then(rafResolve);
// 	// 				}, config.defIdleCallbackOpt);
// 	// 				sync.idleCallback.set(ricId, rafResolve);
// 	// 			});
// 	// 			sync.animationFrame.set(rafId, rafResolve);
// 	// 		});
// 	// 	}
// 	// 	if (deferreds.size === 0) {
// 	// 		return null;
// 	// 	}
// 	// 	return new Promise(ricResolve => {
// 	// 		const ricId = requestIdleCallback(() => {
// 	// 			sync.idleCallback.delete(ricId);
// 	// 			const rafId = requestAnimationFrame(() => {
// 	// 				sync.animationFrame.delete(rafId);
// 	// 				/*!!!!!
// 	// 				if (sync.stat !== 0) {
// 	// 					ricResolve();
// 	// 					return;
// 	// 				}*/
// 	// 				for (const a of deferreds) {
// 	// 					a.handler();
// 	// 				}
// 	// 				this.dispatchLocalEvents(sync.local);
// 	// 				ricResolve(undefined);
// 	// 				return;
// 	// 			});
// 	// 			sync.animationFrame.set(rafId, ricResolve);
// 	// 		}, config.defIdleCallbackOpt);
// 	// 		sync.idleCallback.set(ricId, ricResolve);
// 	// 	});
// 	// }
// 	//
// 	// checkScrollAnimations() {
// 	// 	const pSet = new Set();
// 	// 	const scrollSync = new Set<Sync>();
// 	// 	const $srcById = this.context.$srcById;
// 	// 	for (const sync of this.context.syncInRender) {
// 	// 		if (sync.stat !== 0 || sync.scrollAnimations.size === 0) {
// 	// 			continue;
// 	// 		}
// 	// 		const tasks = new Set<Task>();
// 	// 		for (const a of sync.scrollAnimations) {
// 	// 			if (!$srcById.has(a.viewedSrcId)) {
// 	// 				sync.scrollAnimations.delete(a);
// 	// 				if (sync.scrollAnimations.size === 0) {
// 	// 					scrollSync.add(sync);
// 	// 				}
// 	// 				continue;
// 	// 			}
// 	// 			if (this.isAnimationVisible(a)) {
// 	// 				sync.scrollAnimations.delete(a);
// 	// 				tasks.add(a);
// 	// 			}
// 	// 		}
// 	// 		if (tasks.size !== 0) {
// 	// 			pSet.add(this.addAnimation(sync, tasks, true));
// 	// 			scrollSync.add(sync);
// 	// 		}
// 	// 	}
// 	// 	if (pSet.size !== 0) {
// 	// 		//console.log("tasks")
// 	// 		Promise.all(pSet).then(() => this.renderLoop(scrollSync));
// 	// 		return;
// 	// 	}
// 	// 	//todo вроде бы всё ок - но почему-то ранее я считал что мы сюда не попадём
// 	// 	if (scrollSync.size !== 0) {
// 	// 		console.warn("2tasks");
// 	// 		this.renderLoop(scrollSync);
// 	// 	}
// 	// }
// 	//
// 	// private isAnimationVisible(animate: Task) {
// 	// 	if (animate.viewedSrcId === 0) {
// 	// 		return true;
// 	// 	}
// 	// 	const $src = this.context.$srcById.get(this.getSrcId(animate.local, animate.viewedSrcId));
// 	// 	//todo-- ??
// 	// 	if ($src === undefined) {
// 	// 		throw new Error("$src === undefined");
// 	// 	}
// 	// 	return this.is$visible($src);
// 	// 	/*
// 	// 	}
// 	// 	for (const sId in animate.viewedSrcId) {
// 	// 		if (!is$visibleBySrcId(sId)) {
// 	// 			return false;
// 	// 		}
// 	// 	}
// 	// 	return true;*/
// 	// }
// 	//
// 	// private dispatchLocalEvents(local: Map<number, LocalState>) {
// 	// 	for (const [sId, l] of local) {
// 	// 		if (l.animationsCount === 0) {
// 	// 			this.dispatchLocalEventsBySrcId(sId, l);
// 	// 		}
// 	// 	}
// 	// }
//
// 	private prepareRenderParam(toCancelSync: Set<Sync>) {
// 		//const renderParamByDescrId = new Map(),
// 		// const srcById = this.context.srcById;
// 		// const descrById = this.context.descrById;
// 		// const srcBy$src = this.context.srcBy$src;
// 		// const $srcById = this.context.$srcById;
// 		const {srcById, descrById, srcBy$src, $srcById} = this.context;
// 		const byDescr = new Map<number, RenderParam>();
// 		//console.log("prepareRenderParam", new Set(this.context.renderParams));
// 		//console.time("p1")
// 		for (const r of this.context.renderParams) {
// 			const srcId = r.srcId;
// 			const src = srcById.get(srcId);
// 			if (src === undefined) {
// 				//удалённые элементы, ссылки на переменные еще могут остаться так как они удаляются в фоне
// 				continue;
// 			}
// 			const descr = src.descr;
// 			const descrId = descr.id;
// 			const rr = byDescr.get(descrId);
// 			if (rr !== undefined) {
// 				if (descr.asOnes === null) {
// 					//!!если в byD уже есть для этого описания, то это должен быть ку алгоритм
// 					rr.srcIds.add(srcId);
// 				}
// 				continue;
// 			}
// 			byDescr.set(descrId, r);
// 			if (descr.asOnes === null) {
// 				r.srcIds.add(srcId);
// 				continue;
// 			}
// 			//<div foreach.1><div foreach.2<-если мы здесь, т.е во всех 1 собаем все 2
// 			const $parents = new Set();
// 			for (const jId of descr.srcIds) {
// 				const $p = ($srcById.get(jId) as HTMLElement).parentNode; //!!
// 				if ($parents.has($p)) {
// 					continue;
// 				}
// 				$parents.add($p);
// 				r.srcIds.add(jId);
// 			}
// 		}
// 		//console.timeEnd("p1")
// 		//console.time("p2")
// 		for (const [dId, r] of byDescr) {
// 			//вычисляем когда много элементов типа: if-else or inc и оставляем только первый dId
// 			//const $i = $srcById.get(r.srcId),
// 			//!!
// 			const src = srcById.get(r.srcId) as Src; //!!
// 			if (src.is$hide()) {
// 				//если элемент скрыт template-ом
// 				this.prpDeleteDescrId(byDescr, dId, toCancelSync);
// 				continue;
// 			}
// 			//const descr = descrById.get(dId);
// 			const descr = src.descr;
// 			if (descr.asOnes !== null || descr.get$elsByStr === null) {
// 				continue;
// 			}
// 			//const $els = this.get$els($i, descr.get$elsByStr, ""),
// 			const $els = src.get$els("");
// 			const $elsLen = $els.length;
// 			if ($elsLen === 1) {
// 				continue;
// 			}
// 			//if-else, inc
// 			for (let f = true, i = 0; i < $elsLen; ++i) {
// 				const iSrc = srcBy$src.get($els[i]);
// 				if (iSrc === undefined) {
// 					continue;
// 				}
// 				const iDId = iSrc.descr.id;
// 				if (iDId !== dId) {
// 					// && byD.has(iDId)) {
// 					this.prpDeleteDescrId(byDescr, iDId, toCancelSync);
// 				}
// 				/*
// 				if (f && iSrc.isCmd) {//!!эта оптимизация не имеет особого приемущества
// 					f = false;
// 					r.srcId = iSrc.id;
// 					byD.set(iSrc.descr.id, r);
// 					continue;
// 				}
// 				this.prpDeleteDescrId(byD, iSrc.descr.id, toCancleSync);*/
// 			}
// 			r.$els = $els; //нужен для getPosStat() при проверке на отмену
// 		}
// 		//console.timeEnd("p2")
// 		//console.time("p3")
// 		const mergeByD = new Map<number, PrepareMerge>();
// 		const $top = this.context.rootElement.parentNode;
// 		for (const [dId, r] of byDescr) {
// 			//размечаем глубины и расширяем для get$els
// 			let $i = $srcById.get(r.srcId) as HTMLElement; //!!
// 			let iSrc = srcBy$src.get($i) as Src; //!! //todo by id
// 			const mI = new PrepareMerge(0, iSrc.asOneIdx !== null ? iSrc.asOneIdx.values().next().value : 0);
// 			mergeByD.set(dId, mI);
// 			for (; $i !== $top; $i = $i.parentNode as HTMLElement, iSrc = srcBy$src.get($i) as Src) {
// 				//!!
// 				/*
// 				if ($i === $top) {
// 					for (const iId of r.srcIds) {
// //todo!!!!!!--
// 						if (iId !== r.srcId && this.is$hide($srcById[iId])) {//из-за чего может получится что элемент в рендере и его нет в доме?
// 							r.srcIds.delete(iId);
// 						}
// 					}
// //					renderParamByDescrId.set(dId, p);
// 					break;
// 				}*/
// 				/*
// 				const iDId = $i[p_descrId];
// 				if (!iDId) {//защита от документФрагмента
// //todo--
// console.warn(2222, $i);
// alert(222);
// 				}*/
//
// 				++mI.len;
// 				if (r.scope === null && iSrc.scope !== null) {
// 					r.scope = iSrc.scope;
// 				}
// 				if ($i.getAttribute(config.lazyRenderName) !== null) {
// 					r.isLazyRender = true;
// 					//todo, наверное, нужно продумать удаление слушателя при изменении атрибута
// 					//так тто мы не удаляем его никогда только добавляем
// 					this.addScrollAnimationsEvent($i);
// 				}
// 				const iDescr = iSrc.descr;
// 				if (iSrc.asOneIdx !== null || iDescr.get$elsByStr === null) {
// 					mI.descrId.add(iDescr.id);
// 					continue;
// 				}
// 				//const $els = this.get$els($i, iDescr.get$elsByStr, "");//todo <-- $els - для первого $i мы ранее уже вычисляли $els
// 				const $els = iSrc.get$els(""); //todo <-- $els - для первого $i мы ранее уже вычисляли $els
// 				//if ($els) {
// 				for (let j = $els.length - 1; j > -1; --j) {
// 					const iSrc = srcBy$src.get($els[j]);
// 					if (iSrc !== undefined) {
// 						mI.descrId.add(iSrc.descr.id);
// 					}
// 				}
// 				//}
// 			}
// 		}
// 		//console.timeEnd("p3")
// 		//console.time("p4")
// 		const byDescrArr = Array.from(byDescr.keys());
// 		const byDArrLen = byDescrArr.length;
// 		for (let $l: Node | null, l: number, j: number, i = 0; i < byDArrLen; ++i) {
// 			const iDId = byDescrArr[i];
// 			//if (!byDescr.has(iDId)) {
// 			if (iDId === 0) {
// 				continue;
// 			}
// 			const mI = mergeByD.get(iDId) as PrepareMerge; //!!
// 			for (j = 0; j < byDArrLen; ++j) {
// 				const jDId = byDescrArr[j];
// 				if (jDId === 0 || iDId === jDId) {
// 					continue;
// 				}
// 				const mJ = mergeByD.get(jDId) as PrepareMerge; //!!
// 				if (mI.len > mJ.len) {
// 					continue;
// 				}
// 				//if (mI.len !== mJ.len && mJ.descrId.has(iDId)) {
// 				if (mJ.descrId.has(iDId)) {
// 					/*
// 					$l = $srcById.get(byDescr.get(jDId).srcId);
// 					for (l = mJ.len - mI.len; l !== -1; --l) {
// 						$l = $l.parentNode;
// 					}
// console.log(444, mJ.len - mI.len, $l, $srcById.get(byDescr.get(iDId).srcId), descrById.get(jDId), byDescr.get(jDId));
// 					if ($srcById.get(byDescr.get(iDId).srcId).parentNode === $l) {
// 						prpDeleteDescrId(byDescr, jDId, toCancelSync);
// 						byDescrArr[j] = 0;
// 					}*/
// 					const $p = ($srcById.get((byDescr.get(iDId) as RenderParam).srcId) as HTMLElement).parentNode; //!!
// 					const lLen = mJ.len - mI.len;
// 					for (const lId of (descrById.get(jDId) as Descr).srcIds) {
// 						//!!
// 						$l = $srcById.get(lId) as HTMLElement; //!!
// 						for (l = lLen; $l !== null && l !== -1; --l) {
// 							//может быть скрытым
// 							$l = $l.parentNode;
// 						}
// 						if ($l === $p) {
// 							this.prpDeleteDescrId(byDescr, jDId, toCancelSync);
// 							byDescrArr[j] = 0;
// 							break;
// 						}
// 					}
// 					continue;
// 				}
// 				//console.log(444, mI.firstAsOneIdx, mJ.firstAsOneIdx, iDId, jDId)
// 				if (mI.firstAsOneIdx !== 0 && mI.firstAsOneIdx === mJ.firstAsOneIdx) {
// 					this.prpDeleteDescrId(byDescr, jDId, toCancelSync);
// 					byDescrArr[j] = 0;
// 				}
// 				/*
// //change on firstAsOneIdx
// 				if (mI.asOneIdx.size === 0 || mJ.asOneIdx.size === 0) {
// 					continue;
// 				}
// 				for (const i of mI.asOneIdx) {
// 					if (mJ.asOneIdx.has(i)) {
// 						byDescr.delete(jDId);
// //console.warn(byD.delete, dId);
// 						byDescrArr[j] = 0;
// 						break;
// 					}
// 				}*/
// 				/*
// 				const mJ = mergeByD.get(jDId);
// //console.log(2, mI, mJ, iDId, jDId);
// 				if (mI.len < mJ.len) {
// 					if (mJ.descrId.has(iDId)) {
// 						byDescr.delete(jDId);
// 						byDescrArr[j] = 0;
// 						continue;
// 					}
// 					if (mI.asOneIdx.size === 0 || mJ.asOneIdx.size === 0) {
// 						continue;
// 					}
// 					for (const i of mI.asOneIdx) {
// 						if (mJ.asOneIdx.has(i)) {
// 							byDescr.delete(jDId);
// 							byDescrArr[j] = 0;
// 							break;
// 						}
// 					}
// 					continue;
// 				}
// //				if (mI.len > mJ.len && mI.descrId.has(jDId)) {
// //				if (mI.len > mJ.len && mI.descrId[jDId]) {
// 				if (mI.len === mJ.len) {
// 					continue;
// 				}
// 				if (mI.descrId.has(jDId)) {
// 					byDescr.delete(iDId);
// 					break;
// 				}
// 				if (mI.asOneIdx.size === 0 || mJ.asOneIdx.size === 0) {
// 					continue;
// 				}
// 				let f = false;
// 				for (const idx of mJ.asOneIdx) {
// 					if (mI.asOneIdx.has(idx)) {
// 						byDescr.delete(iDId);
// 						f = true;
// 						break;
// 					}
// 				}
// 				if (f) {
// 					break;
// 				}*/
// 			}
// 		}
// 		//console.timeEnd("p4")
// 		//console.log(2, new Map(byDescr), toCancleSync);
// 		//alert(1);
// 		this.context.renderParams.clear();
// 		return byDescr;
// 	}
//
// 	private prpDeleteDescrId(byDescr: Map<number, RenderParam>, descrId: number, toCancelSync: Set<Sync>) {
// 		if (!byDescr.has(descrId)) {
// 			return;
// 		}
// 		const s = (byDescr.get(descrId) as RenderParam).srcIds; //!!
// 		//let sId;
// 		for (const sync of this.context.syncInRender) {
// 			//sId = sync.renderParam.srcId;
// 			//for (let l = sync.local.get(sId); l.newSrcId !== 0; l = sync.local.get(sId)) {
// 			//	sId = l.newSrcId;
// 			//}
// 			//sId = this.getSrcId(sync.local, sync.renderParam.srcId);
// 			if (s.has(sync.renderParam.srcId)) {
// 				sync.stat = 4;
// 				toCancelSync.add(sync);
// 			}
// 		}
// 		//console.error(descrId);
// 		byDescr.delete(descrId);
// 	}
//
// 	private checkSync(sync: Sync, newRenderParam: RenderParam) {
// 		//0 - parallel
// 		//1 - new above
// 		//2 - new eq
// 		//3 - new below
// 		//4 - by prepare
// 		//5 - not found sync.renderParam.srcId
// 		//7 - ready
// 		//8 - cancel
// 		const stat = this.getPosStat(sync, newRenderParam);
// 		//console.log("cancel", stat, sync.stat, sync, newRenderParam);
// 		if (sync.stat !== 0) {
// 			return stat;
// 		}
// 		if (stat !== 0) {
// 			this.cancelSync(sync, stat);
// 		}
// 		return stat;
// 	}
//
// 	private cancelSync(sync: Sync, stat: number) {
// 		sync.stat = stat;
// 		for (const [id, r] of sync.idleCallback) {
// 			cancelIdleCallback(id);
// 			r();
// 		}
// 		for (const [id, r] of sync.animationFrame) {
// 			cancelAnimationFrame(id);
// 			r();
// 		}
// 		this.context.syncInRender.delete(sync);
// 		sync.resolve();
// 		return stat;
// 	}
//
// 	private getPosStat(sync: Sync, newRenderParam: RenderParam) {
// 		//let syncSrcId = sync.renderParam.srcId;
// 		//if (!my.context.srcById.has(syncSrcId)) {
// 		//	for (let l = sync.local.get(syncSrcId); l.newSrcId !== 0; l = sync.local.get(syncSrcId)) {
// 		//		syncSrcId = l.newSrcId;
// 		//	}
// 		//}
// 		const syncSrcId = this.getSrcId(sync.local, sync.renderParam.srcId);
// 		const $sync = this.context.$srcById.get(syncSrcId);
// 		//todo--
// 		if ($sync === undefined) {
// 			//throw new Error("!!! checkSync - hz " + syncSrcId);
// 			console.warn("!!! checkSync - hz " + syncSrcId);
// 			return 5;
// 		}
// 		const srcBy$src = this.context.srcBy$src;
// 		const $top = this.context.rootElement.parentNode;
// 		const $new = this.context.$srcById.get(newRenderParam.srcId);
//
// 		//todo --
// 		if ($new === undefined) {
// 			throw new Error("$new === undefined");
// 		}
//
// 		if (newRenderParam.$els === null) {
// 			for (let $i = $sync; $i !== $top; $i = $i.parentNode as HTMLElement) {
// 				//!!
// 				if ($i === $new) {
// 					return $i === $sync ? 2 : 1;
// 				}
// 			}
// 		} else {
// 			const $newEls = newRenderParam.$els;
// 			const $newElsLen = $newEls.length;
// 			for (let j, $i = $sync; $i !== $top; $i = $i.parentNode as HTMLElement) {
// 				//!!
// 				for (j = 0; j < $newElsLen; ++j) {
// 					//const $j = $els[j],
// 					//	jSrc = srcBy$src.get($j);
// 					//if (jSrc === undefined) {
// 					//	continue;
// 					//}
// 					//const jId = jSrc.id;
// 					//if (jId === iId) {
// 					//	return iId === syncSrcId ? 2 : 1;
//
// 					//!!если будет большой делаэй, то новый параметр могут скрыть - и поэтому нужнго по ид
// 					//!! - в этом нет необходимости, потому-что эта функция синхронна и мы берем значения по ид
// 					if ($newEls[j] === $i) {
// 						return $i === $sync ? 2 : 1;
// 					}
// 				}
// 			}
// 		}
// 		for (let i, $i = $new.parentNode as HTMLElement; $i !== $top; $i = $i.parentNode as HTMLElement) {
// 			//!!
// 			const iSrc = srcBy$src.get($i) as Src; //!!
// 			if (iSrc.descr.get$elsByStr === null) {
// 				if ($i === $sync) {
// 					return 3;
// 				}
// 				continue;
// 			}
// 			const $els = iSrc.get$els("");
// 			const $elsLen = $els.length;
// 			for (i = 0; i < $elsLen; ++i) {
// 				if ($els[i] === $sync) {
// 					return 3;
// 				}
// 			}
// 		}
// 		return 0;
// 	}
//
// 	private infoBySrcIds(srcIds: Set<number>) {
// 		const i: Record<number, HTMLElement> = {};
// 		for (const sId of srcIds) {
// 			i[sId] = this.context.$srcById.get(sId) as HTMLElement; //!!
// 		}
// 		return i;
// 	}
// }
