import {renderTag, type_req, setReqCmd, type_animation, type_renderRes} from "../render/render.js";
//import pimport from "../_pimport.js";
import createArrFragment from "../arrfr.js";
import {Tpl_doc, Tpl_$src, p_target, cmdPref, cmdArgsDiv, cmdArgsDivLen, incCmdName, fetchCmdName, foreachCmdName, elseCmdName, defaultCmdName, onCmdName, isFillingName, isFillingDiv/*, orderName*/, asOneIdxName, idxName, defEventInit, defFetchReq,
	reqCmd} from "../config.js";
import {srcBy$src, getAttrAfter, getAttrItAfter, get$els, getNewId, type_asOneIdx, type_idx, type_save} from "../descr.js";
import {preRender, joinText, removeChild, cloneNode, getIdx, setAsOneIdx, setIdx, getTopUrl} from "../dom.js";
import {eval2} from "../eval2.js";
import {/*normalizeUrl, */getUrl} from "../loc.js";
import {loadingCount, showLoading, check, ocopy} from "../util.js";

export const incCache = {};
const waitingStack = new Map();
//self.incCache = incCache;
self.waitingStack = waitingStack;

export default {
	get$els($src, str, expr, pos) {
//console.log("inc get$els", $src, str, expr)
		return incGet$els($src, str, expr, pos);
	},
	get$first($src, str, expr, pos) {
		return incGet$first($src, str, expr, pos);
	},
	async render(req) {
//console.info("inc", req);
//alert(1);
		const include = await incGet(req);
		if (!include) {
			return type_renderRes(true);
		}
		const pos = -1,
			$els = incGet$els(req.$src, req.str, req.expr, pos),
			$elsLen = $els.length,
			oldVal = getIdx(srcBy$src.get(req.$src), req.str);
//console.log(111, req, $els, oldVal, srcBy$src.get(req.$src));
//alert(1);
//console.log(444, $els, req, `${$elsLen} > 1 && ${oldVal} && oldVal === ${include.url}`, $elsLen > 1 && oldVal && oldVal === include.url);
//alert(1);
		if ($elsLen > 1 && oldVal === include.url) {//уже в доме
//console.log(444, $els, req, `${$elsLen} > 1 && ${oldVal} && oldVal === ${include.url}`, $elsLen > 1 && oldVal && oldVal === include.url);
//alert(22);
			if ($elsLen > 3) {//если много тегов, тогда ренедрим их
				return getInc(req, include, $els, $elsLen);
			}
			return null;//продолжаем рендер следующей команды
		}
		const $last = $els[$elsLen - 1];
		if (include.readyState === "complete") {
			getNewInc(req, include, oldVal, $els, $elsLen, null);
			return type_renderRes(true, null, $last);
		}
		const loading = type_inLoading(req);
		if (loading.isShow) {
			showLoading(req.$src, () => false, loading.type, loading.waitTime);
		}
		if (!waitingStack.has(include.url)) {
			waitingStack.set(include.url, fetch(include.url, defFetchReq)
				.then(f => getIncHtml(req, include, f))
				.then(html => {
					waitingStack.delete(include.url);
					return createIncFragment(req, include, html);
				}));
		}
		const w = waitingStack.get(include.url);
		req.sync.afterAnimation.add(type_animation(() => w
			.then(() => req.sync.stat === 0 && getNewInc(req, include, oldVal, $els, $elsLen, loading)), req.local, 0));
		return type_renderRes(true, null, $last);
	}
};
async function incGet(req) {
	const u = req.reqCmd.args[0] ? req.expr : await eval2(req, req.$src, true);
	if (!u) {
		return null;
	}
	const url = getUrl(u, getTopUrl(srcBy$src.get(req.$src), req.str)),
		include = incCache[url];
	if (include) {
		return include;
	}
	return incCache[url] = type_include("loading", url);
}
function type_include(readyState, url) {
	return {
		readyState,
		url,
//		descrByDescrId: {},
		$fr: null,
		$tags: null,
		scope: null
	};
}
function type_inLoading(req) {
	return {
		isShow: req.reqCmd.args[1] !== undefined || req.reqCmd.args[2] !== undefined,
		type: req.reqCmd.args[1],
		waitTime: req.reqCmd.args[2]
	};
}
function getIncHtml(req, include, res) {
	if (res.ok) {
		return res.text();
	}
	//todo on.error
//todo
	const str = cmdPref + "errorUrl",
		errorUrl = req.$src.dataset[str];
	if (!errorUrl) {
		return check(new Error(`>>>Tpl inc:getIncHtml: Request ${include.url} stat ${res.status}`), req.$src, req);
	}
	return eval2(type_req(req.$src, str, errorUrl, req.scope, req.sync, req.local), req.$src, true)
		.then(url => getIncErrorHtml(req, url));
/*
	const errorUrl = req.$src.dataset[cmdPref + "errorUrl"] || req.$src.dataset.errorUrl;
	if (!errorUrl) {
		return check(new Error(`>>>Tpl inc:getIncHtml: Request ${include.url} stat ${res.status}`), req.$src, req);
	}
	if (req.$src.dataset[cmdPref + "errorUrl"] === undefined) {
		return getIncErrorHtml(req, errorUrl);
	}
	req.expr = errorUrl;
	return eval2(req, req.$src, true)
		.then(url => getIncErrorHtml(req, url));*/
}
function getIncErrorHtml(req, url) {
	url = getUrl(url, getTopUrl(srcBy$src.get(req.$src), req.str));
	return fetch(url, defFetchReq)
		.then(res => res.ok ? res.text() : check(new Error(`>>>Tpl inc:getIncErrorHtml: Request ${url} stat ${res.status}`), req.$src, req));
}
async function createIncFragment(req, include, html) {
	const $fr = Tpl_doc.createDocumentFragment(),
		$div = Tpl_doc.createElement("div");
	$div.innerHTML = html;
	for (let $i = $div.firstChild; $i !== null; $i = $div.firstChild) {
//	let $i;
//	while ($i = $div.firstChild) {
		$fr.appendChild($i);
	}
	if (self.getLineNo) {
		self.getLineNo.mark(self.getLineNo.type_markCtx(include.url, html), $fr);
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
//--		req.sync.animation.add(type_animation(() => {//todo- если так сделать то онрендер на тегах не сработает - пусть так
			if (include.$tags[0].parentNode === Tpl_doc.head) {
//todo такого не долждно быть - можно удалять
console.warn("applyIncFragment", include.$tags);
alert(1);
			}
			for (const $i of include.$tags) {
				Tpl_doc.head.appendChild($i);
			}
//--		}, req.local, 0));
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
		url = origUrl ? getUrl(origUrl, include.url) : "";
	if (url !== origUrl) {
		$e.setAttribute("src", url);
	}
	if ($e.type === "module") {
		if (url !== "") {
			try {
//				return pimport(url);
				return import(url)
					.then(m => incToScope(include, m));
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
					if (self.Tpl_debugLevel !== 0) {//todo
						URL.revokeObjectURL(uurl);
					}
					incToScope(include, m);
				});
		} catch (err) {
			if (self.Tpl_debugLevel !== 0) {//todo
				URL.revokeObjectURL(uurl);
			}
			throw checkScript(err, $e, req);
		}
		return;
	}
	if (url === "") {
		runIncScript(req, $e.textContent, $e, url);
		return;
	}
	return fetch(url, defFetchReq)
		.then(res => res.ok ? res.text() : check(new Error(`>>>Tpl inc:createIncScript: Request stat ${res.status}`), req.$src, req))
		.then(text => runIncScript(req, text, $e, url));
/*--
	const res = await fetch(url, defFetchReq);
	if (res.ok) {
		runIncScript(req, await res.text(), $e, url);
		return;
	}
	check(new Error(`>>>Tpl inc:createIncScripts: Request stat ${res.status}`), req.$src, req);*/
}
function incToScope(include, m) {
	include.scope = {};
	for (const i in m) {
		const j = m[i];
		include.scope[j.name] = j;
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
	if (!$e.getLineNo) {
		return check(err, $e, req);
	}
	const line = $e.getLineNo(),
		numIdx = line.lastIndexOf(":");
//	return check(err, $e, req, null, normalizeUrl(line.substr(0, numIdx)), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
	return check(err, $e, req, null, line.substr(0, numIdx), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
}
//new
function getNewInc(req, include, oldVal, $els, $elsLen, loading) {
	if (!req.$src.parentNode) {
//todo
		console.warn("skip", req, req.$src);
alert(1);
	}
//todo parentLocId - ? parentSrcId - --
	const $new = cloneIncFragment(req, include, oldVal, loading),
		$src = $new.firstChild,
		$last = $new.lastChild;
//	req.sync.animation.add(type_animation(() => {
//		getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src);
//		req.sync.afterAnimation.add(type_animation(() => getNewIncRender(req, include, $src, $last), req.local, 0));
//	}, req.local, 0));
	req.sync.animation.add(type_animation(() => getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src), req.local, 0));
	req.sync.afterAnimation.add(type_animation(() => getNewIncRender(req, include, $src, $last), req.local, 0));
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
		$lastNext = $els[$elsLen - 1].nextSibling;
	for (let i = 0; i < $elsLen; i++) {
		if ($els[i].parentNode !== $parent) {
//todo
console.warn("$parent", $els[i], $els, req);
alert(1);
			continue;
		}
		const iSrc = srcBy$src.get($els[i]);
		removeChild($els[i]);
		if (iSrc !== undefined) {
			const l = req.local.get(iSrc.id);
			l.animationsCount = -1;
			l.newSrcId = newSrcId;
//console.log(55555, iSrc.id, newSrcId);
			if (iSrc.id !== req.sync.p.sId) {// && $els[i][p_srcId] !== req.$src[p_srcId]) {
				continue;
			}
		}
		for (let $i = $src;;) {
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined) {
				req.sync.p.sId = iSrc.id;
				//!!переписывать req.$src в данном случаи не имет смысла
				break;
			}
			$i = $i.nextSibling;
			if ($i === null) {
				break;
			}
		}
/*<-
		let $i = $src;
		do {
			if ($i[p_srcId]) {
				req.sync.p.sId = $i[p_srcId];
				//!!переписывать req.$src в данном случаи не имет смысла
				break;
			}
			$i = $i.nextSibling;
		} while ($i !== null);*/
		for (i++; i < $elsLen; i++) {
			removeChild($els[i]);
		}
		break;
	}
	if (oldVal !== undefined) {
		const old = incCache[oldVal];
		if (old.$tags !== null) {
			for (let i = old.$tags.length - 1; i > -1; i--) {
				const $i = old.$tags[i];
				$i.parentNode.removeChild($i);
//or				Tpl_doc.head.removeChild($i);
			}
		}
	}
	$parent.insertBefore($new, $lastNext);
}
function getNewIncRender(req, include, $src, $last) {
	if (include.scope !== null) {
		for (const n in include.scope) {
			req.scope[p_target][n] = include.scope[n];
		}
	}
	return renderI(req, $src, $last, renderNewInc)
		.then($last => readyInc(req, include, $last));
}
async function renderNewInc(req, $e) {
	const afterAttr = new Map(),
		attrIt = srcBy$src.get($e).descr.attr.entries();
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		const [n, v] = i.value,
			cn = reqCmd[n].cmdName;
//todo inc args --
		if (v && ((cn !== incCmdName && cn !== fetchCmdName) || !reqCmd[n].args[0]) && cn !== elseCmdName && cn !== defaultCmdName && cn !== onCmdName) {
			await eval2(type_req($e, n, v, req.scope, req.sync, req.local), $e, true);//привязываем к новым тегам команды ДО
		}
		if (n === req.str) {
			break;
		}
	}
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		afterAttr.set(i.value[0], i.value[1]);
	}
	return renderTag($e, req.scope, afterAttr, req.sync, req.local);
}
//current
function getInc(req, include, $els, $elsLen) {
//console.error(8888, req, include, $els, $elsLen)
	return renderI(req, $els[0], $els[$elsLen - 1], renderInc)
		.then($last => readyInc(req, include, $last));
}
function renderInc(req, $e) {
//console.log(81111, req, $e, getAttrAfter(descrById.get($e[p_descrId]).attr, req.str))
	return renderTag($e, req.scope, getAttrAfter(srcBy$src.get($e).descr.attr, req.str), req.sync, req.local);
}
async function renderI(req, $e, $last, h) {
//const r = Math.random();
//console.log(1, r, req, $e, $last, h);
	do {
		const iSrc = srcBy$src.get($e);
		if (iSrc !== undefined && iSrc.isCmd) {//это когда template и в нем скрыта тектовая нода
//console.log(112, r, $e[p_srcId], $e, $e.parentNode, h, req, req.$src[p_srcId]);
			$e = await h(req, $e);
//console.log(113, $e[p_srcId], $e, $e.parentNode);
//alert(1);

			
			if (req.sync.stat !== 0) {
//todo
//				console.error(7878787, iSrc.id, $e, $last, req);
//				alert(11);
				return $last;
			}
//todo
			if ($e.parentNode !== $last.parentNode) {
				console.error(555555555, iSrc.id, $e, $last, req);
				alert(11);

				return $last;
			}
			if (!$last.nextSibling === $e) {
//todo
				console.warn(666666666, $e, $last, req);
				alert(11);

				return $last;
			}


		}
//if (!$e.nextSibling) {
//	console.log(2, $e, $last, req);
//	alert(1);
//}
		if ($e === $last) {
			return $last;
		}
		$e = $e.nextSibling;
	} while ($e !== null);
//todo
	console.warn(6666555555, $e, $last, req);
	alert(11);
}
//todo replace inline
function readyInc(req, include, $last) {
//console.log(66666, req.str, include.url, $last, $last.previousElementSibling)
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
	for (const n of getAttrItAfter(descr.attr.keys(), req.str)) {
		asOneIdx.delete(n);
		idx.delete(n);
	}
//!!2	idx.set(req.str, include.url);
	if (isR) {
		for (const [n, v] of save) {
			curAttr.set(n, v);
		}
//		if (curAttr.size === 0) {
//todo !!!
//			console.warn(req);
//			alert(3333333);
//		}
	} else if (loading !== null && loading.isShow) {
		const sId = src.id,
			l = loadingCount.get(sId);
		if (l.get("") === 1) {
			for (let i = 0; i < attrsLen; i++) {
				const a = attrs[i];
				if (a.name.idexOf(isFillingName) === 0) {
					continue;
				}
				curAttr.set(a.name, a.value);
				if (self.Tpl_debugLevel === 0 || a.name.indexOf(idxName) !== 0 && a.name.indexOf(asOneIdxName) !== 0) {//!!имеет смысл только при включеном дебаге
					save.set(a.name, a.value);
				}
			}
			loadingCount.delete(sId);
		} else {
			l.set("", l.get("") - 1);
//todo
			if (loading.type !== "") {
				l.set(loading.type, l.get(loading.type) - 1);
			}
			const lName = loading.type !== "" ? isFillingName + isFillingDiv + loading.type : isFillingName;
			for (let i = 0; i < attrsLen; i++) {
				const a = attrs[i];
				if (a.name === lName) {
					continue;
				}
				curAttr.set(a.name, a.value);
				if ((self.Tpl_debugLevel === 0 || a.name.indexOf(idxName) !== 0 && a.name.indexOf(asOneIdxName) !== 0) && a.name.indexOf(isFillingName) !== 0) {//!!имеет смысл только при включеном дебаге
					save.set(a.name, a.value);
				}
			}
		}
	} else {
		for (let i = 0; i < attrsLen; i++) {
			const a = attrs[i];
			curAttr.set(a.name, a.value);
			if (self.Tpl_debugLevel === 0 || a.name.indexOf(idxName) !== 0 && a.name.indexOf(asOneIdxName) !== 0) {//!!имеет смысл только при включеном дебаге
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
			newCmd = new Map(),
			remCmd = new Set();
		for (let j = 0; j < iAttrsLen; j++) {
			let n = iAttrs[j].name;
			if (!setReqCmd(n)) {
//				if (curAttr.has(n)) {
					newCmd.set(n, iAttrs[j].value);
//				}
				continue;
			}
			if (!curAttr.has(n)) {
				newCmd.set(n, iAttrs[j].value);
				remCmd.add(n);
				continue;
			}
			let k = n.indexOf(cmdArgsDiv),
				num;
			if (k === -1) {
				n += cmdArgsDiv;
				k = n.length;
			}
			k = n.indexOf(cmdArgsDiv, k + 1);
			if (k === -1) {
				n += cmdArgsDiv;
				k = n.length;
			}
			k = n.indexOf(cmdArgsDiv, k + 1);
			if (k === -1) {
				n += cmdArgsDiv;
				k = n.length;
			}

			k = n.indexOf(cmdArgsDiv, k + 1);
			if (k === -1) {
				n += cmdArgsDiv;
				num = 1;
			} else {
				num = Number(n.substr(k + cmdArgsDivLen)) || 1;
			}
			while (req.$src.getAttribute(n + num)) {
				num++;
			}
			n += num;
			newCmd.set(n, iAttrs[j].value);
		}
//todo проверить
		for (const n of remCmd) {
			$i.removeAttribute(n);
		}
		for (const [n, v] of curAttr) {
			$i.setAttribute(n, v);
		}
		for (const [n, v] of newCmd) {
			$i.setAttribute(n, v);
		}
		preRender($i, false);
		const iSrc = srcBy$src.get($i);
		if (asOneIdx.size !== 0) {
			iSrc.asOneIdx = type_asOneIdx(asOneIdx);
		}
		iSrc.idx = type_idx(idx);
		iSrc.save = save;//!!у всех один и тот же сэйв - но это не должно мешить - в теории можно было бы указать только у первого (что сэйв, что индекс)
//!!2
		if (self.Tpl_debugLevel !== 0) {
			for (const [n, v] of asOneIdx) {
				$i.setAttribute(asOneIdxName + n, v);
			}
			for (const [n, v] of idx) {
				$i.setAttribute(idxName + n, v);
			}
		}
//--		setAsOneIdx(iSrc, req.str, getNewId());
		setIdx(iSrc, req.str, include.url);
	}
	if (!$fr.firstElementChild) {
		return $fr;
	}
//тут что бы не создовать sId => preRender
	if (!isR) {//со слотами такая штука: если уже была вставка - это не делаем, так как путаница получиться
		makeSlots(req, $fr);
	}
	$fr.insertBefore(Tpl_doc.createComment("inc_begin"), $fr.firstChild);
	$fr.appendChild(Tpl_doc.createComment("inc_end"));
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
//--						req.sync.animation.add(type_animation(() => $s.appendChild($els[k]), req.local, 0));
					}
					continue;
				}
			}
//--			removeChild($v[j], true);
			$s.appendChild($v[j]);
//--			req.sync.animation.add(type_animation(() => $s.appendChild($v[j]), req.local, 0));
		}
	}
	if ($freeSlot) {
		for (let $i = req.$src.firstChild; $i !== null;) {
//--			removeChild($i, true);
			$freeSlot.appendChild($i);
//--			req.sync.animation.add(type_animation(() => $freeSlot.appendChild($i), req.local, 0));
		}
	}
}
/*
function dispatchEvent(evtName, req, include, $body) {
	const url = include.url.substring(0, include.url.indexOf(".", include.url.lastIndexOf("/"))) + ".js";
	self.dispatchEvent(new CustomEvent(evtName + url, type_customEventInit(include, $body, req)));
	self.dispatchEvent(new CustomEvent(evtName, type_customEventInit(include, $body, req)));
}
function type_customEventInit(include, $body, req) {
	const p = {
		detail: {
			include,
			$body,
			req
//			req: Object.freeze(req)
		}
	};
	for (const i in defEventInit) {
		p[i] = defEventInit[i];
	}
	return p;
}*/
function incGet$els($src, str, expr, pos) {
	if ($src.nodeType === 1 && !isRenderdInc($src, str)) {
		return [$src];
	}
	const $els = [];
	for (let $i = incGet$first($src, str, expr, pos), count = 0; $i !== null; $i = $i.nextSibling) {
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
//--			if ($i[p_isCmd] || $i.nodeType !== 8) {
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
	throw check(new Error(`>>>Tpl inc:incGet$els: Not found <!--inc_begin-->: "${str}", "${expr}", ${pos}`), $src);
}
function incGet$first($src, str, expr, pos) {
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
//console.log(33333333333, str, count, $src, $i);
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
	throw check(new Error(`>>>Tpl inc:incGet$first: Not found <!--inc_begin-->: "${str}", "${expr}", ${pos}`), $src);
}
function getIncCount($i, str, expr, pos) {
//todo , expr, pos
	let count = 0;
	const attrIt = getAttrItAfter(srcBy$src.get($i).descr.attr.keys(), str);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		if (reqCmd[i.value].cmdName === incCmdName) {
			if (!isRenderdInc($i, i.value)) {
				return count;
			}
			count++;
		}
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
		if (reqCmd[n].cmdName === incCmdName) {
			return getIdx(iSrc, n) !== undefined;
		}
	}
}
