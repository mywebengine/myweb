import {oset} from "./oset.js";

const trimSlashRe = new RegExp("(^/|/$)", "g");

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
