import {afterRender, type_renderRes} from "../render/algo.js";
//import pimport from "../_pimport.js";
import createArrFragment from "../arrfr.js";
import {cache} from "../cache.js";
import {Tpl_doc, Tpl_$src, p_srcId, p_descrId, p_isCmd, cmdPref, cmdArgsBegin, cmdArgsDiv, incCmdName, fetchCmdName, elseCmdName, defaultCmdName, scopeCmdName, orderName, idxName, saveName, localIdName, defFetchReq} from "../config.js";
import {$srcById, descrById, createSrc, getAttrAfter, getAttrItAfter, get$els} from "../descr.js";
import {preRender, replaceTextBlocks, removeChild, getIdxName, getIdx, getTopURL, getLocalIdName, getLocalId} from "../dom.js";
import {eval2} from "../eval2.js";
import {normalizeURL, getURL, isURI} from "../loc.js";
import {linkerTag} from "../render/linker.js";
import {renderTag} from "../render/render.js";
import {reqCmd, type_req, getReqCmd} from "../req.js";
import {getNewLocalId, setLocalScope} from "../scope.js";
import {addAnimation, check, spaceRe} from "../util.js";

export const incCache = {};
const waitingStack = new Map();
//self.incCache = incCache;
//self.waitingStack = waitingStack;

const incLoadEventName = "incLoad";
const incMountEventName = "incMount";
const incRenderEventName = "incRender";

//self.isOldEdge = navigator.userAgent.search("Edge/1\\d+\\.") !== -1;

export default {
	get$els($src, str, expr, pos) {
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
			oldVal = getIdx(req.$src, req.str);
		if ($elsLen > 1 && oldVal && oldVal === include.url) {//уже в доме
			if ($elsLen > 3) {//если много тегов, тогда ренедрим их
				return getInc(req, include, $els, $elsLen);
			}
			return null;//продолжаем рендер следующей команды
		}
		const w = waitingStack.get(include.url),
			$last = $els[$elsLen - 1];
		if (w) {
			w.add(type_waiting(req, oldVal, $els, $elsLen));
			return type_renderRes(true, null, $last);
		}
		if (include.readyState === "complete") {
			return getNewInc(req, include, oldVal, $els, $elsLen);
		}
		waitingStack.set(include.url, new Set([type_waiting(req, oldVal, $els, $elsLen)]));
		const f = fetch(include.url, defFetchReq);
		afterRender.add(async () => {
			const html = await getIncHTML(req, include, await f);
			if (typeof html === "string") {
				return getLoadedInc(req, include, await createIncFragment(req, include, html));
			}
		});
		return type_renderRes(true, null, $last);
	},
	linker(req) {
/*
		const include = incGet(req);
		if (!include) {
			return type_renderRes(true);
		}
		include.readyState = "loaded";
		dispatchEvent(incLoadEventName + include.url, req, include);
		dispatchEvent(incLoadEventName, req, include);
		include.readyState = "complete";

		const $els = incGet$els(req.$src, req.str),
			$elsLen = $els.length;
		for (let i = 0; i < $elsLen; i++) {
			const $i = $els[i];
//			if (i.nodeType === 1 && 
			if ($i[p_descrId]) {
				linkerTag($i, req.scope, getAttrAfter(descrById.get($i[p_descrId]).attr, req.str));
			}
		}
//todo может быть нужно запускать событие поле того как всё что рендерится будет готово?
		const $body = createArrFragment($els.slice(1, $elsLen - 1));
		dispatchMountEvent(req, include, $body);
		dispatchEvent(incRenderEventName + include.url, req, include, $body);
		return type_renderRes(true, null, $els[$elsLen - 1]);*/
	},
	setScope(req) {
		return true;
	}
};
async function incGet(req) {
	let url = req.reqCmd.args[0] ? req.expr : await eval2(req, req.$src, true);
	if (!url) {
		return null;
	}
	url = getURL(url, getTopURL(req.$src, req.str));
	const include = incCache[url];
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
		$tags: null
	};
}
function type_waiting(req, oldVal, $els, $elsLen) {
	return {
		req,
		oldVal,
		$els,
		$elsLen
	};
}
async function getIncHTML(req, include, res) {
	if (res.ok) {
		return res.text();
	}
	const errorURL = req.$src.dataset[cmdPref + "errorUrl"] || req.$src.dataset.errorUrl;
	if (!errorURL) {
		return check(new Error(`>>>Tpl inc:render:01: Request ${include.url} stat ${res.status}`), req);
	}
	if (req.$src.dataset[cmdPref + "errorUrl"] === undefined) {
		return getIncErrorHTML(req, errorURL);
	}
	req.expr = errorURL;
	return getIncErrorHTML(req, await eval2(req, req.$src, true));
}
async function getIncErrorHTML(req, url) {
	url = getURL(url, getTopURL(req.$src, req.str));
	const res = await fetch(url, defFetchReq);
	if (res.ok) {
		return res.text();
	}
	return check(new Error(`>>>Tpl inc:render:02: Request ${url} stat ${res.status}`), req);
}
async function createIncFragment(req, include, html) {
/*
//self.isOldEdge = true;
	if (self.isOldEdge) {
		for (let m; m = /((<link\s[^\>]*?)href\=)/.exec(html);) {
			html = html.replace(m[1], m[2] + "_ref=");
		}
	}*/      
	const $fr = Tpl_doc.createDocumentFragment(),
		$div = Tpl_doc.createElement("div");
	$div.innerHTML = html;
	let $i;
	while ($i = $div.firstChild) {
		$fr.appendChild($i);
	}
	if (self.getLineNo) {
		self.getLineNo.mark(self.getLineNo.type_markCtx(include.url, html), $fr);
	}
	incReplaceTextBlocks($fr);
	joinText($fr);
	include.$tags = [];
//	const hrefAttrName = self.isOldEdge ? "_ref" : "href";
	for (const $i of $fr.querySelectorAll("link[rel]")) {
//		const uri = $i.getAttribute(hrefAttrName);
		const uri = $i.getAttribute("href");
		if (uri) {
			const url = getURL(uri, include.url);
//			if (self.isOldEdge || uri !== url) {
			if (uri !== url) {
				$i.setAttribute("href", url);
			}
		}
		include.$tags.push($i);
	}
	include.$tags.push(...$fr.querySelectorAll("style"));
	const $scripts = $fr.querySelectorAll("script");
	if ($scripts.length) {
		await createIncScripts(req, include, $scripts);
	}
//	return applyIncFragment(include, $fr);
	await addAnimation(() => {
		if (include.$tags.length) {// && include.$tags[0].parentNode !== Tpl_doc.head) {
			if (include.$tags[0].parentNode === Tpl_doc.head) {
//todo
console.warn("applyIncFragment", include.$tags);
alert(1);
			}
			for (const $i of include.$tags) {
				Tpl_doc.head.appendChild($i);
			}
		}
	}, req.sync);
	return $fr;
}
function incReplaceTextBlocks($i) {
	for ($i = $i.firstChild; $i; $i = $i.nextSibling) {
		switch ($i.nodeType) {
			case 1:
				incReplaceTextBlocks($i);
			break;
			case 3:
				$i = replaceTextBlocks($i);
			break;
		}
	}
}
function joinText($e) {
	for (let $next, $i = $e.firstChild; $i; $i = $i.nextSibling) {
		while ($i.nodeType === 3 && ($next = $i.nextSibling) && $next.nodeType === 3) {
			$i.textContent += $e.removeChild($next).textContent;
		}
	}
}
function createIncScripts(req, include, $scripts) {
	include.$tags.push(...$scripts);
	const $sLen = $scripts.length,
		scripts = new Array($sLen);
	for (let i = 0; i < $sLen; i++) {
		scripts[i] = createIncScript(req, include, $scripts[i]);
	}
	return Promise.all(scripts);
}
async function createIncScript(req, include, $e) {
	const origURL = $e.getAttribute("src"),
		url = origURL && getURL(origURL, include.url);
	if (url && url !== origURL) {
		$e.setAttribute("src", url);
	}
	if ($e.type === "module") {
		if (url) {
			try {
//				return pimport(url);
				return import(url);
			} catch (err) {
				throw checkInc(err, req, $e, url);
			}
		}
		const uurl = URL.createObjectURL(new Blob([$e.textContent], {
			type: "text/javascript"
		}));
		try {
//			return pimport(uurl);
			return import(uurl);
		} catch (err) {
			throw checkInc(err, req, $e);
		}
		if (!self.isDebug) {
			URL.revokeObjectURL(uurl);
		}
		return;
	}
	if (!url) {
		runIncScript(req, $e.textContent, $e, url);
		return;
	}
	const res = await fetch(url, defFetchReq);
	if (res.ok) {
		runIncScript(req, await res.text(), $e, url);
		return;
	}
	check(new Error(`>>>Tpl inc:createIncScripts:01: Request stat ${res.status}`), req);
}
function runIncScript(req, text, $e, url) {
	try {
//		new Function(text).apply($e);
		self.eval(text);
	} catch (err) {
		throw checkInc(err, req, $e, url);
	}
}
function checkInc(err, req, $e, url) {
	if (url) {
		return check(err, req, null, url, err.lineNumber, err.columnNumber);
	}
	if ($e && $e.getLineNo) {
		const line = $e.getLineNo(),
			numIdx = line.lastIndexOf(":");
		return check(err, req, null, normalizeURL(line.substr(0, numIdx)), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
	}
	return check(err, req);
}
function getLoadedInc(req, include, $fr) {
	include.$fr = $fr;
	include.readyState = "loaded";
	dispatchEvent(incLoadEventName + include.url, req, include);
	dispatchEvent(incLoadEventName, req, include);
	include.readyState = "complete";
	const pArr = [];//!!можно делать много Новых вставок параралельно - это безопасно потому-что рендер будет происходить только внутри
	for (const w of waitingStack.get(include.url)) {
		pArr.push(getNewInc(w.req, include, w.oldVal, w.$els, w.$elsLen));
	}
	waitingStack.delete(include.url);
	return Promise.all(pArr);
}
//new
async function getNewInc(req, include, oldVal, $els, $elsLen) {
	const r = await addAnimation(() => createInc(req, include, oldVal, $els, $elsLen), req.sync);
	return readyInc(req, include, await renderI(req, r.$src, r.$last, (req, $e) => renderNewInc(req, $e, r.lId)));
}
async function renderNewInc(req, $e, lId) {
	setLocalScope(lId, req.scope, $e, req.str);
	const afterAttr = new Map(),
		attrIt = descrById.get($e[p_descrId]).attr.entries();
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		const [n, v] = i.value,
			cn = reqCmd[n].cmdName;
		if (v && ((cn !== incCmdName && cn !== fetchCmdName) || !reqCmd[n].args[0]) && cn !== elseCmdName && cn !== defaultCmdName) {
			await eval2(type_req($e, n, v, req.scope, req.sync, req.inFragment), $e, true);//привязываем к новым тегам команды ДО
		}
		if (n === req.str) {
			break;
		}
	}
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		afterAttr.set(i.value[0], i.value[1]);
	}
	return renderTag($e, req.scope, afterAttr, req.sync);
}
//current
async function getInc(req, include, $els, $elsLen) {
	return readyInc(req, include, await renderI(req, $els[0], $els[$elsLen - 1], renderInc));
}
function renderInc(req, $e) {
	return renderTag($e, req.scope, getAttrAfter(descrById.get($e[p_descrId]).attr, req.str), req.sync);
}
async function renderI(req, $e, $last, h) {
//const r = Math.random();
//console.log(1, r, req, $e, $last, h);
	do {
//		if ($e.nodeType === 1 && 
		if ($e[p_isCmd]) {//это когда template и в нем скрыта тектовая нода
//console.log(112, r, $e[p_srcId], $e, $e.parentNode, h, req, req.$src[p_srcId]);
			$e = await h(req, $e);
//console.log(113, r, $e[p_srcId], $e, $e.parentNode);
//alert(1);
//todo
			if ($e.parentNode !== $last.parentNode) {
				console.error(555555555, $e[p_srcId], $e, $last, req);
alert(11);
				return $e;
			}
			if (!$last.nextSibling === $e) {
				console.warn(666666666, $e, $last, req);
				return $e;
			}
		}
//if (!$e.nextSibling) {
//	console.log(2, $e, $last, req);
//	alert(1);
//}
		if ($e === $last) {
			break;
		}
	} while ($e = $e.nextSibling);
//console.error(3, r, req, $e, $last);
//alert(1);
	return $e;
}
function readyInc(req, include, $last) {
	const pos = -1,
		$els = incGet$els($last, req.str, req.expr, pos),
		$body = createArrFragment($els.slice(1, $els.length - 1));
	dispatchEvent(incRenderEventName + include.url, req, include, $body);
	return type_renderRes(true, null, $last);
}
function createInc(req, include, oldVal, $els, $elsLen) {
//	if (!req.$src.parentNode || req.$src.parentNode.nodeType === 11 || req.$src.nodeName === "TEMPLATE") {
	if (!req.$src.parentNode) {
//todo
		console.warn("skip", req, req.$src);
alert(1);
//		return null;//!!!!!! todo - наверное, кто-то скрыл или удалил
	}
	const attrIt = getAttrItAfter(descrById.get(req.$src[p_descrId]).attr.keys(), req.str);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
		const n = i.value;
		if (reqCmd[n].cmdName === incCmdName) {
			req.$src.removeAttribute(getIdxName(n));
		}
	}
	const $parent = $els[0].parentNode,
		$lastNext = $els[$elsLen - 1].nextSibling,
		lId = getNewLocalId(),
		$new = cloneIncFragment(req, include, lId, oldVal),
		$src = $new.firstChild,
		$last = $new.lastChild,
		$bodyElsLen = $new.childNodes.length - 1,
		$bodyEls = new Array($bodyElsLen);
	for (let i = 0; i < $bodyElsLen; i++) {
		$bodyEls[i] = $new.childNodes[i + 1];
	}
	for (let i = 0; i < $elsLen; i++) {
		removeChild($els[i], !!oldVal);
	}
//	req.$src = $i;
	$parent.insertBefore($new, $lastNext);
	dispatchMountEvent(req, include, createArrFragment($bodyEls));
	return type_includeRes($src, $last, lId);
}
function type_includeRes($src, $last, lId) {
	return {
		$src,
		$last,
		lId
	};
}
function cloneIncFragment(req, include, lId, oldVal) {
	const $fr = include.$fr.cloneNode(true),
		dId = req.$src[p_descrId],
		d = descrById.get(dId),
//		incD = include.descrByDescrId[dId] || (include.descrByDescrId[dId] = []),
		attrs = req.$src.attributes,
		attrsLen = attrs.length,
		isRendered = isRenderdInc(req.$src, req.str),
		isDynamicURL = !req.reqCmd.args[0],
//		isDynamicURL = true,
		curAttr = new Map();
	if (isRendered && isDynamicURL) {//если найдем save значит это динамическая вставка
		for (let i = 0; i < attrsLen; i++) {
			const a = attrs[i],
				n = a.name;
			if (n.indexOf(saveName) === 0) {
				const str = n.substr(saveName.length);
				if (str === req.str) {
					const j = JSON.parse(a.value);
					for (const nn in j) {
						curAttr.set(nn, j[nn]);
						if (reqCmd[nn]) {
							const iName = getIdxName(nn),
								iValue = req.$src.getAttribute(iName);
							if (iValue) {
								curAttr.set(iName, iValue);
							}
							const lName = getLocalIdName(nn),
								lValue = req.$src.getAttribute(lName);
							if (lValue) {
								curAttr.set(lName, lValue);
							}
						}
					}
					curAttr.set(n, a.value);
					break;
				}
			}
		}
		if (!curAttr.size) {
//todo !!!
			console.warn(req);
			alert(3333333);
		}
	}
	if (!curAttr.size) {//занчат что команда первый раз на рендере
		for (let i = 0; i < attrsLen; i++) {
			const a = attrs[i],
				n = a.name;
			curAttr.set(n, a.value);
		}
		const o = curAttr.get(orderName);
		if (o) {
			if (!isRendered && o.split(spaceRe).indexOf(req.str) === -1) {
				curAttr.set(orderName, o + " " + req.str);
			}
		} else {
			const aIt = d.attr.keys();
			let i = aIt.next(),
				oo = i.value;
			for (i = aIt.next(); !i.done; i = aIt.next()) {
				oo += " " + i.value;
			}
			curAttr.set(orderName, oo);
		}
	}	
	if (isDynamicURL && !getIdx(req.$src, req.str)) {
		const save = {};
		for (let i = 0; i < attrsLen; i++) {
			const n = attrs[i].name;
			if (n.indexOf(idxName) !== 0) {
				save[n] = attrs[i].value;
			}
		}
		if (save[orderName]) {
			if (save[orderName].split(spaceRe).indexOf(req.str) === -1) {
				save[orderName] += " " + req.str;
			}
		} else {
			save[orderName] = Array.from(d.attr.keys()).join(" ");
		}
		curAttr.set(saveName + req.str, JSON.stringify(save));
	}
	const order = curAttr.get(orderName).split(spaceRe),
		iName = getIdxName(req.str),
		lName = getLocalIdName(req.str),
		isTextOnly = !$fr.firstElementChild;
	if (!oldVal) {//со слотами такая штука: если уже была вставка - это не делаем, так как путаница получиться
		makeSlots(req, $fr);
	}
	for (let i = 0, $i = $fr.firstChild; $i; i++, $i = $i.nextSibling) {
		if ($i.nodeType !== 1) {
			continue;
		}
		const iAttrs = $i.attributes,
			iAttrsLen = iAttrs.length,
			iOrder = [],
			newCmd = new Map();
		for (let j = 0; j < iAttrsLen; j++) {
			let n = iAttrs[j].name;
			if (!getReqCmd(n)) {
				continue;
			}
			if (!curAttr.has(n)) {
				iOrder.push(n);
				continue;
			}
			let k = n.indexOf(cmdArgsBegin),
				num;
			if (k === -1) {
				n += cmdArgsBegin;
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
				num = Number(n.substr(k + cmdArgsDiv.length)) || 1;
			}
			while ($i.getAttribute(n + num)) {
				num++;
			}
			n += num;
			newCmd.set(n, iAttrs[j].value);
			iOrder.push(n);
		}
		for (const [n, v] of curAttr) {
			$i.setAttribute(n, v);
		}
		for (const [n, v] of newCmd) {
			$i.setAttribute(n, v);
		}
		$i.setAttribute(orderName, order.concat(iOrder).join(" "));
		$i.setAttribute(iName, include.url);
		$i.setAttribute(lName, lId);

//		if (incD[i]) {
//			createSrc($i, incD[i]);
//		} else {
			createSrc($i);
//			incD[i] = $i[p_descrId];
//		}
//todo !!for - так ли делать или иначе, нужно подумать
//		descrById.get(incD[i]).curByStr = d.curByStr;
		for (let $j = $i.firstChild; $j; $j = $j.nextSibling) {
			if ($j.nodeType === 1) {
				preRender($j);
			}
		}
	}
	if (!isTextOnly) {
//		$fr.insertBefore(Tpl_doc.createComment("inc_begin" + req.str), $fr.firstChild);
		$fr.insertBefore(Tpl_doc.createComment("inc_begin"), $fr.firstChild);
		$fr.appendChild(Tpl_doc.createComment("inc_end"));
	}
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
			if ($v[j][p_descrId]) {
				const get$elsByStr = descrById.get($v[j][p_descrId]).get$elsByStr;
				if (get$elsByStr) {
					const $els = get$els($v[j], get$elsByStr),
						$elsLen = $els.length;
					for (let k = 0; k < $elsLen; k++) {
						$s.appendChild($els[k]);
					}
					continue;
				}
			}
			$s.appendChild($v[j]);
		}
	}
	if ($freeSlot) {
		let $i;
		while ($i = req.$src.firstChild) {
			$freeSlot.appendChild($i);
		}
	}
}
function dispatchMountEvent(req, include, $body) {
	dispatchEvent(incMountEventName + include.url, req, include, $body);
	dispatchEvent(incMountEventName, include, req, $body);
}
function dispatchEvent(evtName, req, include, $body) {
	self.dispatchEvent(new CustomEvent(evtName, type_customEventInit(include, $body, req)));
}
function type_customEventInit(include, $body, req) {
	return {
		detail: {
			include,
			$body,
			req
		}
	};
}
function incGet$els($src, str, expr, pos) {
	if ($src.nodeType === 1 && !isRenderdInc($src, str)) {
		return [$src];
	}
	let $i = incGet$first($src, str, expr, pos),
		count = 1;
	const $els = [$i];
	while ($i = $i.nextSibling) {
		$els.push($i);
		if ($i[p_isCmd]) {
			count = getIncCount($i, str);
			continue;
		}
		if ($i.nodeType === 8 && $i.textContent === "inc_end") {
			if (--count === 0) {
				return $els;
			}
		}
	}
	throw check(new Error(">>>Tpl inc:incGet$els:02 Not found <!--inc_end-->"), $src);
}
function incGet$first($src, str, expr, pos) {
	if ($src[p_isCmd] && !isRenderdInc($src, str)) {
//console.log(11, $src, str, pos);
		return $src;
	}
	let $i = $src,
		count = 1;
	do {
//console.log(2, $i, str, pos, count);
		if ($i[p_isCmd]) {
			count = getIncCount($i, str, expr, pos);
//console.log(21, $i, str, pos, count);
			continue;
		}
//		if ($i.nodeType === 8 && $i.textContent.indexOf("inc_begin") === 0) {
		if ($i.nodeType === 8 && $i.textContent === "inc_begin") {
			if (--count === 0) {
//console.log(22, $i, str, pos, count);
				return $i;
			}
		}
	} while ($i = $i.previousSibling);
	throw check(new Error(`>>>Tpl inc:incGet$first:01 Not found <!--inc_begin-->: ${str}, ${expr}, ${pos}`), $src);
}
function getIncCount($i, str, expr, pos) {
//todo , expr, pos
	let count = 1;
	const attrIt = getAttrItAfter(descrById.get($i[p_descrId]).attr.keys(), str);
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
	const f = $i.nodeType === 8 && $i.textContent === "inc_end" && "previousSibling" || "nextSibling";
	do {
//		if ($i.nodeType === 1 &&
		if ($i[p_descrId]) {
			break;
		}
	} while ($i = $i[f]);
	if (str) {
		return !!getIdx($i, str);
	}
	for (const n of descrById.get($i[p_descrId]).attr.keys()) {
		if (reqCmd[n].cmdName === incCmdName) {
			return !!getIdx($i, n);
		}
	}
}
export function getIncEvtName(uri, topURL) {
	return {
		incLoad: incLoadEventName + getURL(uri, topURL),
		incMount: incMountEventName + getURL(uri, topURL),
		incRender: incRenderEventName + getURL(uri, topURL),
	};
}
