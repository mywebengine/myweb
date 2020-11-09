import {oset} from "./util.js";

const trimSlashRe = /(^\/|\/$)/g;

const reHost = /^(\w+\:\/\/|\/\/)/;//.+?(\/|$)/;
const reSlash = /\/\/+/g;
const reUp = /[^\.\/]+\/+\.\.\//g;
const reThis = /\/\.\//g;

export function getLoc(url, defPageName = "") {
	url = new URL(url);
	const loc = parsePath(url.href, url.pathname, defPageName);
	loc.hash = parsePath(url.hash, url.hash.substr(1), defPageName);
	for (const [n, v] of url.searchParams) {
		loc.query[n] = v;
	}
	return loc;
}
export function setLoc(url) {
	oset(self, "loc", getLoc(url));
}
self.getLoc = getLoc;
self.setLoc = setLoc;

function parsePath(href, path, defPageName) {
	const args = path.replace(trimSlashRe, "").split("/"),
		loc = type_loc(href, path, args[0] || defPageName, args);
	for (let i = args.length - 1; i > 0; i -= 2) {
		loc.param[args[i - 1]] = decodeURIComponent(args[i]);
	}
	return loc;
}
function type_loc(href, path, name, args) {
	return {
		href,
		path,
		name,
		args,
		param: {},
		query: {}
	};
}

export function normalizeURL(url) {
	url = url.trim();
//	if (url.search(reHost) === 0) {
//		return new URL(url).href;
//	}
//	if (url[0] !== "/") {
//	if (url.search(reHost) !== 0 && url[0] !== "/") {
	if (isURI(url)) {
		const lastSlashIdx = location.pathname.lastIndexOf("/");
		if (lastSlashIdx === location.pathname.length - 1) {
			url = location.pathname + url;
		} else if (lastSlashIdx !== -1)  {
			url = location.pathname.substr(0, lastSlashIdx + 1) + url;
		}
	}
	return normalizeURL_get(url);
}
self.normalizeURL = normalizeURL;
function normalizeURL_get(url) {
	if (url.search(reHost) !== -1) {
		const i = url.indexOf("//");
		url = url.substr(0, i + 1) + url.substr(i + 1).replace(reSlash, "/");
	} else {
		url = url.replace(reSlash, "/");
	}
	for (let re = [/*reSlash, */reUp, reThis], i = re.length - 1; i > -1; i--) {
//--		while (url.search(re[i]) !== -1) {
			url = url.replace(re[i], "/");
//		}
	}
	return url;//.trim();
}
//self.normalizeURL = normalizeURL;

export function getURL(url, topURL) {
//console.log("getURL", url, topURL, isURI(url));
	if (isURI(url)) {
		if (topURL) {
			if (isURI(topURL)) {
				topURL = normalizeURL(topURL);
			}
			let u = normalizeURL_get(url.trim());
			while (u.indexOf(".") === 0) {
				if (u.indexOf("./") === 0) {
					u = u.substr(2);
				} else if (u.indexOf("../") === 0) {
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
	if (url.search(reHost) === -1) {
		url = location.origin + url;
	}
	return normalizeURL(url);
}
self.getURL = getURL;

export function isURI(url) {
	url = url.trimLeft();
	return url.search(reHost) !== 0 && url[0] !== "/";
}
