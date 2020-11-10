import {linkerTag} from "./linker.js";
import {renderTag, q_renderTag, type_isLast, type_q_arr} from "./render.js";
import {Tpl_$src, srcId, descrId, Tpl_delay, startEventName, renderEventName} from "../config.js";
import {$srcById, descrById, createAttr, get$els} from "../descr.js";
import {preRender, getIdx, is$hide} from "../dom.js";
import {cur$src} from "../proxy.js";
import {reqCmd} from "../req.js";
import {getScope} from "../scope.js";
import {addTask} from "../util.js";

const renderParam = new Map();
export let curRender = Promise.resolve();
let Tpl_syncId = 0;
export let curSyncId = 0;
export const syncById = {};
export const afterRender = new Set();

self.curRender = curRender;
//self.syncById = syncById;
//self.afterRender = afterRender;

export function render($src = Tpl_$src, delay = Tpl_delay, scope, attr) {
	self.dispatchEvent(new CustomEvent(startEventName));
	if (!$src[descrId]) {
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
	const sId = $src[srcId];
	if (!sId || !$srcById[sId]) {
//		if (sId) {//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
//			console.error("!$srcById[sId]", sId, $src);
//		} else {
//			console.error("!$src[srcId]", $src);
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
//			console.error("!$srcById[sId]", sId, srcSet);//!! это тогда, когда мы удалили элемент, но еще не успели очистить его ссылки
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
	setTimeout(() => {
		if (!curSyncId && syncId === Tpl_syncId) {
			curRender
				.then(() => _render(syncId));
		}
	}, delay);
}
async function _render(syncId) {
	curSyncId = syncId;
	if (!renderParam.size) {
		return Promise.resolve();
	}
//console.time("prepareRenderParam");
	const byD = prepareRenderParam(),
		sync = syncById[syncId] = type_sync(syncId),
		inRender = new Set(),
		pArr = [];
//console.timeEnd("prepareRenderParam");
	if (self.isDebug) {
		debugInfo(syncId, byD);
	}
	for (const [dId, p] of byD) {
		const sId = p.sId,
			r = renderParam.get(sId);
		if (r.resolve) {
			inRender.add(r);
		}
		if (!r.attr) {
			r.attr = descrById.get(dId).attr;
		}
		if (p.srcIdSet.size > 1) {
			const arr = new Array(p.srcIdSet.size);
			let i = 0;
			for (const sId of p.srcIdSet) {
				arr[i++] = type_q_arr($srcById[sId], null);//renderParam.get(sId).scope
			}
//			pArr.push(q_renderTag(arr, r.attr, sync, type_isLast(), false), sync);
			pArr.push(addTask(() => q_renderTag(arr, r.attr, sync, type_isLast(), false), sync));
			continue;
		}
		const $i = $srcById[sId];
		if (r.scope) {
//			pArr.push(renderTag($i, r.scope, r.attr, sync), sync);
			pArr.push(addTask(() => renderTag($i, r.scope, r.attr, sync), sync));
			continue;
		}
//		pArr.push(getScope($i)
		pArr.push(addTask(() => getScope($i)
			.then(scope => renderTag($i, scope, r.attr, sync), sync)));
	}
	renderParam.clear();
	return Promise.all(pArr)
		.then(() => {
			ready(inRender, sync);
		})
		.catch(err => {
			filish(inRender, err);
		});
}
function ready(inRender, sync) {
	if (afterRender.size) {
		const a = new Set(afterRender),
			pArr = [];
		afterRender.clear();
		for (const i of a) {
			pArr.push(i());
		}
		return Promise.all(pArr)
			.then(() => ready(inRender, sync));
	}
	filish(inRender, null);
	const isR = {};
	for (const sId of sync.srcIdSet) {
		const $i = $srcById[sId];
		if ($i) {
			$i.dispatchEvent(new CustomEvent(renderEventName));
			const dId = $i[descrId],
				d = descrById.get(dId);
			if (d.onRender) {
				if (d.isAsOne) {
					if (isR[dId]) {
						continue;
					}
					isR[dId] = true;
				}
				new Function(d.onRender).apply($i);
			}
//		} else {
//			console.warn(sId);
//			alert(2);
		}
	}
	self.dispatchEvent(new CustomEvent(renderEventName, {
		detail: {
			srcIdSet: sync.srcIdSet
		}
	}));
	if (renderParam.size) {
		tryRender();
	}
}
function filish(inRender, err) {
	afterRender.clear();
	delete syncById[curSyncId];
	curSyncId = 0;
	if (!inRender.size) {
		if (err) {
			throw err;
		}
		return;
	}
	if (!err) {
		for (const r of inRender) {
			r.resolve();
		}
		return;
	}
	for (const r of inRender) {
		r.reject(err);
	}
}
function prepareRenderParam() {
	const renderParamByDescrId = new Map(),
		byD = new Map(),
		mergeByD = {};
//console.log("prepareRenderParam", new Set(renderParam));
	for (const sId of renderParam.keys()) {
		const $i = $srcById[sId];
		if (!$i) {//удалённые элементы, ссылки на переменные еще могут остаться так как они удаляются в фоне
			continue;
		}
		const dId = $i[descrId],
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
			$els = !d.isAsOne && d.get$elsByStr && get$els($i, d.get$elsByStr);
//console.log(111, $els, $i, d);
		if ($els && $els.length > 1) {
//console.log(111, $els);
			for (let i = $els.length - 1; i > -1; i--) {
				const iDId = $els[i][descrId];
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
//console.log(1, $i);
			if ($i === Tpl_$src) {
				for (const iId of p.srcIdSet) {
					if (iId !== p.sId && is$hide($srcById[iId])) {
						p.srcIdSet.delete(iId);
					}
				}
				renderParamByDescrId.set(dId, p);
				break;
			}
			const iDId = $i[descrId];
			if (iDId) {//защита от документФрагмента
				const iD = descrById.get(iDId);
				if (iD.get$elsByStr) {
					const $els = get$els($i, iD.get$elsByStr);
//console.log(6222, dId, iD.get$elsByStr, $els);
//					if ($els) {
						for (let j = $els.length - 1; j > -1; j--) {
							mI.srcId[$els[j][descrId]] = true;
//!!							const jDId = $j[descrId];
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
		syncId,
		srcIdSet: new Set()
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
