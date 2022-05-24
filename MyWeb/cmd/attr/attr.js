import {Animation} from "../../../render/Animation.js";
import {CacheAttrSyncCur} from "../../../cache/CacheAttrSyncCur.js";
//import {lazyRenderName, pushModName, replaceModName} from "../../config/config.js";
//import {setAttribute, setAttributeValue, removeAttribute} from "../../dom/dom.js";
//import {getErr} from "../../err/err.js";
//import {eval2, q_eval2} from "../../eval2/eval2.js";
import {setLoc} from "../../../loc/loc.js";
//import {type_cmd} from "../type.js";
import {Command} from "../Command.js";

//1) _attr.<name>="<string|bool>"
//2) _attr.<name>.<value>="<bool>"
//3) _attr.href.(push|replace)=... history.(push|replace)State
//4) _attr.href... data-<_*(push|replace)>="<bool>" history.(push|replace)State <- priority

//export default type_cmd(cmd_render, cmd_q_render, null, null, false, false);

export default class Attr extends Command {
	render(req) {
		return this.eval2(req, req.$src, true)
			.then(val => {
				this._render(req, req.$src, this.getName(req), val);
				return null;
			});
	}
	q_render(req, arr, isLast) {
		return this.q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length,
					n = this.getName(req);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						this._render(req, arr[i].$src, n, vals[i]);
					}
				}
				return null;
			});
	}
	//private
	_render(req, $src, n, v) {
//console.log(1111, req, $src, n, v);
		const toggleVal = req.reqCmd.args[1],
//			c = getCacheBySrcId($src[p_srcId]),
			c = this.ctx.srcBy$src.get($src).cache,
			isInit = c.isInits.has(req.str);
		if (!isInit) {
			c.isInits.add(req.str);
			this.setClick(req, $src, n);
		}
		if (req.sync.renderParam.isLinking) {
			c.current.set(req.str, $src.getAttribute(n));
			return;
		}
		const curVal = c.current.has(req.str) ? c.current.get(req.str) : $src.getAttribute(n),
//todo сейчас это, наверное, уже не нужно
			aCache = c.attrSyncCur.get(n),
			aCurVal = aCache !== undefined && aCache.syncId === req.sync.syncId ? aCache.value : curVal;
//--			curVal = aCache && aCache.syncId === req.sync.syncId ? aCache.value : (req.str in c.current ? c.current[req.str] : $src.getAttribute(n));
		if (toggleVal && toggleVal !== Config.pushModName && toggleVal !== Config.replaceModName) {
			if (aCurVal) {
//console.log(2, req.str, aCurVal, n, v);
				const i = aCurVal.indexOf(toggleVal),
					l = toggleVal.length;
				if (i !== -1 && (aCurVal[i - 1] === " " || i === 0) && (aCurVal[i + l] === " " || i + l === aCurVal.length)) {
					v = v ? aCurVal : aCurVal.substr(0, i) + aCurVal.substr(i + l + 1);
				} else if (v) {
					v = aCurVal[aCurVal.length - 1] === " " ? aCurVal + toggleVal : aCurVal + " " + toggleVal;
//					v = aCurVal + " " + toggleVal;
				} else {
					v = aCurVal;
				}
			} else if (v){
				v = toggleVal;
			} else {
//				v = false;
				v = aCurVal;
			}
		}
		if (v === true) {
			v = n;
		}
		if (aCache !== undefined) {
			aCache.syncId = req.sync.syncId;
			aCache.value = v;
		} else {
			c.attrSyncCur.set(n, new CacheAttrSyncCur(req.sync.syncId, v));
		}
		const f = !!(v || v === "");
		if (n === Config.lazyRenderName) {
			req.sync.renderParam.isLazyRender = f;
		}
		if (isInit && curVal === v) {
//if (n == `selected`) console.log(111,$src, n, v);
			this.setAttributeValue($src, n, v);
			return;
		}
		req.sync.animations.add(new Animation(() => {
			c.current.set(req.str, v);
			if (f) {
//if (n == `selected`) console.log(222,$src, n, v);
				this.setAttribute($src, n, v);
				return;
			}
//if (n == `selected`) console.log(333,$src, n);
			this.removeAttribute($src, n);
		}, req.sync.local, this.ctx.srcBy$src.get($src).id));
/*
		if (f) {
//todo <body _attr.class.home="[``].indexOf(loc.name) !== -1" _attr.class.main="[`myloc`, `mysnt`, `services`].indexOf(loc.name) !== -1"
			req.sync.animations.add(new Animation(() => {
				c.current.set(req.str, v);
				this.setAttribute($src, n, v);
			}, req.sync.local, this.ctx.srcBy$src.get($src).id));
			return;
		}
//!!be clone => has attribute => not removing
//		if (aCurVal !== null) {
			req.sync.animations.add(new Animation(() => {
				c.current.set(req.str, v);
				this.removeAttribute($src, n);
			}, req.sync.local, this.ctx.srcBy$src.get($src).id));
//		}*/
	}
	//private
	setClick(req, $src, n) {
//todo toLowerCase
		if ($src.tagName !== "A" || n.toLowerCase() !== "href" || $src.target) {
			return;
		}
		$src.addEventListener("click", async evt => {
			if (!$src.href || evt.ctrlKey || evt.metaKey) {
				return;
			}
			evt.preventDefault();
//!!придумать		switch (await getVal($src, null, Config.pushModName, false) ? Config.pushModName : (await getVal($src, null, Config.replaceModName, false) ? Config.replaceModName : req.reqCmd.args[1])) {
			const mode = req.reqCmd.args[1];
			if (mode === Config.pushModName) {
				history.pushState(undefined, undefined, $src.href);
			} else if (mode === Config.replaceModName) {
				history.replaceState(undefined, undefined, $src.href);
			} else {
				location.href = $src.href;
				return;
			}
			document.scrollingElement.scrollTop = 0;
			setLoc(location.href);
		});
	}
	//private
	getName(req) {
		const n = req.reqCmd.args[0];
		if (n) {
			return n;
		}
		throw this.getErr(new Error(">>>mw attr:render:01: Need set attribute name"), req.$src, req);
	}
};
