import "./addons/addons.js";
import Context from "./context/Context.js";
import {getLoc, setLoc} from "./loc/loc.js";
import MyWeb from "./MyWeb/api/Api.js";
import {getView, setView} from "./view/view.js";

const myWeb = new MyWeb();
myWeb.addCommands();
myWeb.setContext(new Context());
myWeb.createApi();

const mwUrl = import.meta.url;
my.debugLevel = mwUrl.indexOf("debug=1") !== -1 ? 1 : (mwUrl.indexOf("debug=2") !== -1 ? 2 : 0);
//!!my[Config.globVarName] = self[Config.globVarName] || {};
my[Config.locVarName] = getLoc(location.href);
my[Config.viewVarName] = getView(document);
const view = my[Config.viewVarName],
	$scroll = document.scrollingElement,
	evtOpt = {
		passive: true
	};
//todo ios default
if ($scroll.clientWidth === 980) {
	setTimeout(() => setView(document), 500);
}
self.addEventListener("scroll", () => {
	myWeb.checkScrollAnimations();
	myWeb.setDelay(10, () => {
		view.scrollTop = $scroll.scrollTop;
		view.scrollLeft = $scroll.scrollLeft;
	});
}, evtOpt);
self.addEventListener("resize", () => {
//console.log("resize");
	myWeb.setDelay(10, () => setView(document));
}, evtOpt);
self.addEventListener("popstate", () => {
//console.log("popstate", location.href, location.hash);
	setLoc(location.href);
}, evtOpt);
(() => {
	if (mwUrl.indexOf("load=skip") !== -1) {
		if (my.debugLevel !== 0) {
			import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"));
		}
		return;
	}
	const ready = () => {
		if (mwUrl.indexOf("line=1") === -1) {
			myWeb.render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1);
			return;
		}
		import(mwUrl.replace(/([^\/]+?\.js)/, "getlineno.js"))
			.then(m => m.default)
			.then(() => myWeb.render(undefined, undefined, undefined, mwUrl.indexOf("linking=1") !== -1));
	};
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
