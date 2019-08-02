import {incCmdName, scopeCmdName, orderCmdName, incValAttrName} from "../const.js";
import {/*getId, */copy, normalizeURL, getURL, isURI/*, $goTagsDeep*/, spaceRe} from "../../util.js";
import createArrFragment from "../../arrfr.js";
import {getForKeyName} from "./for.js";

export const inc_cache = new Map();
self.ii = inc_cache;
const inc_waitingStack = new Map();

const inc_loadEventName = "inc_load";
const inc_mountEventName = "inc_mount";

const inc_url_on_this_fileStr = "inc_url_on_this_file";
const inc_load_on_this_fileStr = "inc_load_on_this_file";
const inc_mount_on_this_fileStr = "inc_mount_on_this_file";

const inc_url_on_this_fileRe = new RegExp(inc_url_on_this_fileStr, "g");
const inc_load_on_this_fileRe = new RegExp(inc_load_on_this_fileStr, "g");
const inc_mount_on_this_fileRe = new RegExp(inc_mount_on_this_fileStr, "g");

if (!self.isDynamicImportSupport) {
	try {
		new Function('import("")');
		self.isDynamicImportSupport = true;
	} catch (err) {
		console.error("Don't support dynamic import");
	}
}
self.isOldEdge = navigator.userAgent.search("Edge/1\\d+\\.") != -1;

export default {
	render: function(req) {
		const include = inc_get.call(this, req);
//console.log(include.url);
		if (!include) {
			return {
				isLast: true				
			};
		}
		const oldVal = getIncVal(req.$src, req.str);
		if (oldVal && oldVal == include.url) {
//		if (include.readyState == "complete") {
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
		const $els = inc_get$els.call(this, req.$src, req.str);
//		const $elsLen = $els.length;
		const $e = $els[$els.length - 1];
/*--
		const d = this.get$srcDescr(req.$src);
		if (d && d.inc_url && d.inc_url[req.str]) {
alert(req.str);
			delete d.inc_url[req.str];
		}*/
//!!зачем удалять старое значение?
//- нужно уджалить для того что бы inc_get$els смогла правильно отработать
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
					self.dispatchEvent(new CustomEvent(inc_loadEventName + include.url, ep));
					self.dispatchEvent(new CustomEvent(inc_loadEventName, ep));
//!!include.wait не понятно зачем, если есть возможнатсь делать обычный import
					if (include.wait) {
						include.wait.then(() => {
							inc_loadInc.call(this, include);
						});
					} else {
						inc_loadInc.call(this, include);
					}
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
		const $els = inc_get$els.call(this, req.$src, req.str);
		const $elsLen = $els.length;
		for (let i = 0; i < $elsLen; i++) {
			const $i = $els[i];
			if ($i instanceof HTMLElement) {
				const d = this.get$srcDescr($i);
//1				d.inc_oldVal = include;
//				d.inc_renderedByStr = req.str;
				if (!d.inc_url) {
					d.inc_url = {};
				}
				d.tpl_url = d.inc_url[req.str] = include.url;
				this.linker($i, req.scope, this.getAttrsAfter(this.getAttrs($i), req.str), include.url);
			}
		}
//todo может быть нужно запускать событие поле того как всё что рендерится будет готово?
		inc_dispatchMountEvent.call(this, req, include, createArrFragment($els));
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
//	let u = url;
//	url = getURL(url, isURI(url) ? this.getTopURLBy$src(req.$src, req.str) : undefined);
	url = getURL(url, this.getTopURLBy$src(req.$src, req.str));
//console.log("==", u, url, this.getTopURLBy$src(req.$src, req.str));
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
		include.$tags.push(...$scripts);
		return inc_createScripts.call(this, req, include, $scripts)
			.then(() => createFragmentByWrap(include, $wrap));
	}
	return createFragmentByWrap(include, $wrap);
}
function inc_createScripts(req, include, $scripts) {
	const scripts = [];
	for (const $i of $scripts) {
		scripts.push(inc_createScript.call(this, req, include, $i));
	}
	return Promise.all(scripts)
		.then(scripts => {
			const scriptsLen = scripts.length;
			for (let i = 0; i < scriptsLen; i++) {
				if (!inc_runScript.call(this, req, scripts[i].text, scripts[i].url, scripts[i].$e)) {
					break;
				}
			}
		});
}
function inc_createScript(req, include, $e) {
	const uri = $e.getAttribute("src");
	if (!uri) {
		return {
			text: ($e.textContent = prepareScriptText(include, $e.textContent, include.url)),
			$e
		};
	}
	const url = getURL(uri, include.url);
	if ($e.type == "module") {
//		return import(url);
		try {
			return eval("import(\"" + url.qq() + "\")");
		} catch (err) {
			this.check(err, req);
			return;
		}
	}
	if (uri != url) {
		$e.setAttribute("src", url);
	}
	return new Promise((resolve) => {//, reject) => {
		fetch(url)
			.then(res => {
				if (res.ok) {
					return res.text();
				}
				this.check(new Error(">>>Tpl inc:inc_createScripts:01: Request stat " + res.status), req);
			})
			.then(text => {
				resolve({
					text: prepareScriptText(include, text, url),
					url: $e.src,
					$e
				});
			});
	});
}
function prepareScriptText(include, text, url) {
	return text
		.replace(inc_url_on_this_fileRe, '"' + url.qq() + '"')
		.replace(inc_load_on_this_fileRe, '"' + (inc_loadEventName + include.url).qq() + '"')
		.replace(inc_mount_on_this_fileRe, '"' + (inc_mountEventName + include.url).qq() + '"');
}
function inc_runScript(req, text, url, $e) {
	try {
		new Function(text).call($e);
		return true;
	} catch (err) {
		if (url) {
			this.check(err, req, url, err.lineNumber, err.columnNumber);
		} else if ($e && $e.getLineNo) {
			const line = $e.getLineNo();
			const numIdx = line.lastIndexOf(":");
			this.check(err, req, self.location.origin + normalizeURL(line.substr(0, numIdx)), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
		} else {
			this.check(err, req);
		}
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
//	if ($fr.lastChild instanceof Text) {
//		$fr.appendChild(document.createComment("inc_end" + include.url));
//	}
//	for (let i = include.$tags.length - 1; i > -1; i--) {
//		include.$tags[i].parentNode.removeChild
//	}
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
	let $els = inc_get$els.call(this, req.$src, req.str);
	let $elsLen = $els.length;
//console.log(11111000, req.str, $els);
	const $new = inc_cloneFragment.call(this, req, include);
	const $parent = $els[0].parentNode;
	const $lastNext = $els[$elsLen - 1].nextSibling;
	if (!$lastNext || !($lastNext instanceof Comment) || $lastNext.textContent.indexOf("inc_end") != 0) {
		const str = inc_getStr.call(this, this.getAttrs(req.$src));
		$new.insertBefore(document.createComment("inc_begin" + str), $new.firstChild);
		$new.appendChild(document.createComment("inc_end" + str));
	}
	const stack = inc_waitingStack.get(include.url);
	for (let i = 0; i < $elsLen; i++) {
		if (stack) {
			stack.delete($els[i]); //для того чтобы: когда динамическая вставка имеет несколько елементов в корне -> в списке асинхронного рендероа находятся все элементы
		}
		this.removeAllOnRenderStack($els[i]);
		this.removeChild($els[i]);
	}

	$els = Array.from($new.childNodes);
	$elsLen = $els.length;
//console.log(11111, req.str, $els);
	this.insertBefore($parent, $new, $lastNext);
	let $e = $els[0], $next;
	while ($e) {
		if ($e instanceof HTMLElement) {
//console.log(123, req, $e, $newEls, this.getAttrsAfter(this.getAttrs($e), req.str));
			$e = this.renderTag($e, req.scope, this.getAttrsAfter(this.getAttrs($e), req.str));
		} else if ($e instanceof Text) {
			$e = this.renderText($e, req.scope);
		}
		$next = $e.nextSibling;
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
//todo можетабытьанужно запускать событие поле того как всё что рендеритсяабудетаготово?
	inc_dispatchMountEvent.call(this, req, include, createArrFragment($els));
//alert(1);
	return $e;
}
function inc_included(req, include) {
	const $els = inc_get$els.call(this, req.$src, req.str);
	const $elsLen = $els.length;
	const $lastNext = $els[$elsLen - 1].nextSibling;
	let $e = $els[0], $next;
	while ($e) {
		if ($e instanceof HTMLElement) {
			$e = this.renderTag($e, req.scope, this.getAttrsAfter(this.getAttrs($e), req.str));
//--		} else if ($e instanceof Text) {
//			$e = this.renderText($e, req.scope);
		}
		$next = $e.nextSibling;
		if (!$next || $next == $lastNext) {
			break;
		}
		$e = $next;
	}
	if (!req.$src.inc_isMounted) {
//todo можетабытьанужно запускать событие поле того как всё что рендеритсяабудетаготово?
		inc_dispatchMountEvent.call(this, req, include, createArrFragment($els));
	}
	return $e;
}
export function inc_get$els($e, str) {
	const d = this.get$srcDescr($e);
//	if (!d.inc_url) {
//		return [$e];
//	}
/*
	const oldVal = getIncVal($e, str);
//console.log(oldVal, $e, str);
	if (!oldVal) {
		return [$e];
	}*/
	if (!inc_isRenderdInc.call(this, $e)) {
		return [$e];
	}
	str = inc_getStr.call(this, d.attr);

	const $els = [];
	for (let $i = $e; $i; $i = $i.previousSibling) {
		$els.push($i);
		if ($i instanceof Comment && $i.textContent == "inc_begin" + str) {
			break;
		}
	}
	$els.reverse();
	for (let $i = $e.nextSibling; $i; $i = $i.nextSibling) {
		$els.push($i);
		if ($i instanceof Comment && $i.textContent == "inc_end" + str) {
			break;
		}
	}
//console.log(11111, $els);
	return $els;
}
export function inc_isInc($e) {
	for (const n of this.getAttrs($e).keys()) {
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
function inc_getStr(attr) {
return "";
/*
//if (!str) {
	for (const n of attr.keys()) {
		const [cmdName] = this.getCmdArgs(n);
		if (cmdName == incCmdName) {
			return n;
		}
	}
//}*/
}
function inc_cloneFragment(req, include) {
	const $fr = include.$fr.cloneNode(true);
//		const str = inc_getStr.call(this, this.getAttrs(req.$src));
//		$fr.insertBefore(document.createComment("inc_begin" + str), $fr.firstChild);
//		$fr.appendChild(document.createComment("inc_end" + str));
	makeSlots(req, $fr);

	const d = this.get$srcDescr(req.$src);
	if (!d.inc_url) {
		d.inc_url = {};
	}
	d.inc_url[req.str] = include.url;

	let descr = include.descrById.get(d.id);
	if (!descr) {
		include.descrById.set(d.id, descr = []);
	}
/*
	const $srcAttr = this.getAttrsBefore(d.attr, req.str);
	$srcAttr.set(req.str, req.expr);
	$srcAttr.set(orderCmdName, Array.from($srcAttr.keys()).join(" "));
	for (const [n, v] of $srcAttr) {
		if (d.attr.has(getIncValName(n))) {
			$srcAttr.set(getIncValName(n), d.attr.get(getIncValName(n)));
		} else if (d.attr.has(getForKeyName(n))) {
			$srcAttr.set(getForKeyName(n), d.attr.get(getForKeyName(n)));
		}
	}
	if (d.attr.has(scopeCmdName) && !$srcAttr.has(scopeCmdName)) {
		$srcAttr.set(scopeCmdName, d.attr.get(scopeCmdName));
	}
	const $srcOrder = $srcAttr.get(orderCmdName);// || Array.from($srcAttr.keys()).join(" ");*/
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

		for (const [n, v] of $srcAttr) {
			if (!$i.getAttribute(n)) {
//todo атрибут нелльзя создать, если в нем есть некорректные символы
				$i.setAttribute(n, v);
			}
		}
//console.log(44, $i, getIncValName(req.str));
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
////		const newD = this.get$srcDescr($i);
//		newD.inc_oldVal = include;
//		newD.inc_renderedByStr = req.str;
		newD.inc_url = d.inc_url;
		newD.tpl_url = include.url;
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
function inc_dispatchMountEvent(req, include, $body) {
	const ep = {
		detail: {
			tpl: this,
			include,
			$body
		}
	};
	self.dispatchEvent(new CustomEvent(inc_mountEventName + include.url, ep));
	self.dispatchEvent(new CustomEvent(inc_mountEventName, ep));
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
export function getIncENV(incURL, importURL) {
	incURL = getURL(incURL, importURL);
	return {
		inc_url_on_this_file: incURL,
		inc_load_on_this_file: inc_loadEventName + incURL,
		inc_mount_on_this_file: inc_mountEventName + incURL
	};
}
