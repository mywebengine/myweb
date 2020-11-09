import data from "./data.js";

function load() {
//	$goFor(self.tpl.$src, $e => {
//		if ($e.tagName) {
//			self.tpl.create$e($e);
//		}
//	});
//console.log("load");
	let logSync = 0;
	HTMLElement.prototype.render = function(delay) {
		const _logSync = ++logSync;
		const time = performance.now();
		if (delay >= 0) {
			return self.tpl.async(delay, this).then(() => {
				if (_logSync == logSync) {
					console.log(`time(async: ${self.tpl.sync}): `, performance.now() - time - (delay || 0));

/*
const t1 = performance.now();
let i = 0;
$goFor(document.documentElement, function($i) {
	i += 1;
});
console.log('t: ', performance.now() - t1, i);*/
				}
			});
		}
		const ret = self.tpl.render(this);
		console.log('time: ', performance.now() - time);
		return ret;
	}
	self.d = data;
	self.data = self.tpl.getProxy(data);

//	$goDeep(tpl.$src, $i => console.log(1));
	
	const time = performance.now();
//	console.log(`start linker`);
	tpl.linker();
	console.log(`linker: `, performance.now() - time);
//	document.documentElement.render(0);

self.s = document.querySelectorAll('span')[5];
self.l = document.querySelectorAll('li')[2];
}
self.onload = () => {
	if (self.lineNo) {
		self.lineNo.then(load);
	} else {
		load();
	}
}
