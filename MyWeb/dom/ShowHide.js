import config from "../../config/config.js";
import Animation from "../render/Animation.js";
import RemoveChild from "./RemoveChild.js";

const $scroll = document.scrollingElement;

export default class ShowHide extends RemoveChild {
	show(req, $e) {
		const src = this.context.srcBy$src.get($e);
		if (src !== undefined ? !src.isHide : ($e.nodeName !== "TEMPLATE" || $e.getAttribute(config.hideName) === null)) {
			return;
		}
		req.sync.animations.add(new Animation(() => this.executeShowAnimation(req, $e, src), req.sync.local, 0));//this.context.srcBy$src.get($e).id]));
	}
	//private
	executeShowAnimation(req, $e, src) {
		const $new = $e.content.firstChild;
		if (!$new || $new.nextSibling !== null) {
			//todo была ошибка, что $e ет в srcBy$src - повоторить не получается - эта шибка проявляется если Препаре даёт сбой, на данный момент не замечены проблемы в нём
			throw this.getError(new Error(">>>mw show:01: Template element invalid structure on show function. <template>.content.childNodes.length must be only one element."), $e);
		}
//		if ($new.nodeType === 1 && this.context.srcBy$src.has($e)) {
		if (src !== undefined) {
			this.moveProps($e, src, $new, false);
		}
		if (req.$src === $e) {
			req.$src = $new;
		}
		$e.parentNode.replaceChild($new, $e);
	}
	hide(req, $e) {
		const src = this.context.srcBy$src.get($e);
		if (src !== undefined) {
			if (!src.isHide) {
				req.sync.animations.add(new Animation(() => this.executeHideAnimation($e, src), req.sync.local, src.id));
			}
			return;
		}
		if ($e.nodeType === 1 ? $e.nodeName === "TEMPLATE" && $e.getAttribute(config.hideName) !== null : $e.nodeType !== 8) {
			req.sync.animations.add(new Animation(() => this.executeHideAnimation($e, src), req.sync.local, 0));
		}
	}
	//private
	executeHideAnimation($e, src) {
		let $i = $e;
		const srcBy$src = this.context.srcBy$src,
			$new = this.context.document.createElement("template"),
			$parent = $i.parentNode,
			$p = [];
		$new.setAttribute(config.hideName, "");
		do {
//////////////////////
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined) {
				const c = iSrc.cache;//это тоже самое что и $i.isCmd
				if (c !== null) {//todo тут можно удалять кэш только для дочерних элементов, но так как еще нужно удалить кэш для команд-после, то такой подход оправдан
					c.value = new Map();
					c.current = new Map();
				}
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
//				if ($i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {//iSrc.isCmd) {// && $i.content.firstChild.firstChild !== null) {//проверку на кастом не делается из соображений экономичности
				if (iSrc.isHide && $i.content.firstChild.firstChild !== null) {
					$p.push($i);
					$i = $i.content.firstChild.firstChild;
					continue;
				}
			}
			if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				continue;
			}
			do {
				$i = $i.parentNode;
				if ($i.nodeType === 11) {
					$i = $p.pop();
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
//		if ($e.nodeType === 1) {
		if (src !== undefined) {
			this.moveProps($e, src, $new, true);
		}
		//!!переписывать req.$src в данном случаи не имет смысла
		$e.parentNode.replaceChild($new, $e);
		$new.content.appendChild($e);
	}
	//private
	moveProps($from, fromSrc, $to, isHide) {
//!!<-- show hide
//		const fromSrc = this.context.srcBy$src.get($from);
		fromSrc.isHide = isHide;
		this.context.$srcById.set(fromSrc.id, $to);
		this.context.srcById.set(fromSrc.id, fromSrc);
//		this.context.srcBy$src.delete($from);
		this.context.srcBy$src.set($to, fromSrc);

		$to[config.p_topUrl] = $from[config.p_topUrl];
		if (my.debugLevel === 0) {
			return;
		}
		//это какбы не нужно - мы же подготовленной структуре проходим
		if (!isHide) {
			return;
		}
		const attrs = $from.attributes,
			attrsLen = attrs.length,
			toSrc = this.context.srcBy$src.get($to);
		for (let i = 0; i < attrsLen; i++) {
//			const a = attrs.item(i);
			const a = attrs[i];
//		for (const a of $from.attributes) {
			toSrc.setAttribute(a.name, a.value, $to);
		}
	}
	is$visible($e) {
		while ($e.nodeType !== 1) {
			$e = $e.nextSibling;
			if ($e === null) {
				return true;
			}
		}
//		const b = $e.getBoundingClientRect();
//		if (b.width === 0 && b.height === 0) {
//			return false;
//		}
		const visibleK = 1 - config.visibleScreenSize,
			left = $scroll.clientWidth * visibleK,
			right = $scroll.clientWidth + left * -1,
			top = $scroll.clientHeight * visibleK,
			bottom = $scroll.clientHeight + top * -1,
			b = $e.getBoundingClientRect();
//console.log(`!((${b.top} > ${bottom} || ${b.top} + ${b.height} < ${top}) || (b.left > right || b.left + b.width < left))`);
		return !((b.top > bottom || b.top + b.height < top) || (b.left > right || b.left + b.width < left));
	}
};
