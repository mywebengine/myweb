/*!
 * myweb 0.9.2
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
import {render, setDelay, renderLoop, addAnimation, checkScrollAnimations} from "./render/algo.js";
import "./addons/addons.js";
import "./api/api.js";
import {globVarName, locVarName, viewVarName} from "./config/config.js";
import {Env} from "./env/Env.js";
import {isAnimationVisible} from "./dom/dom.js";
import {getLoc, setLoc} from "./loc/loc.js";
import {getProxy} from "./proxy/proxy.js";
import {getView, setView} from "./view/view.js";

import {attrCmdName, execCmdName, fetchCmdName, foreachCmdName, htmlCmdName,
	ifCmdName, elseifCmdName, elseCmdName, switchCmdName, caseCmdName, defaultCmdName,
	incCmdName, onCmdName, scopeCmdName, fillingCmdName, watchCmdName} from "./config/config.js";

import {addCommand} from "./cmd/cmd.js";
import attrCmd from "./cmd/attr/attr.js";
import execCmd from "./cmd/exec/exec.js";
import fetchCmd from "./cmd/fetch/fetch.js";
import foreachCmd from "./cmd/foreach/foreach.js";
import htmlCmd from "./cmd/html/html.js";
import {ifCmd, switchCmd} from "./cmd/if/if.js";
import incCmd from "./cmd/inc/inc.js";
import onCmd from "./cmd/on/on.js";
import scopeCmd from "./cmd/scope/scope.js";
import fillingCmd from "./cmd/filling/filling.js";
import watchCmd from "./cmd/watch/watch.js";

//self.onerror = function(errorMsg, url, lineNumber) {
//	alert(errorMsg);
//	return false;
//}
//
if (self.my === undefined) {
	self.my = {};
}

function clientInit(env = new Env()) {
	my.document = document;
	my.rootElement = document.documentElement;
	my.ctx = env;


addCommand(attrCmdName, attrCmd);
addCommand(execCmdName, execCmd);
addCommand(fetchCmdName, fetchCmd);
addCommand(foreachCmdName, foreachCmd);
addCommand(htmlCmdName, htmlCmd);

addCommand(ifCmdName, ifCmd);
addCommand(elseifCmdName, ifCmd);
addCommand(elseCmdName, ifCmd);

addCommand(switchCmdName, switchCmd);
addCommand(caseCmdName, switchCmd);
addCommand(defaultCmdName, switchCmd);

addCommand(incCmdName, incCmd);
addCommand(onCmdName, onCmd);
addCommand(scopeCmdName, scopeCmd);
addCommand(fillingCmdName, fillingCmd);
addCommand(watchCmdName, watchCmd);
//ssr
//for (const [str, r] of my.ctx.reqCmd) {
//	r.cmd = my.ctx.cmd.get(str.substr(0, str.indexOf(cmdArgsDiv)));
//}


	const mwUrl = import.meta.url;
	my.debugLevel = mwUrl.indexOf("debug=1") !== -1 ? 1 : (mwUrl.indexOf("debug=2") !== -1 ? 2 : 0);
	self[globVarName] = getProxy(self[globVarName] || {});
	self[locVarName] = getProxy(getLoc(location.href));
	self[viewVarName] = getProxy(getView(document));
	if (mwUrl.indexOf("load=skip") !== -1) {
		if (my.debugLevel !== 0) {
			import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"));
		}
		return;
	}
	const ready = () => {
		if (mwUrl.indexOf("line=1") === -1) {
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


//	
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
}
//if (true) {
	clientInit();
//}
