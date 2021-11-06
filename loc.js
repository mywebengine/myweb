import {oset} from "./util.js";

const trimSlashRe = /(^\/|\/$)/g;

const reHost = /^(\w+\:\/\/|\/\/)/;//.+?(\/|$)/;
const reSlash = /\/\/+/;
const reUp = /[^\/]+\/+\.\.\//;
const reThis = /\/+\.\//;

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
export function getUrl(url, topUrl = location.href) {
	if (isUri(url)) {
//		if (topUrl !== undefined) {
			if (isUri(topUrl)) {
				topUrl = normalizeUrl(topUrl);
			}
			let u = normalizeUrl_get(url.trim());
			while (u.indexOf(".") === 0) {
				if (u.indexOf("./") === 0) {
					u = u.substr(2);
				} else if (u.indexOf("../") === 0) {
					u = u.substr(3);
				}
			}
			url = topUrl.endsWith(u) ? topUrl : normalizeUrl(topUrl.substr(0, topUrl.lastIndexOf("/") + 1) + url);
//		} else {
//			url = normalizeUrl(url);
//		}
	}
	return url.search(reHost) === -1 ? location.origin + url : url;
}
export function isUri(url) {
	url = url.trimLeft();
	return url.search(reHost) !== 0 && url[0] !== "/";
}
function normalizeUrl(url) {
	url = url.trim();
//	if (url.search(reHost) === 0) {
//		return new URL(url).href;
//	}
//	if (url[0] !== "/") {
//	if (url.search(reHost) !== 0 && url[0] !== "/") {
	if (isUri(url)) {
		const lastSlashIdx = location.pathname.lastIndexOf("/");
		if (lastSlashIdx === location.pathname.length - 1) {
			url = location.pathname + url;
		} else if (lastSlashIdx !== -1)  {
			url = location.pathname.substr(0, lastSlashIdx + 1) + url;
		}
	}
	return normalizeUrl_get(url);
}
function normalizeUrl_get(url) {
	for (let re = [reUp, reThis], i = re.length - 1; i > -1; i--) {
		while (url.search(re[i]) !== -1) {
			url = url.replace(re[i], "/");
		}
	}
	if (url.search(reHost) === -1) {
		return url.replace(reSlash, "/");
	}
	const i = url.indexOf("//");
	return url.substr(0, i + 1) + url.substr(i + 1).replace(reSlash, "/");
	//.trim();
}
//API
self.getLoc = getLoc;
self.setLoc = setLoc;
self.getUrl = getUrl;
self.isUri = isUri;
self.normalizeUrl = normalizeUrl;
