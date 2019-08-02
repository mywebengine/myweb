/*!
 * myweb/util.js v1.0.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 */
import {tplProxyTargetPropName} from "./tpl/const.js";

export const spaceRe = /\s+/g;

export function getId(i) {
	return i[getId.propName] || (i[getId.propName] = (++getId.curVal).toString());
}
getId.propName = Symbol();
getId.curVal = 0;

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
	for ($e = $e.firstElementChild; $e; $e = $e.nextElementSibling) {
		$goTagsDeep($e, func);
	}
	return $e;
}
export function $goCopy($from, $to, func) {
//console.log($from, $to);
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
/*--
export function $goClone($from, $to, func) {
	const $p = func($from, $to);
	for ($from = $from.firstChild; $from; $from = $from.nextSibling) {
		$goClone($from, $p, func);
	}
	return $to;
}*/

export function get$first($e, isCmpFunc, p) {
	for (let $i = $e.previousElementSibling; $i && isCmpFunc($i, p); $i = $i.previousElementSibling) {
		$e = $i;
	}
	return $e;
}
export function get$eIdx($e) {
	let i = 0;
	for (let $i = $e.parentNode.firstChild; $i != $e; $i = $i.nextSibling) {
		i++;
	}
	return i;
}
/*--
export function stm(f, delay) {
	setTimeout(f, delay);
}*/

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
getLocalNumber.dotSymbol = (0.1).toLocaleString(getLocalNumber.locale).indexOf(".") == -1 ? "," : ".";
export function formatFunc(val, fmt) {
	if (val === "" || isNaN(val)) {
		return "";
	}
	return Number(val).toLocaleString(getLocalNumber.locale, {
		maximumFractionDigits: fmt ? fmt.scale : 0//,
//		useGrouping: false
	});
}

export function normalizeURL(url) {
	url = url.trim();
	if (url.search(normalizeURL.reHost) == 0) {
		return new URL(url).href;
	}
	if (url[0] != "/") {
		const lastSlashIdx = self.location.pathname.lastIndexOf("/")
		if (lastSlashIdx == self.location.pathname.length - 1) {
			url = self.location.pathname + url;
		} else if (lastSlashIdx != -1)  {
			url = self.location.pathname.substr(0, lastSlashIdx + 1) + url;
		}
	}
	return normalizeURL.getBase(url);
}
normalizeURL.getBase = function(url) {
	for (let re = [normalizeURL.reUp, normalizeURL.reThis], i = re.length - 1; i > -1; i--) {
		while (url.search(re[i]) != -1) {
			url = url.replace(re[i], "/");
		}
	}
	return url.replace(normalizeURL.reSlash, "/").trim();
}
normalizeURL.reHost = /^(https*:\/\/|ws:\/\/|\/\/).+?(\/|$)/;
normalizeURL.reSlash = /\/\/+/g;
normalizeURL.reUp = /[^\.\/]+\/+\.\.\//;
normalizeURL.reThis = /\/\.\//;
self.normalizeURL = normalizeURL;

export function getURL(url, topURL) {
//console.log("getURL", url, topURL);
	if (isURI(url)) {
		if (topURL) {
			if (isURI(topURL)) {
				topURL = normalizeURL(topURL);
			}
			let u = normalizeURL.getBase(url);
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
	if (url.search(normalizeURL.reHost) == -1) {
		url = self.location.origin + url;
	}
	return normalizeURL(url);
}
self.getURL = getURL;
export function isURI(url) {
	url = url.trimLeft();
	return url.search(normalizeURL.reHost) == -1 && url[0] != "/";
}

export function getLoc(url, defPageName = "") {
	url = url.trim();
	url = (url.indexOf("#") == 0 ? url.substr(1) : url.replace(normalizeURL.reHost, "")).replace(getLoc.reTrimSlash, "");
	const loc = {
		url,
		args: url.split("/"),
		param: {}
	};
	loc.name = loc.args[0] || defPageName;
	for (let i = 1, len = loc.args.length; i < len; i += 2) {
		loc.param[loc.args[i]] = loc.args[i + 1];
	}
	return loc;
}
getLoc.reTrimSlash = /(^\/|\/$)/g;

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
		$f.value = text;
		$f.style.position = "absolute";
		$f.style.left = "-1000px";
		document.body.appendChild($f);
		$f.select();
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
//if (!FormData.prototype.toJSON) {
	FormData.prototype.toJSON = function() {
		const obj = {};
		for (const [name, value] of this) {
			obj[name] = value;
		}
		return obj;
	}
//	hideEnum(FormData.prototype, "toJSON");
}
