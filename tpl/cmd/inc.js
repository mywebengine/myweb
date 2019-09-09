import {incCmdName, scopeCmdName, orderCmdName, incValAttrName} from "../const.js";
import {/*getId, */copy, normalizeURL, getURL, isURI/*, $goTagsDeep*/, spaceRe} from "../../util.js";
import createArrFragment from "../../arrfr.js";

import pimport from "../../pimport.js";

export const inc_cache = new Map();
self.ii = inc_cache;
const inc_waitingStack = new Map();

const inc_loadEventName = "inc_load";
const inc_mountEventName = "inc_mount";
const inc_renderEventName = "inc_render";

self.isOldEdge = navigator.userAgent.search("Edge/1\\d+\\.") != -1;

export default {
	render: function(req) {
		const include = inc_get.call(this, req);
		if (!include) {
			return {
				isLast: true				
			};
		}
		const oldVal = getIncVal(req.$src, req.str);
		if (oldVal && oldVal == include.url) {
			return {
				$e: inc_included.call(this, req, include),
				isLast: true
			};
		}
		if (include.readyState == "complete") {
			return {
				$e: inc_include.call(this, req, include),
				isLast: true
			};
		}
		const $e = inc_getLastElement.call(this, req.$src)
//!!зачем удалять старое значение?
//- нужно ужалить для того что бы inc_get$els смогла правильно отработать
// - хотя, если удалить этот атрибут то inc_isRenderdInc вернет ложь, а это означает, что $els будет из одного тега - а это не врено
/*
		const attr = this.getAttrs(req.$src);
		const attrsAfter = this.getAttrsAfter(attr, req.str);
		for (const n of attrsAfter.keys()) {
			const [cmdName] = this.getCmdArgs(n);
			if (cmdName == incCmdName) {
				attr.delete(getIncValName(n));
//				req.$src.removeAttribute(getIncValName(n));
			}
		}*/

		req.scope = copy(req.scope);
		if (inc_waitingStack.has(include.url)) {
			inc_waitingStack.get(include.url).set(req.$src, req);
			return {
				$e,
				isLast: true
			};
		}
		inc_waitingStack.set(include.url, new Map([[req.$src, req]]));
		fetch(include.url)
			.then(res => {
				if (res.ok) {
					return res.text();
				}
				const err = new Error(">>>Tpl inc:render:01: Request " + include.url + " stat " + res.status);
				err.url = include.url;
				err.status = res.status;
				this.check(err, req);
			})
			.then(html => inc_createFragment.call(this, req, include, html))
			.then($fr => {
				include.$fr = $fr;
//				if (include.readyState != "loaded") {
					include.readyState = "loaded";
					const ep = {
						detail: {
							tpl: this,
							include
						}
					};
					dispatchEvent(inc_loadEventName + include.url, include);
					dispatchEvent(inc_loadEventName, include);
					inc_loadInc.call(this, include);
//				}
			});
		return {
			$e,
			isLast: true
		};
	},
	linker(req) {
		const include = inc_get.call(this, req);
		if (!include) {
			return {
				isLast: true				
			};
		}
		const $els = inc_get$els.call(this, req.$src);
		const $elsLen = $els.length;
		for (let i = 0; i < $elsLen; i++) {
			const $i = $els[i];
			if ($i instanceof HTMLElement) {
				this.linker($i, req.scope, this.getAttrsAfter(this.getAttrs($i), req.str));
			}
		}
//todo может быть нужно запускать событие поле того как всё что рендерится будет готово?
		const $body = createArrFragment($els);
		dispatchMountEvent(include, $body);
		dispatchEvent(inc_renderEventName + include.url, include, $body);
		return {
			$e: $els[$elsLen - 1],
			isLast: true
		};
	}
};
function inc_get(req) {
	let url = req.args[0] ? req.expr : this.eval(req);
	if (!url) {
		return;
	}
	url = getURL(url, this.getTopURLBy$src(req.$src));
	let include = inc_cache.get(url);
	if (!include) {
		inc_cache.set(url, include = {
			readyState: "loading",
			url,
			descrById: new Map()
		});
	}
	return include;
}
function inc_loadInc(include) {
//	if (inc_waitingStack.has(include.url)) {
		for (const req of inc_waitingStack.get(include.url).values()) {
			inc_include.call(this, req, include);
		}
		inc_waitingStack.delete(include.url);
//	}
	include.readyState = "complete";
}
function inc_createFragment(req, include, html) {
//self.isOldEdge = true;
	if (self.isOldEdge) {
		for (let m; m = /((<link\s[^\>]*?)href\=)/.exec(html);) {
			html = html.replace(m[1], m[2] + "_ref=");
		}
	}
	const $wrap = document.createElement("div");
	$wrap.innerHTML = html;

	if (self.markLines) {
		self.markLines.mark({
			url: include.url,
			html
		}, {
			children: $wrap.children
		});
	}

	include.$tags = [];
	const hrefAttrName = self.isOldEdge ? "_ref" : "href";
	for (const $i of $wrap.querySelectorAll("link[rel]")) {
		const uri = $i.getAttribute(hrefAttrName);
		if (uri) {
			const url = getURL(uri, include.url);
			if (self.isOldEdge || uri != url) {
				$i.setAttribute("href", url);
			}
		}
		include.$tags.push($i);
	}
	include.$tags.push(...$wrap.querySelectorAll("style"));
	const $scripts = $wrap.querySelectorAll("script");
	if ($scripts.length) {
		return inc_createScripts.call(this, req, include, $scripts)
			.then(() => createFragmentByWrap(include, $wrap));
	}
	return createFragmentByWrap(include, $wrap);
}
function inc_createScripts(req, include, $scripts) {
	include.$tags.push(...$scripts);
	const scripts = [];
	for (const $i of $scripts) {
		scripts.push(inc_createScript.call(this, req, include, $i));
	}
	return Promise.all(scripts);
}
function inc_createScript(req, include, $e) {
	const origURL = $e.getAttribute("src");
	const url = origURL ? getURL(origURL, include.url) : undefined;
	if (url && url != origURL) {
		$e.setAttribute("src", url);
	}
	if ($e.type == "module") {
		if (url) {
			return pimport(url)
				.catch(err => {
					inc_check.call(this, err, req, $e, url);
				});
		}
		const uurl = URL.createObjectURL(new Blob([$e.textContent], {
			type: "text/javascript"
		}));
		return pimport(uurl)
			.catch(inc_check.bind(this, req, $e))
			.then(() => {
				if (!self.debug) {
					URL.revokeObjectURL(uurl);
				}
			});
	}
	if (!url) {
		inc_runScript.call(this, req, $e.textContent, $e, url);
		return;
	}
	return fetch(url)
		.then(res => {
			if (res.ok) {
				return res.text();
			}
			this.check(new Error(">>>Tpl inc:inc_createScripts:01: Request stat " + res.status), req);
		})
		.then(text => {
			inc_runScript.call(this, req, text, $e, url);
		});
}
function inc_runScript(req, text, $e, url) {
	try {
		new Function(text).call($e);
	} catch (err) {
		inc_check.call(this, err, req, $e, url);
	}
}
function inc_check(err, req, $e, url) {
	if (url) {
		this.check(err, req, url, err.lineNumber, err.columnNumber);
	} else if ($e && $e.getLineNo) {
		const line = $e.getLineNo();
		const numIdx = line.lastIndexOf(":");
		this.check(err, req, location.origin + normalizeURL(line.substr(0, numIdx)), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
	} else {
		this.check(err, req);
	}
}
function createFragmentByWrap(include, $wrap) {
	appendHeadTags(include);
	joinText($wrap);
	const $fr = document.createDocumentFragment();
	let $i;
	while ($i = $wrap.firstChild) {
		$fr.appendChild($i);
	}
	return $fr;
}
function appendHeadTags(include) {
	if (!include.$tags.length || include.$tags[0].parentNode == document.head) {
		return;
	}
	for (const $i of include.$tags) {
//!! add
		document.head.appendChild($i);
	}
}
function joinText($src) {
	for (let $e = $src.firstChild, $next; $e; $e = $e.nextSibling) {
		while ($e instanceof Text && ($next = $e.nextSibling) instanceof Text) {
			$e.textContent += $src.removeChild($next).textContent;
		}
	}
}
function inc_include(req, include) {
	let $els = inc_get$els.call(this, req.$src);
	let $elsLen = $els.length;
	const $new = inc_cloneFragment.call(this, req, include);
	const $parent = $els[0].parentNode;
	const $lastNext = $els[$elsLen - 1].nextSibling;
	if (!($lastNext && $lastNext instanceof Comment && $lastNext.textContent == "inc_end")) {
		$new.insertBefore(document.createComment("inc_begin"), $new.firstChild);
		$new.appendChild(document.createComment("inc_end"));
	}
	const stack = inc_waitingStack.get(include.url);
	for (let i = 0; i < $elsLen; i++) {
		if (stack) {
			stack.delete($els[i]);//для того чтобы: когда динамическая вставка имеет несколько элементов в корне -> в списке асинхронного рендероа находятся все элементы
		}
		this.removeChild($els[i]);
	}
	$els = Array.from($new.childNodes);
	$elsLen = $els.length;
	this.insertBefore($parent, $new, $lastNext);
	let $e = $els[0];
	while ($e) {
		if ($e instanceof HTMLElement) {
			$e = this.renderTag($e, req.scope, this.getAttrsAfter(this.getAttrs($e), req.str));
		} else if ($e instanceof Text) {
			$e = this.renderText($e, req.scope);
		}
		const $next = $e.nextSibling;
		if (!$next || $next == $lastNext) {
			break;
		}
		$e = $next;
	}
//console.log("exit", req, $e);
//?? - поидеи это бы делать в hide и рвссылать события hide вглубь
//	if (d.inc_oldVal) {
//		for (const $i of d.inc_oldVal.$tags) {
//			$i.parentNode.removeChild($i);
//		}
//	}
//todo может быть нужно запускать событие поле того как всё что рендерится будет готово?
	const $body = createArrFragment($els);
	dispatchMountEvent(include, $body);
	dispatchEvent(inc_renderEventName + include.url, include, $body);
	return $e;
}
function inc_included(req, include) {
	const $els = inc_get$els.call(this, req.$src);
	const $elsLen = $els.length;
	const $lastNext = $els[$elsLen - 1].nextSibling;
	let $e = $els[0];
	while ($e) {
		if ($e instanceof HTMLElement) {
			$e = this.renderTag($e, req.scope, this.getAttrsAfter(this.getAttrs($e), req.str));
//--		} else if ($e instanceof Text) {
//			$e = this.renderText($e, req.scope);
		}
		const $next = $e.nextSibling;
		if (!$next || $next == $lastNext) {
			break;
		}
		$e = $next;
	}
	const $body = createArrFragment($els);
	if (!req.$src.inc_isMounted) {
//todo может быть нужно запускать событие поле того как всё что рендерится будет готово?
		dispatchMountEvent(include, $body);
	}
	dispatchEvent(inc_renderEventName + include.url, include, $body);
	return $e;
}
export function inc_get$els($e) {
	const d = this.get$srcDescr($e);
	if (!inc_isRenderdInc.call(this, $e)) {
		return [$e];
	}
	const $els = [];
	for (let $i = $e; $i; $i = $i.previousSibling) {
		$els.push($i);
		if ($i instanceof Comment && $i.textContent == "inc_begin") {
			break;
		}
	}
	$els.reverse();
	for (let $i = $e.nextSibling; $i; $i = $i.nextSibling) {
		$els.push($i);
		if ($i instanceof Comment && $i.textContent == "inc_end") {
			break;
		}
	}
	return $els;
}
export function inc_getFirstElement($e) {
	const $els = inc_get$els.call(this, $e);
	const $elsLen = $els.length;
	for (let i = 0; i < $elsLen; i++) {
		if ($els[i] instanceof HTMLElement) {
			return $els[i];
		}
	}
}
export function inc_getLastElement($e) {
	const $els = inc_get$els.call(this, $e);
	const $elsLen = $els.length;
	for (let i = $elsLen - 1; i > -1; i--) {
		if ($els[i] instanceof HTMLElement) {
			return $els[i];
		}
	}
}
export function inc_isInc($e, afterAttrName) {
	const attr = this.getAttrs($e);
	for (const n of (afterAttrName ? this.getAttrsAfter(attr, afterAttrName) : attr).keys()) {
		const [cmdName] = this.getCmdArgs(n);
		if (cmdName == incCmdName) {
			return true;
		}
	}
}
export function inc_isRenderdInc($e) {
	const attr = this.getAttrs($e);
	for (const n of attr.keys()) {
		const [cmdName] = this.getCmdArgs(n);
		if (cmdName == incCmdName && attr.has(getIncValName(n))) {
			return true;
		}
	}
}
function inc_cloneFragment(req, include) {
	const $fr = include.$fr.cloneNode(true);
	makeSlots(req, $fr);
	const d = this.get$srcDescr(req.$src);
	let descr = include.descrById.get(d.id);
	if (!descr) {
		include.descrById.set(d.id, descr = []);
	}
	const $srcAttr = d.attr;
	const $srcOrder = $srcAttr.get(orderCmdName) || Array.from($srcAttr.keys()).join(" ");
	const $srcScope = $srcAttr.get(scopeCmdName) || "";
	for (let $i = $fr.firstElementChild, i = 0, iOrder, iScope; $i; $i = $i.nextElementSibling, i++) {
		if (iOrder = $i.getAttribute(orderCmdName)) {
			iOrder = $srcOrder + " " + iOrder;
		} else {
			iOrder = $srcOrder;
			const iAttrsLen = $i.attributes.length;
			for (let j = 0; j < iAttrsLen; j++) {
				iOrder += " " + $i.attributes.item(j).name;
			}
		}
		if (iOrder = iOrder.trim()) {
			$i.setAttribute(orderCmdName, Array.from(new Set(iOrder.split(spaceRe))).join(" "));
		}

		if (iScope = $i.getAttribute(scopeCmdName)) {
			iScope = $srcScope + " " + iScope;
		} else {
			iScope = $srcScope;
		}
		if (iScope = iScope.trim()) {
			$i.setAttribute(scopeCmdName, Array.from(new Set(iScope.split(spaceRe))).join(" "));
		}

//		for (const [n, v] of $srcAttr) {
//			if (!$i.getAttribute(n)) {
//				$i.setAttribute(n, v);
//			}
//		}
		for (const a of req.$src.attributes) {
			if (!$i.getAttribute(a.name)) {
				$i.setAttribute(a.name, a.value);
			}
		}
		$i.setAttribute(getIncValName(req.str), include.url);
/*
		$goTagsDeep($i, $i => {
			if (!descr[idx]) {
				descr[idx] = this.createTagDescr($i);
			}
			this.setDescrWithVars(d, $i, descr[idx].id);
//console.log("deep", $j, descr[idx].id);
			idx++;
		});*/
		if (!descr[i]) {
			descr[i] = this.createTagDescr($i);
		}
		const newD = descr[i];
		this.setDescrWithVars(d, $i, newD.id);
//!!for
		newD.for_oldLastVal = d.for_oldLastVal;
	}
	return $fr;
}
function makeSlots(req, $e) {
	const $slots = $e.querySelectorAll("slot[name]");
	const $slotsLen = $slots.length;
	const $toFree = $e.firstElementChild || $e;
	if (!$slotsLen) {
		for (let $i = req.$src; $i = req.$src.firstChild;) {
			$toFree.appendChild($i);
		}
		return;
	}
//!!for Edge
	for (let i = 0; i < $slotsLen; i++) {
		const $s = $slots[i];
		if (!$s.name) {
			$s.name = $s.getAttribute('name');
		}
	}
	for (let $i = req.$src; $i = req.$src.firstChild;) {
		if ($i instanceof HTMLElement) {
//!!for Edge
			if (!$i.slot) {
				const name = $i.getAttribute('slot');
				if (name) {
					$i.slot = name;
				}
			}
			if ($i.slot) {
				let f;
				for (let i = 0; i < $slotsLen; i++) {
					const $s = $slots[i];
					if ($i.slot == $s.name) {
						$s.appendChild($i);
						f = true;
						break;
					}
				}
				if (f) {
					continue;
				}
			}
		}
		$toFree.appendChild($i);
	}
}
function dispatchEvent(evtName, include, $body) {
	const ep = {
		detail: {
			tpl: this,
			include,
			$body
		}
	};
	self.dispatchEvent(new CustomEvent(evtName, ep));
}
function dispatchMountEvent(include, $body) {
	dispatchEvent(inc_mountEventName + include.url, include, $body);
	dispatchEvent(inc_mountEventName, include, $body);
	const $first = $body.firstElementChild;
	if ($first) {
		$first.inc_isMounted = true;
	}
}
function getIncValName(str) {
	return incValAttrName + "_" + str;
}
export function getIncVal($e, str) {
	return $e.getAttribute(getIncValName(str));
}
export function getIncEventName(uri, topURL) {
	return {
		inc_load: inc_loadEventName + getURL(uri, topURL),
		inc_mount: inc_mountEventName + getURL(uri, topURL),
		inc_render: inc_renderEventName + getURL(uri, topURL),
	};
}
