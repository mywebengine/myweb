/*!
 * myweb v0.9.04
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
import {syncInRender, render, setDelay, renderLoop, addAnimation, checkScrollAnimations} from "./render/algo.js";
import "./addons.js";
import "./api.js";
import {globVarName, locVarName, viewVarName} from "./config.js";
import {$srcById} from "./descr.js";
import {isAnimationVisible} from "./dom.js";
import {getLoc, setLoc} from "./loc.js";
import {getProxy} from "./proxy.js";
import {getView, setView} from "./view.js";

(() => {
	const mwUrl = import.meta.url;
	self.mw_debugLevel = mwUrl.indexOf("debug=1") !== -1 ? 1 : (mwUrl.indexOf("debug=2") !== -1 ? 2 : 0);
	self[globVarName] = getProxy(self[globVarName] || {});
	self[locVarName] = getProxy(getLoc(location.href));
	self[viewVarName] = getProxy(getView(document));
	if (mwUrl.indexOf("load=skip") !== -1) {
		if (self.mw_debugLevel !== 0) {
			import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"));
		}
		return;
	}
	const ready = () => {
		if (self.mw_debugLevel === 0) {
			render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1);
			return;
		}
		import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"))
			.then(m => m.default)
			.then(() => render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1));
	}
	if (mwUrl.indexOf("load=onload") === -1) {
//		if (document.readyState !== "loading") {
		if (document.readyState === "interactive" || document.readyState === "complete") {
			ready();
			return;
		}
		document.addEventListener("DOMContentLoaded", ready, {
			once: true
		});
		return;
	}
	if (document.readyState === "complete") {
		ready();
		return;
	}
	self.addEventListener("load", ready, {
		once: true
	});

})();
const view = self[viewVarName],
	$scroll = document.scrollingElement,
	evtOpt = {
		passive: true
	};
//todo ios default
if ($scroll.clientWidth === 980) {
	setTimeout(() => setView(document), 500);
}
self.addEventListener("scroll", () => {
	checkScrollAnimations();
	setDelay(10, () => {
		view.scrollTop = $scroll.scrollTop;
		view.scrollLeft = $scroll.scrollLeft;
	});
}, evtOpt);
self.addEventListener("resize", () => {
//console.log("resize");
	setDelay(10, () => setView(document));
}, evtOpt);
self.addEventListener("popstate", () => {
//console.log("popstate", location.href, location.hash);
	setLoc(location.href);
}, evtOpt);
