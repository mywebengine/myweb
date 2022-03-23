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
