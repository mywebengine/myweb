import {srcBy$src, get$first, getNextStr} from "./descr.js";

export function type_cache() {
	return {
		isInit: type_cacheInit(),
		current: type_cacheCurrent(),
		value: type_cacheValue(),
		attrSyncCur: type_cacheAttrSyncCur()
	};
}
export function type_cacheInit() {
	return {};
}
export function type_cacheCurrent() {
	return {};
}
export function type_cacheValue() {
	return {};
}
function type_cacheAttrSyncCur() {
	return {};
}
export function type_cacheAttrSyncCurI(syncId, value) {
	return {
		syncId,
		value
	};
}
export function getSrcId($i, str) {
//todo если _for1 _for2 - кэш будет браться для for2 c первого элемента
	const src = srcBy$src.get($i);
//todo
	if (src === undefined) {
		console.warn("2323 всё норм, но нужно последить - сейчас такое бываес с _loading -> _inc");
//debugger
		return 0;
	}
	const descr = src.descr;
	if (descr.asOneSet === null || !descr.asOneSet.has(str)) {
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
	throw new Error("getSrcId");
}
