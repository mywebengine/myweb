import {addTask, oset} from "./util.js";

import {Tpl_$src, _srcId, _descrId, startEventName, renderEventName} from "./config.js";
import {$srcById, descrById, createAttr, get$els} from "./descr.js";
import {preRender, getIdx, is$hide} from "./dom.js";
import {linkerTag} from "./render/linker.js";
import {cur$src} from "./proxy.js";
import {renderTag, q_renderTag, type_isLast, type_q_arr} from "./render/render.js";
import {reqCmd} from "./req.js";
import {getScope} from "./scope.js";

export let Tpl_delay = 0;
export function setDelay(v) {
	Tpl_delay = v;
}

export let curRender = Promise.resolve();
const renderParam = new Map();
export let curSyncId = 0;
export const afterRender = new Set();
let Tpl_syncId = 0;
export const syncById = {};

self.setDelay = setDelay;
self.syncById = syncById;
self.curRender = curRender;
//self.afterRender = afterRender;

export function render($src = Tpl_$src, delay = Tpl_delay, scope, attr) {
	self.dispatchEvent(new CustomEvent(startEventName));
	if (!$src[_descrId]) {
		preRender($src);
	}
	if (getRenderedState($src)) {
		return linkerTag($src, scope || null, attr || null);
	}
	return renderBy$src($src, delay, scope || null, attr || null);
}
self.render = render;
export function getRenderedState($e) {
	return $e.dataset.isRendered && $e.dataset.isRendered !== "false";
}
export function renderBy$src($src = Tpl_$src, delay, scope, attr) {
	if (cur$src) {
		return;
	}
	const sId = $src[_srcId];
	if (!sId || !$srcById[sId]) {
//		if (sId) {//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
//console.error("!$srcById[sId]", sId, $src);
//		} else {
//console.error("!$src[_srcId]", $src);
//		}
		return;
	}
	return new Promise((resolve, reject) => {
		renderParam.set(sId, type_renderParam(scope || null, attr || null, resolve, reject));
		tryRender(delay);
	});
}
export function renderBySrcIdSet(srcSet, delay) {
//console.log("renderBySrcIdSet", srcSet, cur$src);
	if (cur$src) {
		return;
	}
	for (const sId of srcSet) {
		if ($srcById[sId]) {
			renderParam.set(sId, type_renderParam(null, null, null, null));
//		} else {
//console.error("!$srcById[sId]", sId, srcSet);//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
		}
	}
	tryRender(delay);
}
function type_renderParam(scope, attr, resolve, reject) {
	return {
		scope,
		attr,
		resolve,
		reject
	};
}
function tryRender(delay = Tpl_delay) {
	const syncId = ++Tpl_syncId;
	setTimeout(async () => {
		if (!curSyncId && syncId === Tpl_syncId) {
			await curRender;
			curRender = _render(syncId);
		}
	}, delay);
}
async function _render(syncId) {
	if (!renderParam.size) {
		return Promise.resolve();
//		return;
	}
	curSyncId = syncId;
//console.time("prepareRenderParam");
	const byD = prepareRenderParam();
//console.timeEnd("prepareRenderParam");
	if (self.isDebug) {
		debugInfo(syncId, byD);
	}
	const sync = syncById[syncId] = type_sync(syncId),
		inRender = new Set(),
		pArr = [];
	for (const [dId, p] of byD) {
		const sId = p.sId,
			r = renderParam.get(sId);
		inRender.add(sId);
		if (p.srcIdSet.size > 1) {
			if (!r.attr) {
				r.attr = descrById.get(dId).attr;
			}
			pArr.push(_render_qI(r, p.srcIdSet, sync));
			continue;
		}
		const $i = $srcById[sId],
			attr = r.attr || descrById.get(dId).attr;
		if (r.scope) {
			pArr.push(_renderI(r, $i, r.scope, attr, sync));
			continue;
		}
		pArr.push(getScope($i)
			.then(scope => _renderI(r, $i, scope, attr, sync)));
	}
	const skiped = new Map();
	for (const [sId, r] of renderParam) {
		if (!inRender.has(sId) && r.resolve) {
			skiped.set(sId, r);
		}
	}
	renderParam.clear();
if (1) {
	try {
		for (const i of pArr) {
			await i;
		}
		return _renderReady(skiped);
	} catch (err) {
		_renderError(err, skiped)
	}
	return;
}
	return Promise.all(pArr)
		.then(() => _renderReady(skiped))
		.catch(err => _renderError(err, skiped));
}
function _renderI(r, $i, scope, attr, sync) {
	if (!r.resolve) {
		return addTask(() => renderTag($i, scope, attr, sync), sync);
	}
	return addTask(() => renderTag($i, scope, attr, sync), sync)
		.then(r.resolve)
		.catch(r.reject);
}
function _render_qI(r, srcIdSet, sync) {
	const arr = new Array(srcIdSet.size);
	let i = 0;
	for (const sId of srcIdSet) {
		arr[i++] = type_q_arr($srcById[sId], null);//renderParam.get(sId).scope
	}
	if (!r.resolve) {
		return addTask(() => q_renderTag(arr, r.attr, sync, type_isLast(), false), sync);
	}
	return addTask(() => q_renderTag(arr, r.attr, sync, type_isLast(), false))
		.then(r.resolve)
		.catch(r.reject);
}
//function _renderReady(skiped, prevLen) {
//	if (afterRender.size && afterRender.size !== prevLen) {
//		prevLen = afterRender.size;
//		return Promise.all(afterRender)
//			.then(() => _renderReady(skiped, prevLen));
async function _renderReady(skiped) {
	if (afterRender.size) {
		const a = new Set(afterRender),
			pArr = [];
		afterRender.clear();
		for (const i of a) {
			pArr.push(await i());
		}
		return Promise.all(pArr)
			.then(() => _renderReady(skiped));
	}
	_renderFilish(skiped, true);
	if (renderParam.size) {
		tryRender();
		return;
	}
	self.dispatchEvent(new CustomEvent(renderEventName));//, {detail: {}}));
}
function _renderError(err, skiped) {
	_renderFilish(skiped, false);
	throw err;
}
function _renderFilish(skiped, isOk) {
	afterRender.clear();
	delete syncById[curSyncId];
	curSyncId = 0;
	if (isOk) {
		for (const [sId, r] of skiped) {
			r.resolve($srcById[sId]);
		}
		return;
	}
	for (const [sId, r] of skiped) {
		r.reject($srcById[sId]);
	}
}
function prepareRenderParam() {
	const renderParamByDescrId = new Map(),
		byD = new Map(),
		mergeByD = {};
//console.log("prepareRenderParam", new Set(renderParam));
	for (const sId of renderParam.keys()) {
		const $i = $srcById[sId];
		if (!$i) {
//!!!!!!
//console.warn("!$srcById[sId]", sId);
//alert(1);
			continue;
		}
		const dId = $i[_descrId],
			d = descrById.get(dId),
			p = byD.get(dId);
		if (p) {
			if (!d.isAsOne) {
				p.srcIdSet.add(sId);
			}
			continue;
		}
		if (d.isAsOne) {
			const srcIdSet = new Set();
			for (const jId of d.srcIdSet) {
				const $j = $srcById[jId];
				if ($i.parentNode === $j.parentNode) {
					for (const str of d.attr.keys()) {
						if (reqCmd[str].cmd.isAsOne && getIdx($j, str) === "0") {
							srcIdSet.add(jId);
							break;
						}
					}
				}
			}
			byD.set(dId, type_prepareByD(sId, srcIdSet));
		} else {
			byD.set(dId, type_prepareByD(sId, new Set([sId])));
		}
		mergeByD[dId] = type_prepareMerge(0);
	}
	for (const [dId, p] of byD) {
		const $i = $srcById[p.sId];
//console.log(111, $i, is$hide($i));
		if (is$hide($i)) {
			byD.delete(dId);
			continue;
		}
		const d = descrById.get(dId),
			$els = !d.isAsOne && d.get$elsByStr && get$els($i, "", d.get$elsByStr);
		if ($els && $els.length > 1) {
//console.log($els);
			for (let i = $els.length - 1; i > -1; i--) {
				const iDId = $els[i][_descrId];
//todo
//if (jId === dId) {
//	console.warn("iId === dId", iDId, dId);
//}
//				console.log(`${iDId} !== ${dId} && ${byD.has(iDId)}`);
				if (iDId !== dId && byD.has(iDId)) {
//??				if (iDId && iId !== dId && byD.has(iDId)) {
					byD.delete(iDId);
				}
			}
		}
	}
	for (const [dId, p] of byD) {
		const mI = mergeByD[dId];
		for (let $i = $srcById[p.sId]; $i; $i = $i.parentNode) {
			if ($i === Tpl_$src) {
				for (const iId of p.srcIdSet) {
					if (iId !== p.sId && is$hide($srcById[iId])) {
						p.srcIdSet.delete(iId);
					}
				}
				renderParamByDescrId.set(dId, p);
				break;
			}
			const iDId = $i[_descrId];
			if (iDId) {//защита от документФрагмента
				const iD = descrById.get(iDId);
				if (iD.get$elsByStr) {
					const $els = get$els($i, "", iD.get$elsByStr);
//console.log(6222, dId, $els, iD.get$elsByStr);
//					if ($els) {
						for (let j = $els.length - 1; j > -1; j--) {
							mI.srcId[$els[j][_descrId]] = true;
//!!							const jDId = $j[_descrId];
//							if (jDId) {
//								mI.srcId[jDId] = true;
//							}
						}
//					}
				} else {
//console.log(6222, dId, iDId);
					mI.srcId[iDId] = true;
				}
			}
			mI.len++;
		}
	}
//console.log(1, renderParamByDescrId, mergeByD);
	for (const iDId of renderParamByDescrId.keys()) {
		for (const jDId of renderParamByDescrId.keys()) {
			if (iDId === jDId) {
				continue;
			}
			const mI = mergeByD[iDId],
				mJ = mergeByD[jDId];
//console.log(2, mI, mJ, iDId, jDId);
			if (mI.len < mJ.len) {
				if (mJ.srcId[iDId]) {
					renderParamByDescrId.delete(jDId);
//console.log("---", jDId, iDId);
				}
				continue;
			}
			if (mI.len > mJ.len && mI.srcId[jDId]) {
				renderParamByDescrId.delete(iDId);
//console.log("---", iDId, jDId, `${mI.len} > ${mJ.len} && ${mI.srcId[jDId]}`);
				break;
			}
		}
	}
	return renderParamByDescrId;
}
function type_prepareMerge(len) {
	return {
		len,
		srcId: {}
	};
}
function type_prepareByD(sId, srcIdSet) {
	return {
		sId,
		srcIdSet
	};
}
function type_sync(syncId) {
	return {
		syncId
	};
}
export function type_renderRes(isLast, $src = null, $last = null, $attr = null, attr = null) {
	return {
		isLast,
		$src,
		$last,
		$attr,
		attr
	};
}

function debugInfo(syncId, byD) {
	console.log(`tpl render(${syncId})`, Array.from(byD).map(p => ({
		dId: p[0],
		sId: p[1].sId,
		$src: $srcById[p[1].sId]
	})), Array.from(renderParam).map(p => ({
		sId: p[0],
		$src: $srcById[p[0]],
		scope: p[1].scope,
		attr: p[1].attr
	})));
}
