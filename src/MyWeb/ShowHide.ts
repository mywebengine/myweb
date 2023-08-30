import {config} from "../config.js";
import {my} from "../myweb.js";
import {Task} from "./Task.js";
import {RemoveChild} from "./RemoveChild.js";
import {Req} from "./Req.js";
import {Src} from "./Src.js";

const $scroll = document.scrollingElement;

export abstract class ShowHide extends RemoveChild {
	show(req: Req, $e: HTMLElement) {
		const src = this.context.srcBy$src.get($e) as Src; //!!
		//info тег без описания - это текстовая нода скрытая за template
		if (src !== undefined ? !src.isHide : $e.nodeName !== "TEMPLATE" || $e.getAttribute(config.hideName) === null) {
			return;
		}
		req.sync.animations.add(new Task(() => this.executeShowAnimation(req, $e, src), req.sync.local, 0)); //this.context.srcBy$src.get($e).id]));
	}

	hide(req: Req, $e: HTMLElement) {
		const src = this.context.srcBy$src.get($e) as Src; //!!
		if (src !== undefined) {
			if (!src.isHide) {
				req.sync.animations.add(new Task(() => this.executeHideAnimation($e, src), req.sync.local, src.id));
			}
			return;
		}
		//info тег без описания - это текстовая нода скрытая за template
		if ($e.nodeType === 1 ? $e.nodeName === "TEMPLATE" && $e.getAttribute(config.hideName) !== null : $e.nodeType !== 8) {
			req.sync.animations.add(new Task(() => this.executeHideAnimation($e, src), req.sync.local, 0));
		}
	}

	is$visible($e: HTMLElement) {
		while ($e.nodeType !== 1) {
			if ($e.nextSibling === null) {
				return true;
			}
			$e = $e.nextSibling as HTMLElement;
		}
		//const b = $e.getBoundingClientRect();
		//if (b.width === 0 && b.height === 0) {
		//	return false;
		//}
		//todo--
		if ($scroll === null) {
			return true;
		}
		const visibleK = 1 - config.visibleScreenSize;
		const left = $scroll.clientWidth * visibleK;
		const right = $scroll.clientWidth + left * -1;
		const top = $scroll.clientHeight * visibleK;
		const bottom = $scroll.clientHeight + top * -1;
		const b = $e.getBoundingClientRect();
		//console.log(`!((${b.top} > ${bottom} || ${b.top} + ${b.height} < ${top}) || (b.left > right || b.left + b.width < left))`);
		return !(b.top > bottom || b.top + b.height < top || b.left > right || b.left + b.width < left);
	}

	private executeShowAnimation(req: Req, $e: HTMLElement, src: Src) {
		const $new = ($e as HTMLTemplateElement).content.firstChild as HTMLElement; //!!
		if (!$new || $new.nextSibling !== null) {
			//todo была ошибка, что $e ет в srcBy$src - повоторить не получается - эта шибка проявляется если Препаре даёт сбой, на данный момент не замечены проблемы в нём
			//todo --
			throw this.getError(
				new Error(
					">>>mw show:01: Template element invalid structure on show function. <template>.content.childNodes.length must be only one element."
				),
				$e
			);
		}
		//if ($new.nodeType === 1 && this.context.srcBy$src.has($e)) {
		if (src !== undefined) {
			this.moveProps($e, src, $new, false);
		}
		if (req.$src === $e) {
			req.$src = $new;
		}
		($e.parentNode as HTMLElement).replaceChild($new, $e);
	}

	private executeHideAnimation($e: HTMLElement, src: Src) {
		let $i: Node | null = $e;
		const srcBy$src = this.context.srcBy$src,
			$new = this.context.document.createElement("template"),
			$parent = $i.parentNode,
			$p = [];
		$new.setAttribute(config.hideName, "");
		do {
			//////////////////////
			const iSrc = srcBy$src.get($i as HTMLElement);
			if (iSrc !== undefined) {
				const c = iSrc.cache; //это то же самое, что и $i.isCmd
				if (c !== null) {
					//todo тут можно удалять кэш только для дочерних элементов, но так как еще нужно удалить кэш для команд-после, то такой подход оправдан
					c.value.clear();
					c.current.clear();
				}
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
				//if ($i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {//iSrc.isCmd) {// && $i.content.firstChild.firstChild !== null) {//проверку на кастом не делается из соображений экономичности
				if (iSrc.isHide && (($i as HTMLTemplateElement).content.firstChild as HTMLElement).firstChild !== null) {
					$p.push($i);
					$i = (($i as HTMLTemplateElement).content.firstChild as HTMLElement).firstChild as Node;
					continue;
				}
			}
			if ($i.parentNode === $parent) {
				//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				continue;
			}
			do {
				$i = $i.parentNode as HTMLElement; //!!
				if ($i.nodeType === 11) {
					$i = $p.pop() as HTMLElement;
				}
				if ($i.parentNode === $parent) {
					$i = null;
					break;
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					break;
				}
			} while (true);
		} while ($i !== null);
		//if ($e.nodeType === 1) {
		if (src !== undefined) {
			this.moveProps($e, src, $new, true);
		}
		//!!переписывать req.$src в данном случаи не имет смысла
		($e.parentNode as HTMLElement).replaceChild($new, $e);
		$new.content.appendChild($e);
	}

	private moveProps($from: HTMLElement, fromSrc: Src, $to: HTMLElement, isHide: boolean) {
		//!!<-- show hide
		//const fromSrc = this.context.srcBy$src.get($from);
		fromSrc.isHide = isHide;
		this.context.$srcById.set(fromSrc.id, $to);
		this.context.srcById.set(fromSrc.id, fromSrc);
		//this.context.srcBy$src.delete($from);
		this.context.srcBy$src.set($to, fromSrc);

		($to as unknown as Record<symbol, unknown>)[config.p_topUrl] = ($from as unknown as Record<symbol, unknown>)[config.p_topUrl];
		if (my.debugLevel === 0) {
			return;
		}
		//это как бы не нужно - мы же подготовленной структуре проходим
		if (!isHide) {
			return;
		}
		const attrs = $from.attributes;
		const attrsLen = attrs.length;
		const toSrc = this.context.srcBy$src.get($to) as Src; //!!
		for (let i = 0; i < attrsLen; ++i) {
			//const a = attrs.item(i);
			const a = attrs[i];
			//for (const a of $from.attributes) {
			toSrc.setAttribute(a.name, a.value, $to);
		}
	}
}
