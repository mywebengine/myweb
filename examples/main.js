import "../tpl.js";

self.debug = document.documentElement.dataset.debug && document.documentElement.dataset.debug != "false";
self.addEventListener("load", () => {
	self.debug ? debug() : main();
});

function main() {
	self.data = self.tpl.getProxy(self.data);
	self.tpl.go();
}
function debug() {
	self.tpl.onbeforeasync = function() {
		this.time = performance.now();
	}
	self.tpl.onasync = function() {
		console.log("time:", performance.now() - this.time);
	}
//	import("../getLineNo.js").then(m => m.default).then(main);
	try {
		eval("import(\"../getLineNo.js\").then(m => m.default).then(main)");
	} catch (err) {
		main();
	}
}
