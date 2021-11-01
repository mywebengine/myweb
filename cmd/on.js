import {type_req} from "../render/render.js";
import {/*getCacheBySrcId, */type_cacheValue} from "../cache.js";
import {p_target, preventDefaultModName, stopModName, selfModName, eventScopeName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2} from "../eval2.js";

export default {
	render: onRender,
	q_render(req, arr, isLast) {
		const arrLen = arr.length;
		for (let i = 0; i < arrLen; i++) {
			if (!isLast.has(i)) {
				onRender(req, arr[i].$src);
			}
		}
		return null;
	}
};
const onIsInit = new WeakMap();
function onRender(req, $src = req.$src) {
	const n = req.reqCmd.args[0];
	if (!n) {
		throw check(new Error(">>>Tpl on:render:01: Need set action name"), $src, req);
	}
	const src = srcBy$src.get($src);
	if (src !== undefined) {
//	const c = getCacheBySrcId($src[p_srcId]);
		const c = src.cache;
		if (c.isInits.has(req.str)) {// || ($src._isInit !== undefined && $src._isInit.has(req.str))) {
			return null;
		}
		c.isInits.add(req.str);
		const ii = onIsInit.get($src);
		if (ii !== undefined && ii.has(req.str)) {
			ii.delete(req.str);
			return null;
		}
	} else {
		const ii = onIsInit.get($src);
		if (ii !== undefined && ii.has(req.str)) {
			return null;
		}
		onIsInit.set($src, new Set([req.str]));
	}
	$src.addEventListener(n, evt => {
		const l = req.reqCmd.args.length;
		for (let i = 1; i < l; i++) {
			const mod = req.reqCmd.args[i];
			if (mod === preventDefaultModName) {
				evt.preventDefault();
				continue;
			}
			if (mod === stopModName) {
//				evt.cancelBubble = true;
				evt.stopPropagation();
				continue;
			}
			if (mod === selfModName && evt.target !== $src) {
				return;
			}
		}
		const src = srcBy$src.get($src),
			s = src.scopeCache;
		s[p_target][eventScopeName] = evt;
		src.cache.value = type_cacheValue();
		eval2(type_req($src, req.str, req.expr, s, null), $src, false);
	});
	return null;
}
