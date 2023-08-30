import {Loading} from "./Loading.js";
import {Sync} from "./Sync.js";
import {Task} from "./Task.js";
import {config} from "../config.js";
import {LocalState} from "./LocalState.js";
import {Src} from "./Src.js";

export abstract class RenderLoop extends Loading {
	checkScrollAnimations() {
		const pArr = [];
		const scrollSync = new Set<Sync>();
		const $srcById = this.context.$srcById;
		for (const sync of this.context.syncInRender) {
			if (sync.stat !== 0 || sync.scrollAnimations.size === 0) {
				continue;
			}
			const tasks = new Set<Task>();
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
					tasks.add(a);
				}
			}
			if (tasks.size !== 0) {
				pArr.push(this.addAnimation(sync, tasks, true));
				scrollSync.add(sync);
			}
		}
		if (pArr.length !== 0) {
			//console.log("tasks")
			Promise.all(pArr).then(() => this.renderLoop(scrollSync));
			return;
		}
		//todo вроде бы всё ок - но почему-то ранее я считал что мы сюда не попадём
		if (scrollSync.size !== 0) {
			console.warn("2tasks");
			this.renderLoop(scrollSync);
		}
	}

	protected async renderLoop(syncInThisRender: Set<Sync>) {
		// console.log(1111111111111111111)
		while (true) {
			const pArr = [];
			//before
			for (const sync of syncInThisRender) {
				if (sync.stat !== 0 || sync.beforeAnimations.size === 0) {
					continue;
				}
				const tasks = new Set(sync.beforeAnimations);
				const pTasks = new Array(tasks.size);
				sync.beforeAnimations.clear();
				for (const task of tasks) {
					pTasks.push(task.execute());
				}
				pArr.push(Promise.all(pTasks).then(() => this.dispatchLocalEvents(sync.local)));
			}
			if (pArr.length !== 0) {
				await Promise.all(pArr);
				pArr.length = 0;
			}
			//animation
			for (const sync of syncInThisRender) {
				if (sync.stat !== 0 || sync.animations.size === 0) {
					continue;
				}
				const tasks = new Set(sync.animations);
				sync.animations.clear();
				const p = this.addAnimation(sync, tasks, false);
				if (p !== null) {
					pArr.push(p);
				}
			}
			if (pArr.length !== 0) {
				await Promise.all(pArr);
				pArr.length = 0;
			}
			//after
			for (const sync of syncInThisRender) {
				if (sync.stat !== 0 || sync.afterAnimations.size === 0) {
					continue;
				}
				const tasks = new Set(sync.afterAnimations);
				const pTasks = new Set();
				sync.afterAnimations.clear();
				for (const task of tasks) {
					pTasks.add(task.execute());
				}
				pArr.push(Promise.all(pTasks).then(() => this.dispatchLocalEvents(sync.local)));
			}
			if (pArr.length !== 0) {
				await Promise.all(pArr);
			}
			const repeatSyncs = new Set<Sync>();
			//scroll
			for (const sync of syncInThisRender) {
				//console.log(sync, sync.stat, sync.beforeAnimations.size, sync.animations.size, sync.afterAnimations.size, sync.scrollAnimations.size, sync.idleCallback.size, sync.animationFrame.size)
				if (sync.stat === 0) {
					if (sync.beforeAnimations.size !== 0 || sync.animations.size !== 0 || sync.afterAnimations.size !== 0) {
						repeatSyncs.add(sync);
						continue;
					}
					if (sync.scrollAnimations.size !== 0 || sync.idleCallback.size !== 0 || sync.animationFrame.size !== 0) {
						//если кто-то работает с этим, то он сам ответственен за запуск рендерЛуп
						continue;
					}
				}
				if (sync.stat !== 0) {
					//console.warn(23423423423);
					this.context.syncInRender.delete(sync);
					sync.resolve();
					continue;
				}
				/*!!!!!!!!07.11.2022
				//todo подумать - наверное есть другой способ - слишком жирно для одного вотч-а
				//todo подумать что бы совсем убрать вотч
				// watch
				if (sync.onreadies.size !== 0) {
					for (const h of sync.onreadies) {
						h();
					}
				}*/
				sync.stat = 7; //ready
				this.context.syncInRender.delete(sync);
				sync.resolve();
				/*
				for (const [iId, l] of sync.local) {
					if (l.animationsCount !== 0) {
						console.log(222222, iId, l);
					}
				}*/
			}
			if (repeatSyncs.size === 0) {
				return;
			}
			syncInThisRender = repeatSyncs;
			//return this.renderLoop(repeatSyncs);
		}
	}

	private isAddScrollAnimationsEvent = new WeakSet();

	protected addScrollAnimationsEvent($e: HTMLElement) {
		if (this.isAddScrollAnimationsEvent.has($e)) {
			return;
		}
		this.isAddScrollAnimationsEvent.add($e);
		$e.addEventListener(
			"scroll",
			() => {
				if ($e.getAttribute(config.lazyRenderName) !== null) {
					//todo проблема с зависимостями
					this.checkScrollAnimations();
				}
			},
			{
				passive: true,
			}
		);
	}

	protected testLocalEventsBySrcId(local: Map<number, LocalState>, srcId: number) {
		const l = local.get(srcId) as LocalState; //!!
		if (l.animationsCount === 0) {
			this.dispatchLocalEventsBySrcId(srcId, l);
		}
	}

	private addAnimation(sync: Sync, tasks: Set<Task>, isSet: boolean) {
		//todo
		if (sync.stat !== 0) {
			console.warn(1111111111);
			return null;
		}
		//const isSet = syncInThisRender === null,
		const nows = isSet ? tasks : new Set<Task>();
		const deferreds = new Set<Task>();
		if (!isSet) {
			for (const task of tasks) {
				if (this.isAnimationVisible(task)) {
					nows.add(task);
					continue;
				}
				if (sync.renderParam.isLazyRender) {
					sync.scrollAnimations.add(task);
					continue;
				}
				deferreds.add(task);
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
						rafResolve(undefined);
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
						this.addAnimation(sync, deferreds, false)?.then(rafResolve);
					}, config.defIdleCallbackOpt);
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
					ricResolve(undefined);
					return;
				});
				sync.animationFrame.set(rafId, ricResolve);
			}, config.defIdleCallbackOpt);
			sync.idleCallback.set(ricId, ricResolve);
		});
	}

	private isAnimationVisible(animate: Task) {
		if (animate.viewedSrcId === 0) {
			return true;
		}
		const $src = this.context.$srcById.get(this.getSrcId(animate.local, animate.viewedSrcId));
		//todo-- ??
		if ($src === undefined) {
			const a = animate.local.get(animate.viewedSrcId);
			debugger;
			throw new Error("$src === undefined");
		}
		return this.is$visible($src);
		/*
		}
		for (const sId in animate.viewedSrcId) {
			if (!is$visibleBySrcId(sId)) {
				return false;
			}
		}
		return true;*/
	}

	private dispatchLocalEvents(local: Map<number, LocalState>) {
		for (const [sId, l] of local) {
			if (l.animationsCount === 0) {
				this.dispatchLocalEventsBySrcId(sId, l);
			}
		}
	}

	private dispatchLocalEventsBySrcId(srcId: number, l: LocalState) {
		const $src = this.context.$srcById.get(srcId);
		if ($src === undefined) {
			return;
		}
		l.animationsCount = -1;
		//на тимплэйт события не придут и так
		if ($src.nodeName === "TEMPLATE") {
			return;
		}
		//console.log("a-render");//, $src);
		//console.log("a-render", $src);
		const src = this.context.srcById.get(srcId) as Src; //!!
		if (!src.isMounted) {
			src.isMounted = true;
			$src.dispatchEvent(new CustomEvent(config.mountEventName, config.defEventInit));
		}
		$src.dispatchEvent(new CustomEvent(config.renderEventName, config.defEventInit));
	}
}
