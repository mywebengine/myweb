/*!
 * myweb 0.9.2
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */

import {myweb, loc, view, my} from "./myweb.js";

const mwUrl = import.meta.url;
my.debugLevel = mwUrl.indexOf("debug=1") !== -1 ? 1 : mwUrl.indexOf("debug=2") !== -1 ? 2 : 0;

const $scroll = document.scrollingElement;
const evtOpt = {passive: true};

//todo ios default
if ($scroll?.clientWidth === 980) {
	setTimeout(() => view.setState($scroll), 500);
}

self.addEventListener(
	"scroll",
	() => {
		myweb.checkScrollAnimations();
		if ($scroll !== null) {
			myweb.setDelay(10, () => {
				view.scrollTop = $scroll.scrollTop;
				view.scrollLeft = $scroll.scrollLeft;
			});
		}
	},
	evtOpt
);
self.addEventListener(
	"resize",
	() => {
		//console.log("resize");
		myweb.setDelay(10, () => view.setState($scroll));
	},
	evtOpt
);
self.addEventListener(
	"popstate",
	() => {
		//console.log("popstate", location.href, location.hash);
		// setLoc(location.href);
		loc.setState(location.href);
	},
	evtOpt
);
(() => {
	if (mwUrl.indexOf("load=skip") !== -1) {
		if (my.debugLevel !== 0) {
			import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"));
		}
		return;
	}
	const ready = () => {
		if (mwUrl.indexOf("line=1") === -1) {
			myweb.render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1);
		} else {
			import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"))
				.then(m => m.default)
				.then(() => myweb.render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1));
		}
	};
	if (mwUrl.indexOf("load=onload") === -1) {
		//if (document.readyState !== "loading") {
		if (document.readyState === "interactive" || document.readyState === "complete") {
			ready();
		} else {
			document.addEventListener("DOMContentLoaded", ready, {once: true});
		}
	} else if (document.readyState === "complete") {
		ready();
	} else {
		self.addEventListener("load", ready, {once: true});
	}
})();
