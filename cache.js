import {srcBy$src, get$first, getNextStr} from "./descr.js";

export function type_cache() {
	return {
		isInits: type_cacheInit(),
		current: type_cacheCurrent(),
		value: type_cacheValue(),
		attrSyncCur: type_cacheAttrSyncCur()
	};
}
function type_cacheInit() {
	return new Set();
}
export function type_cacheCurrent() {
	return new Map();
}
export function type_cacheValue() {
	return new Map();
}
function type_cacheAttrSyncCur() {
	return new Map();
}
export function type_cacheAttrSyncCurI(syncId, value) {
	return {
		syncId,
		value
	};
}
export function getCacheSrcId($i, str) {
//todo если _for1 _for2 - кэш будет браться для for2 c первого элемента
	const src = srcBy$src.get($i);
//todo
	if (src === undefined) {
		console.warn("2323 всё норм, но нужно последить - сейчас такое бываес с _loading -> _inc");
//debugger
		return 0;
	}
	const descr = src.descr;
	if (descr.asOnes === null || !descr.asOnes.has(str)) {
		return src.id;
	}	
	const nStr = getNextStr(src, str);
	$i = get$first($i, descr.get$elsByStr, nStr);
	do {
		const iSrc = srcBy$src.get($i);
		if (iSrc !== undefined && iSrc.isCmd) {
			return iSrc.id;
		}
		$i = $i.nextSibling;
	} while ($i !== null);
//todo
	throw new Error("getCacheSrcId");
}
