/*!
 * myweb v0.9.0
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */

import {syncInRender, render, renderLoop, addAnimation} from "./render/algo.js";
import "./addons.js";
import "./api.js";
import {globVarName, locVarName} from "./config.js";
import {$srcById} from "./descr.js";
import {isAnimationVisible} from "./dom.js";
import {getLoc, setLoc} from "./loc.js";
import {getProxy} from "./proxy.js";

const evtOpt = {
	passive: true
};
function begin() {
	const mwUrl = import.meta.url;
	self.mw_debugLevel = mwUrl.indexOf("debug=1") !== -1 ? 1 : (mwUrl.indexOf("debug=2") !== -1 ? 2 : 0);
	self[globVarName] = getProxy(self[globVarName] || {});
	self[locVarName] = getProxy(getLoc(location.href));
	if (mwUrl.indexOf("load=skip") !== -1) {
		if (self.mw_debugLevel !== 0) {
			import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"));
		}
		return;
	}
	const onload = () => {
		if (self.mw_debugLevel === 0) {
			render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1);
			return;
		}
		import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"))
			.then(m => m.default)
			.then(() => render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1));
	}
	if (mwUrl.indexOf("load=onload") === -1) {
		if (document.readyState !== "loading") {
			onload();
			return;
		}
		document.addEventListener("DOMContentLoaded", onload, {
			once: true
		});
		return;
	}
	if (document.readyState === "complete") {
		onload();
		return;
	}
	self.addEventListener("load", onload, {
		once: true
	});

}
if (import.meta.__imports__ === undefined) {
	begin();
} else {
	import.meta.__imports__
		.then(begin);
}
self.addEventListener("scroll", async () => {
	const pSet = new Set(),
		scrollSync = new Set();
	for (const sync of syncInRender) {
		if (sync.stat !== 0 || sync.scrollAnimations.size === 0) {
			continue;
		}
		const animation = new Set();
		for (const a of sync.scrollAnimations) {
			if (!$srcById.has(a.viewedSrcId)) {
				sync.scrollAnimations.delete(a);
				if (sync.scrollAnimations.size === 0) {
					scrollSync.add(sync);
				}
				continue;
			}
			if (isAnimationVisible(a)) {
				sync.scrollAnimations.delete(a);
				animation.add(a);
			}
		}
		if (animation.size !== 0) {
			pSet.add(addAnimation(sync, animation, true));
			scrollSync.add(sync);
		}
	}
	if (pSet.size !== 0) {
//console.log("animation")
		Promise.all(pSet)
			.then(() => renderLoop(scrollSync));
		return;
	}
	if (scrollSync.size !== 0) {
//todo
console.warn("2animation")
		renderLoop(scrollSync);
	}

}, evtOpt);
self.addEventListener("popstate", () => {
//console.log("ps", location.href);
	setLoc(location.href);
}, evtOpt);
