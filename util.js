/*!
 * myweb/util.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
import {tplProxyTargetPropName} from "./tpl/const.js";

export const spaceRe = /\s+/g;
export const dRe = /\d/g;
export const DRe = /\D/g;
export const trimSlashRe = /(^\/|\/$)/g;

export let idCurVal = 0;
export function getId(i) {
	return i[getId.propName] || (i[getId.propName] = (++idCurVal).toString());
}
getId.propName = Symbol();
self.getId = getId;

export function copy(val) {
	if (val instanceof Array) {
		return val.concat();
	}
	if (val instanceof Object) {
		return Object.assign({}, val);
	}
	return val;
}
/*
export function cmp(a, b, func = (a, b) => a === b) {
	if (a instanceof Object && b instanceof Object) {
		for (const i in a) {//.getOwnPropertyNames()) {
			if (!cmp(a[i], b[i], func)) {
				return false;
			}
		}
		return true;
	}
	return func(a, b);
}*/
export function wrapDeep(obj, func) {
	for (const i in obj) {
		if (obj[i] instanceof Object) {//typeof(obj[i]) == "object") {
			obj[i] = wrapDeep(obj[i], func);
		}
	}
	return func(obj);
}
/*
export function $goDeep($e, func) {
	func($e);
	for ($e = $e.firstChild; $e; $e = $e.nextSibling) {
		$goDeep($e, func);
	}
	return $e;
}*/
export function $goTagsDeep($e, func) {
	func($e);
	if ($e.isCustomHTML) {
		return $e;
	}
	for (let $i = $e.firstElementChild; $i; $i = $i.nextElementSibling) {
		$goTagsDeep($i, func);
	}
	return $e;
}
export function $goCopy($from, $to, func) {
	func($from, $to);
	if ($from.isCustomHTML) {
		return $to;
	}
	const len = $from.children.length;
	for (let i = 0; i < len; i++) {
		$goCopy($from.children[i], $to.children[i], func);
	}
	return $to;
}
export function getMustacheBlocks(text) {
	const textLen = text.length;
	const blocks = [];
	for (let begin = 0, i = 0; i < textLen;) {
		i = text.indexOf("{{", i);
		if (i == -1) {
			blocks.push({
				begin,
				end: textLen
			});
			break;
		}
		let j = text.indexOf("}}", i);
		if (j == -1) {
			blocks.push({
				begin,
				end: textLen
			});
			break;
		}
		while (text.indexOf("}}", j + 1) == j + 1) {
			j++;
		}
		if (i != begin) {
			blocks.push({
				begin,
				end: i
			});
		}
		blocks.push({
			begin: i + 2,
			end: j,
			expr: true
		});
		i = begin = j + 2;
	}
	return blocks;
}
self.getMustacheBlocks = getMustacheBlocks;
/*
export function getLocalNumber(val, fmt) {
	if (!val || typeof(val) != "string") {
		return val;
	}
	val = val.replace(/\s+/g, "");
	if (getLocalNumber.dotSymbol == ".") {
		val = val.replace(/,/g, "");
	} else {
		val = val.replace(/\./g, "");
		val = val.replace(",", ".");
	}
	if (fmt && fmt.scale > 0) {
		const dotIdx = val.indexOf(getLocalNumber.dotSymbol);
		if (dotIdx != -1) {
			val = val.substr(0, dotIdx + fmt.scale + 1);
		}
	}
	return val * 1;
}
//getLocalNumber.locale = "en-Us";
getLocalNumber.dotSymbol = (0.1).toLocaleString(getLocalNumber.locale).indexOf(".") == -1 ? "," : ".";*/
/*
export function formatFunc(val, fmt) {
	if (val === "" || isNaN(val)) {
		return "";
	}
//	return Number(val).toLocaleString(navigator.language, {
	return Number(val).toLocaleString(undefined, {
		maximumFractionDigits: fmt ? fmt.scale : 0//,
//		useGrouping: false
	});
}*/

const normalizeURL_reHost = /^(\w*\:*\/\/+|\/\/+).+?(\/|$)/;
const normalizeURL_reSlash = /\/\/+/g;
const normalizeURL_reUp = /[^\.\/]+\/+\.\.\//g;
const normalizeURL_reThis = /\/\.\//g;
export function normalizeURL(url) {
	url = url.trim();
	if (url.search(normalizeURL_reHost) == 0) {
		return new URL(url).href;
	}
	if (url[0] != "/") {
		const lastSlashIdx = location.pathname.lastIndexOf("/")
		if (lastSlashIdx == location.pathname.length - 1) {
			url = location.pathname + url;
		} else if (lastSlashIdx != -1)  {
			url = location.pathname.substr(0, lastSlashIdx + 1) + url;
		}
	}
	return normalizeURL_get(url);
}
function normalizeURL_get(url) {
	for (let re = [normalizeURL_reSlash, normalizeURL_reUp, normalizeURL_reThis], i = re.length - 1; i > -1; i--) {
//--		while (url.search(re[i]) != -1) {
			url = url.replace(re[i], "/");
//		}
	}
	return url.trim();
}
self.normalizeURL = normalizeURL;

export function getURL(url, topURL) {
//console.log("getURL", url, topURL);
	if (isURI(url)) {
		if (topURL) {
			if (isURI(topURL)) {
				topURL = normalizeURL(topURL);
			}
			let u = normalizeURL_get(url);
			while (u.indexOf(".") == 0) {
				if (u.indexOf("./") == 0) {
					u = u.substr(2);
				} else if (u.indexOf("../") == 0) {
					u = u.substr(3);
				}
			}
//			topURL = topURL.substr(0, topURL.lastIndexOf("/"));
//			u = u.substr(0, u.lastIndexOf("/"));
//console.log(u, topURL);
//			url = topURL.endsWith(u) ? topURL : normalizeURL(topURL + "/" + url);
			url = topURL.endsWith(u) ? topURL : normalizeURL(topURL.substr(0, topURL.lastIndexOf("/") + 1) + url);
		} else {
			url = normalizeURL(url);
		}
	}
	if (url.search(normalizeURL_reHost) == -1) {
		url = location.origin + url;
	}
	return normalizeURL(url);
}
self.getURL = getURL;
export function isURI(url) {
	url = url.trimLeft();
	return url.search(normalizeURL_reHost) == -1 && url[0] != "/";
}

function hideEnum(obj, pName) {
	Object.defineProperty(obj, pName, {
		enumerable: false
	});
}

if (!String.prototype.q) {
	const aRe = /`/g;
	const qRe = /'/g;
	const qqRe = /'/g;

	String.prototype.a = function() {
		return this.replace(aRe, '\\`');
	}
	String.prototype.q = function() {
		return this.replace(qRe, "\\'");
	}
	String.prototype.qq = function() {
		return this.replace(qqRe, '\\"');
	}

	const methods = ["a", "q", "qq"];
	for (const n of methods) {
		Number.prototype[n] = function() {
			return this.toString().qq();
		}
	}
	for (const o of [String.prototype, Number.prototype]) {
		for (const n of methods) {
			hideEnum(o, n);
		}
	}
//} 
/*
	self.LocaleNumber = function(n) {
		if (!this) {
			return new self.LocaleNumber(n);
		}
		this.value = n;
	}
	self.LocaleNumber.prototype = {
		valueOf: function() {
			return Number(this.value);
		},
		toString: function() {
			return Number(this.value).toLocaleString();
		}
	};*/

	String.localeDotSymbol = (0.1).toLocaleString().indexOf(".") == -1 ? "," : ".";
	String.prototype.toNumber = function() {
		const dotIdx = this.lastIndexOf(String.localeDotSymbol);
		return Number(dotIdx == -1 ? this.replace(DRe, "") : this.substr(0, dotIdx).replace(DRe, "")  + "." + this.substr(dotIdx + 1));
	}
	hideEnum(String.prototype, "toNumber");
//if (!String.prototype.json) {
	String.prototype.json = function() {
		try {
			return JSON.parse(this);
		} catch(err) {
			console.error(err);
		}
	}
	hideEnum(String.prototype, "json");

	String.prototype.copyToClipboard = function() {
		const $f = document.createElement("input");
		$f.type = "text";
		$f.contentEditable = true;
		$f.value = this;
		$f.style.position = "absolute";
		$f.style.left = "-1000px";
		document.body.appendChild($f);
		$f.select();
/*
		const range = document.createRange();
		range.selectNodeContents($f);
		const sel = self.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);*/
		$f.setSelectionRange(0, this.length); // A big number, to cover anything that could be inside the element.

		document.execCommand("copy");
		$f.parentNode.removeChild($f);
	}
	hideEnum(String.prototype, "copyToClipboard");
//}
//if (!FormData.prototype[tplProxyTargetPropName]) {
	FormData.prototype[tplProxyTargetPropName] = true;
	Document.prototype[tplProxyTargetPropName] = true;
	DocumentFragment.prototype[tplProxyTargetPropName] = true;
	HTMLElement.prototype[tplProxyTargetPropName] = true;
	Text.prototype[tplProxyTargetPropName] = true;
//}
}
if (!FormData.prototype.toJSON) {
	FormData.prototype.toJSON = function() {
		const obj = {};
		for (const [name, value] of this.entries()) {
			obj[name] = value;
		}
		return obj;
	}
//	hideEnum(FormData.prototype, "toJSON");
}
if (!HTMLFormElement.prototype.toJSON) {
	HTMLFormElement.prototype.toJSON = function() {
		const obj = {};
		const elsLen = this.elements.length;
		for (let i = 0; i < elsLen; i++) {
			obj[this.elements[i].name || this.elements[i].id] = this.elements[i].value;
		}
		return obj;
	}
//	hideEnum(HTMLFormElement.prototype, "toJSON");
}

self.del = function(o, n) {
	const v = o[n];
	delete o[n];
//	const v = Reflect.get(o, n);
//	Reflect.deleteProperty(o, n);
	return v;
}
