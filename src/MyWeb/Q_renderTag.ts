import {Command} from "../command/Command.js";
import {config} from "../config.js";
import {LocalState} from "./LocalState.js";
import {Q_arr} from "./Q_arr.js";
import {RenderTag} from "./RenderTag.js";
import {Sync} from "./Sync.js";
import {Src} from "./Src.js";
import {RenderRes} from "./RenderRes.js";

const null_q_render = Command.prototype.q_render;

export abstract class Q_renderTag extends RenderTag {
	async q_renderTag(arr: Q_arr[], str: string, isLast: Set<number>, sync: Sync) {
		//console.log("q_render", arr.map(i => [i.$src, i.scope]), str);
		//alert(1);
		if (sync.stat !== 0) {
			//return arr;
			return Promise.resolve(arr);
		}
		const arrLen = arr.length;
		const srcBy$src = this.context.srcBy$src;
		for (let i = 0; i < arrLen; ++i) {
			const aI = arr[i];
			const $i = aI.$src;
			const iSrc = srcBy$src.get($i) as Src;
			const iId = iSrc.id;
			if (!sync.local.has(iId)) {
				sync.local.set(iId, new LocalState());
				//!!см выше		$i.dispatchEvent(new CustomEvent(renderStartEventName, config.defEventInit));
				//console.log("q_rend - local create", $i);
			}
			//aI.scope = aI.scope !== null ? iSrc.getScope(aI.scope) : iSrc.scope;
			//todo можно проверить srcBy$src.ge(arr[0].$src).scope === null и сделать два цикла - экономим одно условие на проход
			// if (iSrc.scope === null) {
			// 	continue;
			// }
			if (aI.scope !== null) {
				if (iSrc.scope !== null) {
					aI.scope = iSrc.getScope(aI.scope);
				}
			} else if (iSrc.scope !== null) {
				aI.scope = iSrc.scope;
			} else {
				continue;
			}
			if (aI.scopePatch !== null) {
				const aIScopeTarget = aI.scope[config.p_target] as typeof aI.scope;
				for (const p in aI.scopePatch) {
					aIScopeTarget[p] = aI.scopePatch[p];
				}
			}
		}
		const src = srcBy$src.get(arr[0].$src) as Src;
		const attr = str === "" ? src.descr.attr : src.getAttrAfter(str);
		if (attr !== null && attr.size !== 0) {
			const lastCount = await this.q_attrRender(arr, attr, isLast, sync);
			if (lastCount === arrLen) {
				return arr;
			}
		}
		await this.q_renderChildren(arr, isLast, sync);
		for (let i = 0; i < arrLen; ++i) {
			this.testLocalEventsBySrcId(sync.local, (srcBy$src.get(arr[i].$src) as Src).id);
		}
		return arr;
	}

	private async q_attrRender(arr: Q_arr[], attr: Map<string, string>, isLast: Set<number>, sync: Sync) {
		let lastCount = 0;
		const q_context = new Q_renderCtx();
		const arrLen = arr.length;
		for (const [n, v] of attr) {
			const res = await this.q_execRender(arr, n, v, isLast, sync);
			if (sync.stat !== 0) {
				//console.log("isCancel", sync.stat, n, v, 2);
				return lastCount;
			}

			//todo !!
			if (!res && res !== null) {
				console.warn(232332312321);
			}

			if (res === null) {
				continue;
			}
			for (let i = 0; i < arrLen; ++i) {
				if (isLast.has(i)) {
					continue;
				}
				const resI = await res[i];

				//todo !!
				if (!resI && resI !== null) {
					console.warn(232332312321);
				}

				if (resI === null) {
					continue;
				}
				if (resI.attrStr !== "") {
					this.q_addAfterAttr(resI.$src as HTMLElement, arr[i].scope, resI.attrStr, q_context); //!!
					isLast.add(i);
					++lastCount;
					continue;
				}
				if (resI.$last !== null) {
					arr[i].$src = resI.$last;
					isLast.add(i);
					++lastCount;
				} /* else if (resI.$last !== null) {
					//todo -- !!!!!!!
					console.warn(222222222, resI);
					//--arr[i].$src = resI.$last;
				}*/
			}
		}
		const pArr = [];
		for (const byAttr of q_context.afterByDescrByAttr.values()) {
			for (const [attrKey, arr] of byAttr) {
				pArr.push(this.q_renderTag(arr, q_context.strByAttrKey.get(attrKey) || "", new Set(), sync));
				//todo почему я делал так?
				//await this.q_renderTag(arr, q_context.strByAttrKey.get(attrKey), new Set(), sync);
			}
		}
		if (pArr.length !== 0) {
			await Promise.all(pArr);
		}
		return lastCount;
	}

	//todo
	private q_addAfterAttr($src: HTMLElement, scope: Record<string | symbol, unknown>, str: string, q_context: Q_renderCtx) {
		const src = this.context.srcBy$src.get($src) as Src;
		const attrKey = this.getAttrKey(src.getAttrAfter(str));
		const descrId = src.descr.id;
		const byDescr = q_context.afterByDescrByAttr.get(descrId);
		const arrI = new Q_arr($src, scope, null);
		if (!q_context.strByAttrKey.has(attrKey)) {
			q_context.strByAttrKey.set(attrKey, str);
		}
		if (byDescr !== undefined) {
			const arr = byDescr.get(attrKey);
			if (arr) {
				arr.push(arrI);
				return;
			}
			byDescr.set(attrKey, [arrI]);
			return;
		}
		q_context.afterByDescrByAttr.set(descrId, new Map([[attrKey, [arrI]]]));
	}

	private q_renderChildren(arr: Q_arr[], isLast: Set<number>, sync: Sync) {
		const $first = arr[0].$src;
		if (sync.stat !== 0 || (this.context.srcBy$src.get($first) as Src).descr.isCustomHtml) {
			//console.log(78979, sync.stat, $first);
			return;
		}
		if (!sync.renderParam.isLazyRender && $first.getAttribute(config.lazyRenderName) !== null) {
			sync.renderParam.isLazyRender = true;
		}
		const nextArr = [];
		const arrLen = arr.length;
		const isLazyRender = sync.renderParam.isLazyRender;
		for (let i = 0; i < arrLen; ++i) {
			//if (!isLast[i] && arr[i].$src.nodeType === 1) {//?? бывает ли в арр не элемент? - проверил, может. --- бывает <!-inc_end
			if (isLast.has(i)) {
				//?? Бывает ли в arr не элемент? - проверил, может. --- бывает <!-import_end ---- Должен быть ЛАСТ
				continue;
			}
			const aI = arr[i];
			nextArr.push(new Q_arr(aI.$src, aI.scope, null));
			if (isLazyRender) {
				//todo
				this.addScrollAnimationsEvent(aI.$src);
			}
		}
		if (nextArr.length === 0) {
			return;
		}
		return this.q_renderFlow(nextArr, true, sync);
	}

	private q_renderFlow(arr: Q_arr[], isFirst: boolean, sync: Sync): Promise<unknown> {
		const byDescr = this.q_nextGroupByDescr(arr, isFirst);
		// if (byDescr.size === 0) {
		// 	return;
		// }
		const isLast = new Set<number>();
		const pArr = [];
		for (const dArr of byDescr.values()) {
			pArr.push(
				this.q_renderTag(dArr, "", isLast, sync).then(() => {
					if (sync.stat !== 0) {
						return;
					}
					const nextArr = [] as Q_arr[];
					const dArrLen = dArr.length;
					for (let i = 0; i < dArrLen; ++i) {
						if (!isLast.has(i)) {
							nextArr.push(dArr[i]);
						}
					}
					return this.q_renderFlow(nextArr, false, sync);
				})
			);
		}
		return Promise.all(pArr);
	}

	private q_nextGroupByDescr(arr: Q_arr[], isFirst: boolean) {
		const byDescr = new Map<number, Q_arr[]>();
		const arrLen = arr.length;
		const srcBy$src = this.context.srcBy$src;
		for (let $i: Node | null, i = 0; i < arrLen; ++i) {
			if (arr[i].$src.nodeType !== 1) {
				continue;
			}
			for ($i = isFirst ? arr[i].$src.firstChild : arr[i].$src.nextSibling; $i !== null; $i = ($i as Node).nextSibling) {
				//!!
				const iSrc = srcBy$src.get($i as HTMLElement); //!!
				if (iSrc === undefined) {
					continue;
				}
				arr[i].$src = $i as HTMLElement; //!!
				const dId = iSrc.descr.id;
				const byD = byDescr.get(dId);
				if (byD !== undefined) {
					byD.push(arr[i]);
				} else {
					byDescr.set(dId, [arr[i]]);
				}
				break;
			}
		}
		return byDescr;
	}

	private q_execRender(arr: Q_arr[], str: string, expr: string, isLast: Set<number>, sync: Sync) {
		//todo scope = {} !!
		const req = this.createReq(arr[0].$src, str, expr, {}, null, sync);
		const command = req.commandWithArgs.command;
		if (command.q_render !== null_q_render) {
			return command.q_render(req, arr, isLast);
		}
		/*
		if (req.commandWithArgs.command.render === null) {
			return null;
		}*/
		const arrLen = arr.length;
		const res = new Array<Promise<RenderRes | null> | RenderRes | null>(arrLen);
		for (let i = 0; i < arrLen; ++i) {
			if (!isLast.has(i)) {
				//res[i] = await command.render(this.createReq(arr[i].$src, str, expr, arr[i].scope, null, sync));
				res[i] = command.render(this.createReq(arr[i].$src, str, expr, arr[i].scope, null, sync));
			}
		}
		//return res;
		return Promise.all(res);
	}

	private getAttrKey(attr: Map<string, string>) {
		let key = "";
		for (const [n, v] of attr) {
			key += n + ":" + v + ";";
		}
		return key;
	}
}

class Q_renderCtx {
	//todo rename to afterQ_arrByDecrIdByAttrKey
	afterByDescrByAttr = new Map<number, Map<string, Q_arr[]>>();
	strByAttrKey = new Map<string, string>();
}
