/*!
 * myweb v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
import "./addons.js";
import {getLoc, setLoc} from "./loc.js";
import {getProxy} from "./proxy.js";
import {curRender, render} from "./render/algo.js";

const url = new URL(import.meta.url);
/*
//!!for Edge
const $ue = document.querySelector('script[src*="/myweb/"]');
const url = new URL($ue ? $ue.src : location.origin + '/myweb/tpl.js');*/
self.isDebug = url.search.indexOf("debug") !== -1;

self.data = getProxy(self.data || {});
self.cmd = getProxy(self.cmd || {});
self.loc = getProxy(getLoc(location.href));

self.addEventListener("popstate", () => {
//console.log('ps', location.href, curRender);
	curRender
		.then(() => {
			setLoc(location.href);
		});
});
if (url.search.indexOf("skip") === -1) {
	const onload = async () => {
		if (self.isDebug) {
			const m = await import(url.origin + url.pathname.replace("main.js", "getLineNo.js"));
			await m.default;
/*
//!!for Edge
			try {
				await eval('import(url.origin + "/myweb/getLineNo.js")
				await m.default;
				render();
			} catch (err) {
			}*/
		}
		render();
	};
	if (url.search.indexOf("onload") === -1) {
		if (!document.readyState || document.readyState === "loading") {
			document.addEventListener("DOMContentLoaded", onload);
		} else {
			onload();
		}
	} else if (document.readyState !== "complete") {
		self.addEventListener("load", onload);
	} else {
		onload();
	}
} else if (self.isDebug) {
	import(url.origin + url.pathname.replace("main.js", "getLineNo.js"));
}
