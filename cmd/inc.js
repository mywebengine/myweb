import {renderTag, type_req, setReqCmd, type_localCounter, type_animation, type_renderRes} from "../render/render.js";
//import pimport from "../_pimport.js";
//import createArrFragment from "../arrfr.js";
import {mw_doc, p_target, cmdPref, cmdArgsDiv, cmdArgsDivLen, incCmdName, fetchCmdName, foreachCmdName, elseCmdName, defaultCmdName, onCmdName, isFillingName, isFillingDiv, asOneIdxName, idxName, defRequestInit,
	reqCmd} from "../config.js";
import {srcById, srcBy$src, getAttrAfter, getAttrItAfter, get$els, type_asOneIdx, type_idx, type_save} from "../descr.js";
import {preRender, joinText, removeChild, cloneNode, getIdx, setIdx, getTopUrl} from "../dom.js";
import {eval2, q_eval2} from "../eval2.js";
import {loadingCount, showLoading} from "../loading.js";
import {getUrl} from "../loc.js";
import {srcIdsByVarId} from "../proxy.js";
import {getRequest, check, ocopy} from "../util.js";

const waitingStack = new Map();
export const incCache = new Map();
const incScriptCache = new Map();

export default {
	get$els($src, str, expr, pos) {
//console.log("inc get$els", $src, str, expr)
		return inc_get$els($src, str, expr, pos);
	},
	get$first($src, str, expr, pos) {
		return inc_get$first($src, str, expr, pos);
	},
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => inc_render(req, val));
//			.then(val => getIncude(req, val))
//			.then(include => inc_render(req, include));
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = inc_render(type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), vals[i]);
//						res[i] = getIncude(req, vals[i]);
					}
				}
				return res;
/*
				return Promise.all(res)
					.then(includes => {
						for (let i = 0; i < arrLen; i++) {
							if (!isLast.has(i)) {
								res[i] = inc_render(type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), includes[i]);
							}
						}
						return res;
					});*/
			});
	}
};
function inc_render(req, val) {
//console.info("inc", req);
//alert(1);
	const include = getIncude(req, val);
	if (include === null) {
		return type_renderRes(true);
	}
	const pos = -1,
		$els = inc_get$els(req.$src, req.str, req.expr, pos),
		$elsLen = $els.length,
		oldVal = getIdx(srcBy$src.get(req.$src), req.str);
//todo
	for (let i = 0; i < $elsLen; i++) {
		const iSrc = srcBy$src.get($els[i]);
		if (iSrc !== undefined) {
			if (!req.sync.local.has(iSrc.id)) {
				req.sync.local.set(iSrc.id, type_localCounter());
			}
		}
	}
//console.log(111, req, $els, oldVal, srcBy$src.get(req.$src), include);
//alert(1);
	//если выражение вернуло Request или Response, то такой запрос будет всегда запрашиваться
//todo если объект тогда новый
	if ($elsLen !== 1 && oldVal === include.key) {//уже в доме
//console.log(444, $els, req, `${$elsLen} !== 1 && ${oldVal} === ${include.key}`, $elsLen !== 1 && oldVal === include.key);
//alert(22);
//		return $elsLen > 3 ? getInc(req, include, $els, $elsLen) : null;//если много тегов, тогда ренедрим их или продолжаем рендер следующей команды
		return $elsLen > 3 ? renderI(req, $els[0], $els[$elsLen - 1], renderInc)
			.then($last => readyInc(req, include, $last)) : null;//если много тегов, тогда ренедрим их или продолжаем рендер следующей команды
	}
	const $last = $els[$elsLen - 1];
	if (include.readyState === "complete") {
		getNewInc(req, include, oldVal, $els, $elsLen, null);
		return type_renderRes(true, null, $last);
	}
	const loading = type_incLoading(req);
	if (loading.isShow) {
		showLoading(req.$src, () => include.readyState === "complete", loading.type, loading.waitTime);
	}
	if (!waitingStack.has(include.key)) {
		waitingStack.set(include.key, (include.res === null ? fetch(include.req)
			.then(res => res.text()) : include.res.text())
			.then(html => {
				waitingStack.delete(include.key);
				return createIncFragment(req, include, html);
			}));
	}
	const w = waitingStack.get(include.key);
	req.sync.afterAnimations.add(type_animation(() => w
		.then(() => req.sync.stat === 0 && getNewInc(req, include, oldVal, $els, $elsLen, loading)), req.sync.local, 0));
	return type_renderRes(true, null, $last);
}
function getIncude(req, val) {
	if (typeof val !== "string") {
		const r = getRequest(val, "");
		if (r === null) {
			return null;
		}
//todo так как у респонса неполчится узнать гет ли он - то все добовляем кэш - А при использовании в строке в фетч - он всегда будет разный ...
		if (r.method === "GET" || r.method === undefined) {
			const include = incCache.get(r.url);
			if (include !== undefined) {
				return include;
			}
		}
		const inc = r instanceof Request ? type_include("loading", r.url, r, null) : type_include("loading", r.url, null, r);
		incCache.set(inc.key, inc);
		return inc;
	}
	const r = getRequest(val, getTopUrl(srcBy$src.get(req.$src), req.str)),
		include = incCache.get(r.url);
	if (include !== undefined) {
		return include;
	}
	const inc = type_include("loading", r.url, r, null);
	incCache.set(inc.url, inc);
	return inc;
}
function type_include(readyState, url, req, res) {
	return {
//		key: req === null ? (res === null ? url : res) : (req.method === "GET" ? url : req),
		key: req === null ? url : (req.method === "GET" ? url : req),
		readyState,
		url,
		req,
		res,
		$fr: null,
		$tags: null,
		scope: null
	};
}
function type_incLoading(req) {
	const a0 = req.reqCmd.args[0],
		a1 = req.reqCmd.args[1];
	return {
		isShow: a1 !== "" && a1 !== undefined || a0 !== "" && a0 !== undefined,
		type: a0 !== "" && a0 !== undefined ? a0 : "",
		waitTime: a1 !== "" && a1 !== undefined ? a1 : "",
	};
}
async function createIncFragment(req, include, html) {
	const $fr = mw_doc.createDocumentFragment(),
		$div = mw_doc.createElement("div");
	$div.innerHTML = html;
	for (let $i = $div.firstChild; $i !== null; $i = $div.firstChild) {
		$fr.appendChild($i);
	}
	if (self.mw_createLineNo) {
		self.mw_createLineNo(include.url, html, $fr);
	}
	joinText($fr);
	include.$tags = [...$fr.querySelectorAll("link[rel]")];
	for (const $i of include.$tags) {
		const uri = $i.getAttribute("href");
		if (uri) {
			const url = getUrl(uri, include.url);
			if (uri !== url) {
				$i.setAttribute("href", url);
			}
		}
	}
	include.$tags.push(...$fr.querySelectorAll("style"));
	const $scripts = $fr.querySelectorAll("script");
	if ($scripts.length !== 0) {
		await createIncScripts(req, include, $scripts);
	}
	if (include.$tags.length !== 0) {
//todo может быть просто вставить?
//--		req.sync.animations.add(type_animation(() => {//todo- если так сделать то онрендер на тегах не сработает - пусть так
			if (include.$tags[0].parentNode === mw_doc.head) {
//todo такого не долждно быть - можно удалять
console.warn("applyIncFragment", include.$tags, req);
alert(1);
			}
			for (const $i of include.$tags) {
				mw_doc.head.appendChild($i);
			}
//--		}, req.sync.local, 0));
	}
	include.$fr = $fr;
	include.readyState = "complete";
}
function createIncScripts(req, include, $scripts) {
	const $sLen = $scripts.length,
		scripts = new Array($sLen);
	for (let i = 0; i < $sLen; i++) {
		scripts[i] = createIncScript(req, include, $scripts[i]);
	}
	return Promise.all(scripts);
}
function createIncScript(req, include, $e) {
	$e.parentNode.removeChild($e);
	const origUrl = $e.getAttribute("src"),
		url = origUrl !== null ? getUrl(origUrl, include.url) : null;
	if (url !== origUrl) {
		$e.setAttribute("src", url);
	}
	if ($e.type === "module") {
		if (url !== null) {
			try {
//				return pimport(url);
				return import(url)
					.then(m => incToScope(m, include));
			} catch (err) {
				throw checkScript(err, $e, req, url);
			}
		}
		const uurl = URL.createObjectURL(new Blob([$e.textContent], {
			type: "text/javascript"
		}));
		try {
//			return pimport(uurl);
			return import(uurl)
				.then(m => {
					if (self.mw_debugLevel !== 0) {//todo
						URL.revokeObjectURL(uurl);
					}
					incToScope(m, include);
				});
		} catch (err) {
			if (self.mw_debugLevel !== 0) {//todo
				URL.revokeObjectURL(uurl);
			}
			throw checkScript(err, $e, req);
		}
		return;
	}
	if (url === null) {
		runIncScript(req, $e.textContent, $e, url);
		return;
	}
	const s = incScriptCache.get(url);
	if (s !== undefined)  {
		runIncScript(req, s, $e, url);
		return;
	}
	return fetch(url, defRequestInit)
		.then(res => {
			if (res.ok) {
				return res.text();
			}
			throw check(new Error(`>>>mw inc:createIncScript: Request stat ${res.status}`), req.$src, req);
		})
		.then(text => {
			incScriptCache.set(url, text);
			runIncScript(req, text, $e, url);
		});
}
function incToScope(m, include) {
	include.scope = {};
	for (const i in m) {
		const j = m[i];
		include.scope[j.name !== undefined ? j.name : i] = j;
	}
}
function scopeToInc(include, req) {
	if (include.scope === null) {
		return;
	}
	for (const n in include.scope) {
		req.scope[p_target][n] = include.scope[n];
	}
}
function runIncScript(req, text, $e, url) {
	try {
//		new Function(text).apply($e);
		self.eval(text);
	} catch (err) {
		throw checkScript(err, $e, req, url);
	}
}
function checkScript(err, $e, req, url) {
	if (url) {
		return check(err, $e, req, null, url, err.lineNumber, err.columnNumber);
	}
	if (self.mw_getLineNo === undefined) {
		return check(err, $e, req);
	}
	const line = self.mw_getLineNo($e),
		numIdx = line.lastIndexOf(":");
	return check(err, $e, req, null, line.substr(0, numIdx), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
}
//new
function getNewInc(req, include, oldVal, $els, $elsLen, loading) {
	const $new = cloneIncFragment(req, include, oldVal, loading),
		$src = $new.firstChild,
		$last = $new.lastChild;
//	req.sync.animations.add(type_animation(() => {
//		getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src);
//		req.sync.afterAnimations.add(type_animation(() => getNewIncRender(req, include, $src, $last), req.sync.local, 0));
//	}, req.sync.local, 0));
	req.sync.animations.add(type_animation(() => getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src), req.sync.local, 0));
//	req.sync.afterAnimations.add(type_animation(() => getNewIncRender(req, include, $src, $last), req.sync.local, 0));
	req.sync.afterAnimations.add(type_animation(() => {
		scopeToInc(include, req);
		return renderI(req, $src, $last, renderNewInc)
			.then($last => readyInc(req, include, $last));
	}, req.sync.local, 0))
}
function getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src) {
	let newSrcId = 0;
	for (let $i = $new.firstChild; $i !== null; $i = $i.nextSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc !== undefined) {
			newSrcId = iSrc.id;
			break;
		}
	}
	const $parent = $els[0].parentNode,
		$lastNext = $els[$elsLen - 1].nextSibling,
		src = srcBy$src.get(req.$src);
	for (let iSrc, i = 0;; i++) {
		iSrc = srcBy$src.get($els[i]);
		if (iSrc === undefined) {
			removeChild($els[i]);
			continue;
		}
		if (newSrcId !== 0) {
			const vIds = srcById.get(newSrcId).descr.varIds;
			for (const vId of iSrc.descr.varIds) {
				vIds.add(vId);
				const sIds = srcIdsByVarId.get(vId);
if (sIds === undefined) {
//todo
console.warn("inc.js");
alert(1)
//					continue;
}
				sIds.add(newSrcId);
			}
		}
		do {
			if (iSrc !== undefined) {
				const l = req.sync.local.get(iSrc.id);
				l.animationsCount = -1;
				l.newSrcId = newSrcId;
				if (iSrc.id === req.sync.renderParam.sId) {// && $els[i][p_srcId] !== req.$src[p_srcId]) {
					req.sync.renderParam.sId = newSrcId;
				}
			}
			removeChild($els[i]);
			iSrc = srcBy$src.get($els[i]);
		} while (++i < $elsLen);
		break;
	}
//todo	if (oldVal !== undefined) {
//		incClear(req.str, src, oldVal);
//	}
	$parent.insertBefore($new, $lastNext);
}
/*
function incClear(str, src, incKey) {
	incClearByKey(incKey);
	for (const n of getAttrItAfter(src.descr.attr.keys(), str, false)) {
		if (reqCmd.get(n).cmdName !== incCmdName) {
			break;
		}
		incKey = getIdx(src, n);
		if (incKey === undefined) {
			break;
		}
		incClearByKey(incKey);
	}
}
export function incClearByKey(key) {
	const inc = incCache.get(key);
console.error(1, key, inc?.counter);
	if (--inc.counter !== 0) {
		return;
	}
	incCache.delete(key);
	if (inc.$tags === null) {
		return;
	}
	for (let i = inc.$tags.length - 1; i > -1; i--) {
		const $i = inc.$tags[i];
		$i.parentNode.removeChild($i);
//or		mw_doc.head.removeChild($i);
	}
}*/
//function getNewIncRender(req, include, $src, $last) {
//	if (include.scope !== null) {
//		for (const n in include.scope) {
//			req.scope[p_target][n] = include.scope[n];
//		}
//	}
//	return renderI(req, $src, $last, renderNewInc)
//		.then($last => readyInc(req, include, $last));
//}
async function renderNewInc(req, $e) {
/*
	const afterAttr = new Map(),
		descr = srcBy$src.get($e).descr,
		attrIt = descr.attr.entries();
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		const [n, v] = i.value,
			cn = reqCmd.get(n).cmdName;
//todo inc args --
//		if (v && ((cn !== incCmdName && cn !== fetchCmdName) || !reqCmd.get(n).args[0]) && cn !== elseCmdName && cn !== defaultCmdName && cn !== onCmdName) {
//todo наверное всё же не так! для иквов фетчей это может стать проблемой
		if (v && cn !== elseCmdName && cn !== defaultCmdName && cn !== onCmdName) {
//todo
console.warn(n, v);
			await eval2(type_req($e, n, v, req.scope, req.sync), $e, true);//привязываем к новым тегам команды ДО
		}
		if (n !== req.str) {
			continue;
		}
		for (i = attrIt.next(); !i.done; i = attrIt.next()) {
			afterAttr.set(i.value[0], i.value[1]);
		}
		return renderTag($e, req.scope, afterAttr, req.sync);
	}
	throw new Error("inc.js");*/
	return renderTag($e, req.scope, getAttrAfter(srcBy$src.get($e).descr.attr, req.str), req.sync);
}
//current
//function getInc(req, include, $els, $elsLen) {
//	return renderI(req, $els[0], $els[$elsLen - 1], renderInc)
//		.then($last => readyInc(req, include, $last));
//}
function renderInc(req, $e) {
	return renderTag($e, req.scope, getAttrAfter(srcBy$src.get($e).descr.attr, req.str), req.sync);
}
async function renderI(req, $e, $last, h) {
	do {
		const iSrc = srcBy$src.get($e);
		if (iSrc !== undefined && iSrc.isCmd) {//это когда template и в нем скрыта тектовая нода
			$e = await h(req, $e);
			if (req.sync.stat !== 0) {
//				console.error(7878787, iSrc.id, $e, $last, req);
//				alert(11);
				return $last;
			}
/*
//todo--
			if ($e.parentNode !== $last.parentNode) {
				console.error(555555555, iSrc.id, $e, $last, req);
				alert(11);

				return $last;
			}
			if (!$last.nextSibling === $e) {
//todo--
				console.warn(666666666, $e, $last, req);
				alert(11);

				return $last;
			}*/
		}
		if ($e === $last) {
			return $last;
		}
		$e = $e.nextSibling;
	} while ($e !== null);
	throw new Error("inc.js");
}
//todo replace inline
function readyInc(req, include, $last) {
	return type_renderRes(true, null, $last);
}
function cloneIncFragment(req, include, oldVal, loading) {
	const $fr = cloneNode(req, include.$fr),
		src = srcBy$src.get(req.$src),
		descr = src.descr,
		attrs = req.$src.attributes,
		attrsLen = attrs.length,
		curAttr = new Map(),
		isR = oldVal !== undefined;
	const [asOneIdx, idx, save] = isR ? [type_asOneIdx(src.asOneIdx), src.idx, src.save] : [type_asOneIdx(src.asOneIdx), type_idx(src.idx), type_save()];//todo понаблюдать
	for (const n of getAttrItAfter(descr.attr.keys(), req.str, false)) {
		asOneIdx.delete(n);
		idx.delete(n);
	}
	if (isR) {
		for (const [n, v] of save) {
			curAttr.set(n, v);
		}
	} else {
		const skipAttrs = new Set();
		if (loading !== null && loading.isShow) {
			const sId = src.id,
				l = loadingCount.get(sId),
				lCount = l.get("") - 1;
			l.set("", lCount);
			if (lCount <= 0) {
				skipAttrs.add(isFillingName);
			}
			if (loading.type !== "") {
				const lCount = l.get(loading.type) - 1;
				l.set(loading.type, lCount);
				if (lCount <= 0) {
					skipAttrs.add(isFillingName + isFillingDiv + loading.type);
				}
			}
		}
		for (let i = 0; i < attrsLen; i++) {
			const a = attrs[i];
			if (skipAttrs.has(a.name)) {
				continue;
			}
			curAttr.set(a.name, a.value);
			if ((self.mw_debugLevel !== 0 || a.name.indexOf(idxName) !== 0 && a.name.indexOf(asOneIdxName) !== 0) && a.name.indexOf(isFillingName) !== 0) {
				save.set(a.name, a.value);
			}
		}
	}
	for (let i = 0, $i = $fr.firstChild; $i !== null; i++, $i = $i.nextSibling) {
		if ($i.nodeType !== 1) {
			continue;
		}
		const iAttrs = $i.attributes,
			iAttrsLen = iAttrs.length,
			newAttr = new Map();
		for (let i = 0; i < iAttrsLen; i++) {
			const a = iAttrs[i];
			newAttr.set(a.name, a.value);
		}
		for (const n of newAttr.keys()) {
			$i.removeAttribute(n);
		}
		const curAttrIt = curAttr.entries(),
			nSet = new Set();
		for (let i = curAttrIt.next(); !i.done; i = curAttrIt.next()) {
			const [n, v] = i.value;
			$i.removeAttribute(n);
			$i.setAttribute(n, v);
			nSet.add(n);
			if (n !== req.str) {
				continue;
			}
			for (const [n, v] of newAttr) {
				if (!setReqCmd(n)) {
					$i.removeAttribute(n);
					$i.setAttribute(n, v);
					continue;
				}
				let nn = n;
				while (nSet.has(nn)) {
					nn += cmdArgsDiv;
				}
				nSet.add(nn);
				$i.setAttribute(nn, v);
			}
			for (i = curAttrIt.next(); !i.done; i = curAttrIt.next()) {
				const [n, v] = i.value;
				if (!setReqCmd(n)) {
					$i.removeAttribute(n);
					$i.setAttribute(n, v);
					continue;
				}
				let nn = n;
				while (nSet.has(nn)) {
					nn += cmdArgsDiv;
				}
				$i.setAttribute(nn, v);
			}
			break;
		}
		preRender($i, false);
		const iSrc = srcBy$src.get($i);
		if (asOneIdx.size !== 0) {
			iSrc.asOneIdx = type_asOneIdx(asOneIdx);
		}
		iSrc.idx = type_idx(idx);
		iSrc.save = save;//!!у всех один и тот же сэйв - но это не должно мешить - в теории можно было бы указать только у первого (что сэйв, что индекс)
//!!2
		if (self.mw_debugLevel !== 0) {
			for (const [n, v] of asOneIdx) {
				$i.setAttribute(asOneIdxName + n, v);
			}
			for (const [n, v] of idx) {
				$i.setAttribute(idxName + n, v);
			}
		}
		setIdx(iSrc, req.str, include.key);
	}
	if (!$fr.firstElementChild) {
		return $fr;
	}
//тут что бы не создовать sId => preRender
//todo
	if (!isR) {//со слотами такая штука: если уже была вставка - это не делаем, так как путаница получиться
		makeSlots(req, $fr);
	}
	$fr.insertBefore(mw_doc.createComment("inc_begin"), $fr.firstChild);
	$fr.appendChild(mw_doc.createComment("inc_end"));
	return $fr;
}
function makeSlots(req, $fr) {
	const $slots = $fr.querySelectorAll("slot[name]"),
		$slotsLen = $slots.length;//,
//		$freeSlot = $fr.firstElementChild || $fr/*<-!!какой в этом резон?*/;
//		$freeSlot = isRenderdInc(req.$src, req.str) ? null : ($fr.firstElementChild || $fr/*<-!!какой в этом резон?*/);//!!если ранее уже рендерели inc, значит у нас в старой вставке теги и они попадут в дефолтный слот - по этому дефолтного слота нет!
	let $freeSlot;
	for (let i = 0; i < $slotsLen; i++) {
		const $s = $slots[i];
		if (!$s.name && !$freeSlot) {
			$freeSlot = $s;
			continue;
		}
		const $v = req.$src.querySelectorAll(`[slot="${$s.name}"]`),
			$vLen = $v.length;
		for (let j = 0; j < $vLen; j++) {
			const jSrc = srcBy$src.get($v[j]);
			if (jSrc !== undefined) {
				const get$elsByStr = jSrc.descr.get$elsByStr;
				if (get$elsByStr !== null) {
					const $els = get$els($v[j], get$elsByStr, ""),
						$elsLen = $els.length;
					for (let k = 0; k < $elsLen; k++) {
//--						removeChild($els[k], true);
						$s.appendChild($els[k]);
//--						req.sync.animations.add(type_animation(() => $s.appendChild($els[k]), req.sync.local, 0));
					}
					continue;
				}
			}
//--			removeChild($v[j], true);
			$s.appendChild($v[j]);
//--			req.sync.animations.add(type_animation(() => $s.appendChild($v[j]), req.sync.local, 0));
		}
	}
	if ($freeSlot) {
		for (let $i = req.$src.firstChild; $i !== null;) {
//--			removeChild($i, true);
			$freeSlot.appendChild($i);
//--			req.sync.animations.add(type_animation(() => $freeSlot.appendChild($i), req.sync.local, 0));
		}
	}
}
function inc_get$els($src, str, expr, pos) {
	if ($src.nodeType === 1 && !isRenderdInc($src, str)) {
		return [$src];
	}
	const $els = [];
	for (let $i = inc_get$first($src, str, expr, pos), count = 0; $i !== null; $i = $i.nextSibling) {
		$els.push($i);
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		count = getIncCount($i, str, expr, pos);
		for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
			$els.push($i);
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined && iSrc.isCmd || $i.nodeType !== 8) {
				continue;
			}
			const t = $i.textContent;
			if (t === "inc_end") {
				if (count === 0) {
					return $els;
				}
				count--;
			} else if (t === "inc_begin") {
				count++;
			}
		}
		break;
	}
	throw check(new Error(`>>>mw inc:incGet$els: Not found <!--inc_begin-->: "${str}", "${expr}", ${pos}`), $src);
}
function inc_get$first($src, str, expr, pos) {
	if ($src.nodeType === 1 && !isRenderdInc($src, str)) {
		return $src;
	}
	if ($src.nodeType === 8 && $src.textContent === "inc_begin") {
		return $src;
	}
	for (let $i = $src, count = 0; $i !== null; $i = $i.previousSibling) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined || !iSrc.isCmd) {
			continue;
		}
		count = getIncCount($i, str, expr, pos);
		for ($i = $i.previousSibling; $i !== null; $i = $i.previousSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined && iSrc.isCmd || $i.nodeType !== 8) {
				continue;
			}
			const t = $i.textContent;
			if (t === "inc_begin") {
				if (count === 0) {
					return $i;
				}
				count--;
			} else if (t === "inc_end") {
				count++;
			}
		}
		break;
	}
	throw check(new Error(`>>>mw inc:incGet$first: Not found <!--inc_begin-->: "${str}", "${expr}", ${pos}`), $src);
}
function getIncCount($i, str, expr, pos) {
//todo , expr, pos
	let count = 0;
	const attrIt = getAttrItAfter(srcBy$src.get($i).descr.attr.keys(), str, false);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		if (reqCmd.get(i.value).cmdName !== incCmdName) {
			continue;
		}
		if (!isRenderdInc($i, i.value)) {
			return count;
		}
		count++;
	}
	return count;
}
function isRenderdInc($i, str) {
	if ($i.nodeType === 8 && $i.textContent === "inc_end") {
		while (!srcBy$src.has($i) && $i !== null) {
			$i = $i.previousSibling;
		}
	} else {
		while (!srcBy$src.has($i) && $i !== null) {
			$i = $i.nextSibling;
		}
	}
	const iSrc = srcBy$src.get($i);
	if (str) {
		return getIdx(iSrc, str) !== undefined;
	}
	for (const n of iSrc.descr.attr.keys()) {
		if (reqCmd.get(n).cmdName === incCmdName) {
			return getIdx(iSrc, n) !== undefined;
		}
	}
}
