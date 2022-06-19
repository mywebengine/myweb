import config from "../../config/config.js";
import Loading from "../Loading.js";
import LocalCounter from "./LocalCounter.js";
import Q_arr from "./Q_arr.js";
import Q_renderCtx from "./Q_renderCtx.js";
import RenderRes from "./RenderRes.js";
import Req from "./Req.js";

export default class RenderTag extends Loading {
	renderTag($src, scope, str, sync) {
		if (sync.stat !== 0) {
//console.log("isCancel", sync.stat, 1);
			return $src;
		}
//console.error("render", sync.syncId, $src, this.context.srcBy$src.get($src).id, this.context.srcBy$src.get($src).descrId, scope, str);
//alert(1)
		const src = this.context.srcBy$src.get($src),
			sId = src.id;
		if (!sync.local.has(sId)) {
			sync.local.set(sId, new LocalCounter());
		}
		//todo со скопом есть проблема: если первый тег уже отрендереной динамической вставки добавляет в скоп что-то своё, то после смены значения - этот скоп будет раскопирован на все новые элементы
		//todo можно избавится от первоночального нуля - тогда будет минус один иф
		scope = scope !== null ? src.setScope(scope) : src.scopeCache;
//		if (scope !== null) {
//			scope = src.setScope(scope);
//		}
		const attr = str === "" ? src.descr.attr : src.getAttrAfter(str);
		if (attr === null || attr.size === 0) {
			return this.renderChildren($src, scope, sync, sId, $src);
		}
		return this.attrRender($src, scope, attr, sync)
			.then(res => {
				if (sync.stat !== 0) {
					return $src;
				}
				if ($src !== res.$src) {
					$src = res.$src;
				}
				const $ret = res.$last === null ? $src : res.$last;
				if (res.isLast) {// || sync.stat !== 0) {
					return $ret;
				}
//todo если мы дошли до сюда - то тег изменился а дети остались теми же - этого не должно быть - должны были ути по isLast
//				if (sync.stat !== 0) {//this.context.srcBy$src.get($src)?.id !== sId) {
//					console.warn(sync.stat, "todo если мы дошли до сюда - то тег изменился а дети остались теми же - этого не должно быть - должны были ути по isLast");
//					return null;
//				}
				return this.renderChildren($src, scope, sync, sId, $ret);
			});
	}
	//private
	async attrRender($src, scope, attr, sync) {
		let $last = null;
		for (const [n, v] of attr) {
			const req = this.createReq($src, n, v, scope, sync),
				res = await req.commandWithArgs.command.render(req);
			if (sync.stat !== 0) {
//console.log("isCancel attrRender", sync.stat, n, v);
				return res || new RenderRes(false, $src, $last);// new RenderRes(res.isLast, res.$src || $src, res.$last || $last);
			}
			if (!res) {
				continue;
			}
			if (res.attrStr !== "") {
//todo res.$attr в этой схеме линий - хватит .$src
//				const $attr = res.$attr,// || res.$src || $src,
//					$ret = res.$last || res.$src || $attr || $src;//поидеи глупо не возвращать $last, так как attr бы не имела смысла
////					$ret = res.$last || res.$src || res.$attr || $src;//поидеи глупо не возвращать $last, так как attr бы не имела смысла
				$src = await this.renderTag(res.$attr, scope, res.attrStr, sync);
				res.isLast = true;
				res.$src = res.$last;
//				res.$src = res.$attr === $ret ? $src : $ret;
				res.$last = null;
				res.$attr = null;
				res.attrStr = "";
				return res;
			}
			if (res.isLast) {
//				return res;
				return new RenderRes(true, res.$src || $src, res.$last);
			}
			if (res.$last !== null) {
				$last = res.$last;
			}
			if (res.$src !== null) {
				$src = res.$src;
			}
		}
		return new RenderRes(false, $src, $last);
	}
	async renderChildren($i, scope, sync, sId, $ret) {
		const srcBy$src = this.context.srcBy$src;
		if (sync.stat !== 0 || srcBy$src.get($i).descr.isCustomHtml) {
			return $i;
		}
		if (!sync.renderParam.isLazyRender && $i.getAttribute(config.lazyRenderName) !== null) {
			sync.renderParam.isLazyRender = true;
			//todo
			this.addScrollAnimationsEvent($i);
		}
		for ($i = $i.firstChild; $i !== null; $i = $i.nextSibling) {
//			if ($i.nodeType === 1 && 
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined) {
				continue;
			}
			$i = await this.renderTag($i, scope, "", sync);
			if (sync.stat !== 0) {
				return;
			}
		}
//		if (sync.stat === 0) {
			this.testLocalEventsBySrcId(sync.local, sId);
//		}
		return $ret;
	}
	addScrollAnimationsEvent($e) {
		$e.addEventListener("scroll", () => this.checkScrollAnimations, {
			passive: true
		});
	}
	testLocalEventsBySrcId(local, sId) {
		const l = local.get(sId);
		if (l.animationsCount === 0) {
			this.dispatchLocalEventsBySrcId(sId, l);
		}
	}
	//private
	dispatchLocalEventsBySrcId(sId, l) {
		const $src = this.context.$srcById.get(sId);
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
		const src = this.context.srcById.get(sId);
		if (!src.isMounted) {
			src.isMounted = true;
			$src.dispatchEvent(new CustomEvent(config.mountEventName, config.defEventInit));
		}
		$src.dispatchEvent(new CustomEvent(config.renderEventName, config.defEventInit));
	}
	createReq($src, str, expr, scope, sync) {
		return new Req($src, str, expr, scope, sync, this.context.commandWithArgsByStr.get(str));//<- commandWithArgsByStr set in createAttr
	}
};
