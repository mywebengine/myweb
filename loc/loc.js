import Config from "../config/Config.js";
import {oset} from "../oset/oset.js";
//import {getProxy} from "../proxy/proxy.js";
//import {Loc} from "./Loc.js";

//const trimSlashRe = /(^\/|\/$)/g;

export function setLoc(url) {
	oset(self, Config.locVarName, getLoc(url));
}
export function getLoc(url) {//, defPageName = "") {
	url = new URL(url);

//	const loc = parsePath(url.href, url.pathname, defPageName);
//	loc.hash = parsePath(url.hash, url.hash.substr(1), defPageName);

	const query = new Map();
	for (const [n, v] of url.searchParams) {
		query.set(n, v);
	}
	return {
		origin: url.origin,
		href: url.href,
		pathname: url.pathname,
//		name,
//		args,
//		param: {},
		query,
		hash: {
//			href: url.hash,
			path: url.hash.substr(1)
		}
	};
//	return new Loc(url.origin, url.href, url.pathname, query, url.hash);
}
//function parsePath(href, path, defPageName) {
//	const args = path.replace(trimSlashRe, "").split("/"),
//		loc = new Loc(href, path, args[0] || defPageName, args);
//	for (let i = args.length - 1; i > 0; i -= 2) {
//		loc.param[args[i - 1]] = decodeURIComponent(args[i]);
//	}
//	return loc;
//}
