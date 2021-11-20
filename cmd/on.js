import {type_req} from "../render/render.js";
import {type_cacheValue} from "../cache.js";
import {p_target, preventDefaultModName, stopModName, selfModName, exactModName, eventScopeName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {getErr} from "../err.js";
import {eval2} from "../eval2.js";
import {kebabToCamelCase} from "../str.js";

export default {
	render(req) {
		on_render(req, req.$src);
		return null;
	},
	q_render(req, arr, isLast) {
		const arrLen = arr.length;
		for (let i = 0; i < arrLen; i++) {
			if (!isLast.has(i)) {
				on_render(req, arr[i].$src);
			}
		}
		return null;
	}
};
const isInit = new WeakMap();
function on_render(req, $src) {
	const n = req.reqCmd.args[0];
	if (!n) {
		throw getErr(new Error(">>>mw on:render:01: Need set action name"), $src, req);
	}
	const src = srcBy$src.get($src);
//	if (src !== undefined) {
//		const c = getCacheBySrcId($src[p_srcId]);
		const c = src.cache;
		if (c.isInits.has(req.str)) {// || ($src._isInit !== undefined && $src._isInit.has(req.str))) {
			return;
		}
		c.isInits.add(req.str);
		const ii = isInit.get($src);
		if (ii !== undefined && ii.has(req.str)) {
			ii.delete(req.str);
			return;
		}
/*
//todo
	} else {
console.warn(32423423, req);
		const ii = isInit.get($src);
		if (ii !== undefined && ii.has(req.str)) {
			return;
		}
		isInit.set($src, new Set([req.str]));
	}*/
	const opt = type_listenerOptions();
	for (let i = req.reqCmd.args.length - 1; i > 0; i--) {
		switch (req.reqCmd.args[i]) {
			case "capture":
				opt.capture = true;
				continue;
			case "once":
				opt.once = true;
				continue;
			case "passive":
				opt.passive = true;
				continue;
		}
	}
	$src.addEventListener(kebabToCamelCase(n), evt => listen(req, $src, evt), opt);
}
const holdsKeys = new Set(["ctrl", "alt", "shift", "meta"]);
function listen(req, $src, evt) {
	const argsLen = req.reqCmd.args.length,
		actions = new Set();
	for (let i = 1; i < argsLen; i++) {
		const mod = req.reqCmd.args[i];//.toLowerCase();
		switch (mod) {
			case "":
			case "capture":
			case "once":
			case "passive":
				continue;
			case preventDefaultModName:
				evt.preventDefault();
				continue;
			case stopModName:
//				evt.cancelBubble = true;
				evt.stopPropagation();
				continue;
			case selfModName:
				if (evt.target === $src) {
					continue;
				}
				return;
			case "ctrl":
				if (evt.ctrlKey) {
					actions.add("ctrl");
					continue;
				}
				return;
			case "alt":
				if (evt.altKey) {
					actions.add("alt");
					continue;
				}
				return;
			case "shift":
				if (evt.shiftKey) {
					actions.add("shift");
					continue;
				}
				return;
			case "meta":
				if (evt.metaKey) {
					actions.add("meat");
					continue;
				}
				return;
			case exactModName:
				for (const i of holdsKeys) {
					if (actions.has(i)) {
						continue;
					}
					switch (i) {
						case "ctrl":
							if (evt.ctrlKey) {
								return;
							}
							continue;
						case "alt":
							if (evt.altKey) {
								return;
							}
							continue;
						case "shift":
							if (evt.shiftKey) {
								return;
							}
							continue;
						case "meta":
							if (evt.metaKey) {
								return;
							}
							continue;
					}
				}
				continue;
		}
		if (evt.type === "input") {
			if (evt.data !== null && mod === evt.data.toLowerCase()) {
				continue;
			}
			return;
		}
//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
//https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
//https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
//console.log(mod)
		if (evt.type.indexOf("key") === 0) {
			if (mod === evt.key.toLowerCase()) {
				continue;
			}
			return;
		}
		if (evt.type.indexOf("mouse") === 0 && !isNaN(mod)) {
			if (Number(mod) === evt.button) {
				continue;
			}
			return;
		}
	}
	const src = srcBy$src.get($src),
		s = src.scopeCache;
	s[p_target][eventScopeName] = evt;
	src.cache.value = type_cacheValue();
	eval2(type_req($src, req.str, req.expr, s, null), $src, false);
}
function type_listenerOptions() {
	return {
		capture: false,
		once: false,
		passive: false
	};
}
