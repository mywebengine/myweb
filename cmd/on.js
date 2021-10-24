import {type_req} from "../render/render.js";
import {/*getCacheBySrcId, */type_cacheValue} from "../cache.js";
import {p_target, preventDefaultModName, stopModName, selfModName, eventScopeName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2} from "../eval2.js";

export default {
	render,
	q_render(req, arr, isLast) {
		const arrLen = arr.length;
		for (let i = 0; i < arrLen; i++) {
			if (!isLast[i]) {
				render(req, arr[i].$src);
			}
		}
		return null;
	}
};
function render(req, $src = req.$src) {
	const n = req.reqCmd.args[0];
	if (!n) {
		throw check(new Error(">>>Tpl on:render:01: Need set action name"), $src, req);
	}
//todo $src._isInit
	const src = srcBy$src.get($src);
	if (src !== undefined) {
//	const c = getCacheBySrcId($src[p_srcId]);
		const c = src.cache;
		if (c.isInit[req.str] || ($src._isInit && $src._isInit[req.str])) {
			return null;
		}
		c.isInit[req.str] = true;
	} else {
		if (!$src._isInit) {
			$src._isInit = {};
		}
		if ($src._isInit[req.str]) {
			return null;
		}
		$src._isInit[req.str] = true;
	}
//console.error(222222, req);
	$src.addEventListener(n, evt => {
//todo $src._isInit
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
		eval2(type_req($src, req.str, req.expr, s, null, null), $src, false);
	});
	return null;
}
