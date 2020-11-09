import data from "./3data.js";

function load() {
	let logSync = 0;
	HTMLElement.prototype.render = function(delay) {
		const _logSync = ++logSync;
		const time = performance.now();
		if (delay >= 0) {
			return self.tpl.async(delay, this)
				.then(() => {
					if (_logSync == logSync) {
						console.log(`time(async: ${self.tpl.sync}): `, performance.now() - time - (delay || 0));
					}
				});
		}
		const ret = self.tpl.render(this);
		console.log('time: ', performance.now() - time);
		return ret;
	}

	self.pdata = self.tpl.getProxy(self.data = data);

	document.documentElement.render();
}
self.onload = () => {
	if (self.lineNo) {
		self.lineNo.then(load);
	} else {
		load();
	}
}


self.a = {
	arr: [10,20,30,40,50]
}
self.s = Symbol.for('a');
//self.a[s] = 11;
const h = {
	get(t, n) {
		console.log('get', t, n);
		return t[n];
	},
	set(t, n, v) {
		console.log('set', t, n, v);
		if (Reflect.set(t, n, v)) {
			return true;
		}
		throw 500;
	},
	deleteProperty(t, n) {
		if (n in t) {
			const ret = Reflect.deleteProperty(t, n);
			console.log(`property removed: ${n}`);
			return ret;
		}
	}
};
self.p = new Proxy(a, h);
self.a.arr = new Proxy(a.arr, h);