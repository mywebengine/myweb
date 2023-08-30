import {config} from "../config.js";
import {CommandWithArgs} from "./CommandWithArgs.js";
import {LocalState} from "./LocalState.js";
import {RenderLoop} from "./RenderLoop.js";
import {RenderRes} from "./RenderRes.js";
import {Req} from "./Req.js";
import {Sync} from "./Sync.js";
import {Src} from "./Src.js";

export abstract class RenderTag extends RenderLoop {
	async renderTag($src: HTMLElement, scope: Record<string | symbol, unknown>, str: string, sync: Sync) {
		if (sync.stat !== 0) {
			//console.log("isCancel", sync.stat, 1);
			return $src;
		}
		//console.error("render", sync.syncId, $src, this.context.srcBy$src.get($src).id, this.context.srcBy$src.get($src).descrId, scope, str);
		//alert(1)
		const src = this.context.srcBy$src.get($src) as Src; //!!
		const srcId = src.id;
		if (!sync.local.has(srcId)) {
			sync.local.set(srcId, new LocalState());
		}
		//todo со скопом есть проблема: если первый тег уже отрендереной динамической вставки добавляет в скоп что-то своё,
		// то после смены значения - этот скоп будет расскопирован на все новые элементы
		//scope = scope !== null ? src.getScope(scope) : src.scope;
		if (src.scope !== null) {
			scope = src.getScope(scope);
		}
		const attr = str === "" ? src.descr.attr : src.getAttrAfter(str);

		console.log(7777, attr, $src, str, attr === null || attr.size === 0, sync.stat)

		if (attr === null || attr.size === 0) {

			console.log(7778, $src, str)

			await this.renderAfterAttr($src, scope, sync, src);
			return $src;
		}
		const res = await this.attrRender($src, scope, attr, sync);
		if (sync.stat !== 0) {

			console.log(7779, $src, str)

			return $src;
		}

		console.log(123, res, $src, str)

		if (res.$last !== null) {
			return res.$last;
		}
		await this.renderAfterAttr($src, scope, sync, src);
		return $src;
	}

	private async attrRender($src: HTMLElement, scope: Record<string | symbol, unknown>, attr: Map<string, string>, sync: Sync) {
		for (const [n, v] of attr) {
			const req = this.createReq($src, n, v, scope, null, sync);
			const res = await req.commandWithArgs.command.render(req);
			//todo !!
			if (!res && res !== null) {
				console.warn(11111111111);
			}

			if (sync.stat !== 0) {
				//console.log("isCancel attrRender", sync.stat, n, v);
				return res !== null ? res : new RenderRes(null, $src);
			}
			if (res === null) {
				continue;
			}
			if (res.attrStr !== "") {

				console.log(345, res)

				await this.renderTag($src, scope, res.attrStr, sync); //info если attrStr !== "", то $src !== null и $last !== null
				return res;
			}
			if (res.$last !== null) {
				return res;
			}
		}
		return new RenderRes(null, $src);
	}

	private renderAfterAttr($src: HTMLElement, scope: Record<string | symbol, unknown>, sync: Sync, src: Src) {

		console.log(3333, $src, src)

		const nameIs = $src.getAttribute("is");
		const el = (sync.local.get(src.id) as LocalState).customElementByName.get(nameIs !== null ? nameIs.toUpperCase() : $src.nodeName); //!!
		if (el !== undefined && !src.isCustomElementConnected) {
			//todo
			el.createCustomElement($src, scope, sync);
		}
		return this.renderChildren($src, scope, sync).then(() => this.testLocalEventsBySrcId(sync.local, src.id));
		// ??? что я хотел??
		// const p = this.renderChildren($src, scope, sync).then(() => this.testLocalEventsBySrcId(sync.local, src.id));
		// sync.promise = sync.promise.then(() => p);
	}

	private async renderChildren($src: HTMLElement, scope: Record<string | symbol, unknown>, sync: Sync) {
		const srcBy$src = this.context.srcBy$src;
		if (sync.stat !== 0 || (srcBy$src.get($src) as Src).descr.isCustomHtml) {
			//!!
			return $src;
		}
		if (!sync.renderParam.isLazyRender && $src.getAttribute(config.lazyRenderName) !== null) {
			sync.renderParam.isLazyRender = true;
			//todo
			this.addScrollAnimationsEvent($src);
		}
		for (let $i = $src.firstChild; $i !== null; $i = $i.nextSibling) {
			const iSrc = srcBy$src.get($i as HTMLElement);
			if (iSrc !== undefined) {
				$i = await this.renderTag($i as HTMLElement, scope, "", sync);
				if (sync.stat !== 0) {
					return $src;
				}
			}
		}
		return $src;
	}

	createReq($src: HTMLElement, str: string, expr: string, scope: Record<string | symbol, unknown>, event: Event | null, sync: Sync) {
		return new Req($src, str, expr, scope, event, sync, this.context.commandWithArgsByStr.get(str) as CommandWithArgs); //<- commandWithArgsByStr set in createAttr
	}
}
