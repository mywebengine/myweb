import {srcId, descrId, isCmd} from "./config.js";
import {$srcById, descrById, get$first, getNextStr} from "./descr.js";
import {reqCmd} from "./req.js";

export const cache = {};
self.cache = cache;

export function type_cache() {
	return {
		isInit: type_cacheInit(),
		value: type_cacheValue(),
		current: type_cacheCurrent()
	};
}
export function type_cacheInit() {
	return {};
}
export function type_cacheValue() {
	return {};
}
export function type_cacheCurrent() {
	return {};
}
export function getCacheValue(req, $e) {
//if (!cache[getSrcId(req, $e)]) {
//	console.log(22, $e, getSrcId(req, $e));
//}
//	const sId = getSrcId(req, $e),//такого не будет!
//		c = sId && cache[sId].value;
	const c = cache[getSrcId(req, $e)].value;
	if (c && req.str in c) {
		return c[req.str];
	}
}
export function setCacheValue(req, $e, v) {
	cache[getSrcId(req, $e)].value[req.str] = v;
//const sId = getSrcId(req, $e);
//console.log("save", sId, $e, req.str, v);
}
function getSrcId(req, $e) {
	const sId = $e[srcId];
	if (!$srcById[sId]) {//если уже удалили
		return;
	}
	const r = reqCmd[req.str];
	if (!r || !r.cmd.isAsOne) {
		return sId;
	}
	const nStr = getNextStr($e, req.str);
	if (!nStr) {
		return sId;
	}
	const d = descrById.get($e[descrId]);
	$e = get$first($e, d.get$elsByStr, nStr);
	while (!$e[isCmd]) {
		$e = $e.nextSibling;
	}
//console.warn(11112, req, sId, req.str, $e);
	return $e[srcId];
}
