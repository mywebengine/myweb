﻿/*!
 * myweb v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */

import {/*curRender, */syncInRender, render, addAnimation, animationsReady} from "./render/algo.js";
import "./addons.js";
import {globVarName, locVarName} from "./config.js";
import {isAnimationVisible} from "./dom.js";
import {getLoc, setLoc} from "./loc.js";
import {getProxy} from "./proxy.js";

const u = import.meta.url,
	oIdx = u.indexOf("/", 8),
	sIdx = u.indexOf("?"),
	url = {
		origin: u.substr(0, oIdx),
		pathname: u.substring(oIdx, sIdx === -1 ? undefined : sIdx),
		search: sIdx === -1 ? "" : u.substr(sIdx)
	};
self.Tpl_debugLevel = url.search.indexOf("debug=2") !== -1 ? 2 : (url.search.indexOf("debug=1") !== -1 ? 1 : 0);

self[globVarName] = getProxy(self[globVarName] || {});
self[locVarName] = getProxy(getLoc(location.href));
//
//self.syncInRender = syncInRender;

self.addEventListener("scroll", async () => {
	for (const sync of syncInRender) {
		if (sync.stat !== 0 || sync.scrollAnimation.size === 0) {
			continue;
		}
		const animation = new Set();
		for (const a of sync.scrollAnimation) {
			if (isAnimationVisible(a)) {
				animation.add(a);
			}
		}
		if (animation.size !== 0) {
			addAnimation(sync, animation, null, null)
				.then(() => animationsReady(animation));
		}
	}
}, {
	passive: true
});
self.addEventListener("popstate", () => {
//console.log('ps', location.href, curRender);
	setLoc(location.href);
}, {
	passive: true
});
if (url.search.indexOf("skip") === -1) {
	const onload = () => {
		self.removeEventListener("load", onload);
		self.removeEventListener("DOMContentLoaded", onload);
		if (self.Tpl_debugLevel === 0) {
			render(undefined, undefined, undefined, url.search.indexOf("tolinking") !== -1);
			return;
		}
		import(url.origin + url.pathname.replace("myweb.js", "getLineNo.js"))
			.then(m => m.default)
			.then(() => render(undefined, undefined, undefined, url.search.indexOf("tolinking") !== -1));
	}
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
} else if (self.Tpl_debugLevel !== 0) {
	import(url.origin + url.pathname.replace("myweb.js", "getLineNo.js"));
}
