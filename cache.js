import {p_srcId, p_descrId, p_isCmd} from "./config.js";
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
export function getCacheBySrcId(sId) {
	const c = cache[sId];
	return c || (cache[sId] = type_cache());
}
export function getCacheValue($e, str) {
	const c = cache[getSrcId($e, str)];
	if (c && str in c.value) {
		return type_val(c.value[str]);
	}
}
function type_val(value) {
	return {
		value
	};
}
export function setCacheValue($e, str, v) {
	const sId = getSrcId($e, str),
		c = cache[sId] || (cache[sId] = type_cache());
	c.value[str] = v;
}
export function getSrcId($e, str) {
	const sId = $e[p_srcId];
//todo--
	if (!$srcById[sId]) {//если уже удалили
console.warn("2323");
alert(111);
		return;
	}
	const r = reqCmd[str];
	if (!r || !r.cmd.isAsOne) {
		return sId;
	}
//todo сделать с гетКэш с d.sId
	const nStr = getNextStr($e, str);
	if (!nStr) {
		return sId;
	}
	const d = descrById.get($e[p_descrId]);
	$e = get$first($e, d.get$elsByStr, nStr);
	while (!$e[p_isCmd]) {
		$e = $e.nextSibling;
	}
//console.warn(11112, sId, str, $e);
	return $e[p_srcId];
}
