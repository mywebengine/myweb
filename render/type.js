export function type_req($src, str, expr, scope, sync) {
	return {
		reqCmd: my.env.reqCmd.get(str),// || null,//<- in createAttr
		$src,
		str,
		expr,
		scope,
		sync
	};
}
export function type_q_renderCtx() {
	return {
		lastCount: 0,
		afterByDescrByAttr: new Map(),
		strByAttrKey: new Map()
	};
}
export function type_isLast() {
	return new Set();
}
export function type_q_arr($src, scope) {
	return {
		$src,
		scope
	};
}
export function type_localCounter() {
	return {
		animationsCount: 0,
		newSrcId: 0
	};
}
export function type_animation(handler, local, viewedSrcId) {
	for (const p of local.values()) {
		p.animationsCount++;
	}
	return {
		handler: () => {
			for (const p of local.values()) {
				if (p.animationsCount > 0) {
					p.animationsCount--;
				}
			}
			return handler();
		},
		local,
		viewedSrcId
	};
}
export function type_renderRes(isLast, $src = null, $last = null, $attr = null, attrStr = "") {
	return {
		isLast,
		$src,
		$last,
		$attr,
		attrStr
	};
}

export function type_delayParam(sId, resolve, reject) {
	return {
		sId,
		resolve,
		reject
	};
}
export function type_renderParam(sId, scope, str, isLinking) {
	return {
		sId,
		scope,
		str,
		isLinking,
		isLazyRender: false,
		srcIds: new Set(),
		$els: null
	};
}
export function type_prepareMerge(len, firstAsOneIdx) {
	return {
		len,
		descrId: new Set(),
		firstAsOneIdx
//		asOneIdx: new Set()
	};
}
export function type_sync(syncId, renderParam) {
	let resolve;
	const promise = new Promise(res => resolve = res);
	return {
		syncId,
		renderParam,
		local: new Map(),

		beforeAnimations: new Set(),
		animations: new Set(),
		afterAnimations: new Set(),
		scrollAnimations: new Set(),
		onreadies: new Set(),

		idleCallback: new Map(),
		animationFrame: new Map(),
		stat: 0,
		promise,
		resolve
	};
}
