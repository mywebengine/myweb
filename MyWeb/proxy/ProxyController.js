export default class ProxyController {
//	static p_target = Symbol();
	//static isSkipNameType = new Set([/*todo "undefined", */"symbol"]);
	//static isSkipValueType = new Set(["function"]);
	static isScalarType = new Set(["boolean", "number", "string", "undefined", "symbol"]);
	static proxyStat = {
		value: 1
	};
	proxyByTarget = new WeakMap();
	constructor(p_target = Symbol()) {
		this.p_target = p_target;
	}
	createProxy(val) {
		const target = this.getTarget(val),
			proxy = this.proxyByTarget.get(target);
		if (proxy !== undefined) {
			return proxy;
		}
		const vType = typeof target;
		if (vType === "object") {
			return target[this.p_target] !== null ? this.setProxy(target, new Proxy(target, this.getProxyHandler())) : target;
		}
		if (vType === "function") {
			if (target[this.p_target] === null) {
				return target;
			}

			if (target === Array.prototype.push || target === Array.prototype.unshift || target === Array.prototype.shift || target === Array.prototype.pop || target === Array.prototype.splice || target === Array.prototype.sort || target === Array.prototype.reverse) {
				return this.setProxy(target, new Proxy(target, this.getChangeArrFuncHandler()));
			}

			if (target === Set.prototype.entries
				|| target === Map.prototype.entries) {
				return this.setProxy(target, new Proxy(target, this.getEntriesFuncHandler(true)));
			}
			if (target === Set.prototype.values || target === Set.prototype.keys
				|| target === Map.prototype.values || target === Map.prototype.keys) {
				return this.setProxy(target, new Proxy(target, this.getEntriesFuncHandler(false)));
			}
			if (target === Set.prototype.add) {
				return this.setProxy(target, new Proxy(target, this.getAddFuncHandler()));
			}
			if (target === Set.prototype.has
				|| target === Map.prototype.has) {
				return this.setProxy(target, new Proxy(target, this.getHasFuncHandler()));
			}
			if (target === Set.prototype.delete) {
				return this.setProxy(target, new Proxy(target, this.getDeleteSetMapFuncHandler(true)));
			}
			if (target === Set.prototype.clear
				|| target === Map.prototype.clear) {
				return this.setProxy(target, new Proxy(target, this.getClearFuncHandler()));
			}

//			if (target === Map.prototype.entries) {
//				return this.setProxy(target, new Proxy(target, this.getEntriesFuncHandler(true)));
//			}
//			if (target === Map.prototype.values || target === Map.prototype.keys) {
//				return this.setProxy(target, new Proxy(target, this.getEntriesFuncHandler(false)));
//			}
			if (target === Map.prototype.get) {
				return this.setProxy(target, new Proxy(target, this.getFuncHandler()));
			}
			if (target === Map.prototype.set) {
				return this.setProxy(target, new Proxy(target, this.getSetFuncHandler()));
			}
//			if (target === Map.prototype.has) {
//				return this.setProxy(target, new Proxy(target, this.getHasFuncHandler()));
//			}
			if (target === Map.prototype.delete) {
				return this.setProxy(target, new Proxy(target, this.getDeleteSetMapFuncHandler(false)));
			}
//			if (target === Map.prototype.clear) {
//				return this.setProxy(target, new Proxy(target, this.getClearFuncHandler()));
//			}
		}
		return target;
/*
		if (Array.isArray(val)) {
			const len = val.length;
			for (let i = 0; i < len; i++) {
				val[i] = this.create(val[i]);
			}
			val.push = new Proxy(val.push, this.getChangeArrFuncHandler());
			val.unshift = new Proxy(val.unshift, this.getChangeArrFuncHandler());
			val.shift = new Proxy(val.shift, this.getChangeArrFuncHandler());
			val.pop = new Proxy(val.pop, this.getChangeArrFuncHandler());
			val.splice = new Proxy(val.splice, this.getChangeArrFuncHandler());
			val.sort = new Proxy(val.sort, this.getChangeArrFuncHandler());
			val.reverse = new Proxy(val.reverse, this.getChangeArrFuncHandler());
			return new Proxy(val, this.getProxyHandler());
		}
		if (val instanceof Set) {
			const s = new Set(val);
			val.clear();
			for (const vv of s) {
				val.add(this.create(vv));
			}
			val.entries = new Proxy(val.entries, this.getEntriesFuncHandler(true));
			val.values = new Proxy(val.values, this.getEntriesFuncHandler(false));
			val.keys = new Proxy(val.keys, this.getEntriesFuncHandler(false));
			val.add = new Proxy(val.add, this.getAddFuncHandler());
			val.has = new Proxy(val.has, this.getHasFuncHandler());
			val.delete = new Proxy(val.delete, this.getDeleteSetMapFuncHandler(true));
			val.clear = new Proxy(val.clear, this.getClearFuncHandler());
			return new Proxy(val, this.getProxyHandler());
		}
		if (val instanceof Map) {
			const s = new Map(val);
			val.clear();
			for (const [kk, vv] of s) {
				val.set(this.create(kk), this.create(vv));
			}
			val.entries = new Proxy(val.entries, this.getEntriesFuncHandler(true));
			val.values = new Proxy(val.values, this.getEntriesFuncHandler(false));
			val.keys = new Proxy(val.keys, this.getEntriesFuncHandler(false));
			val.get = new Proxy(val.get, this.getFuncHandler());
			val.set = new Proxy(val.set, this.getSetFuncHandler());
			val.delete = new Proxy(val.delete, this.getDeleteSetMapFuncHandler(false));
			val.has = new Proxy(val.has, this.getHasFuncHandler());
			val.clear = new Proxy(val.clear, this.getClearFuncHandler());
			return new Proxy(val, this.getProxyHandler());
		}
		for (const i in val) {
			const v = val[i];
			if (typeof v !== "object" || v === null || v === val) {
				continue;
			}
			const d = Object.getOwnPropertyDescriptor(val, i);
			if (d !== undefined && d.writable) {
				val[i] = this.create(v);
			}
		}*/
		//return new Proxy(val, this.getProxyHandler());
	}
	getProxyHandler() {
		return {
			get: (target, name) => {
				//if (n == "then") {
					//console.error("get", target, name, target[name], cur$src, typeof target[name] === "object");
				//}
				if (ProxyController.proxyStat.value === 0) {
					ProxyController.proxyStat.value = 1;
				}
				if (name === this.p_target) {
					return target;
				}
				const vTarget = this.getTarget(target[name]);
				//if (!ProxyController.isSkipNameType.has(typeof name)) {// && !ProxyController.isSkipValueType.has(typeof vTarget)) {
					this.getVal(target, name, vTarget);
					return this.getProxy(vTarget);
				//}
				//return name !== Symbol.iterator ? vTarget : target instanceof Map ? target.entries : target.values;
				//return vTarget;
			},
			set: (target, name, val) => {
				//console.log("set", n, v, "old=>", t[n], t, v === p_target);//, Object.getOwnPropertyDescriptor(t, n) && Object.getOwnPropertyDescriptor(t, n).value);
				const vTarget = this.getTarget(val),
					oldVTarget = this.getTarget(target[name]);
				if (name in target) {
					//связоно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то оначе например через this.value = 1111
					if (vTarget === oldVTarget) {
						return true;
					}
				}
				target[name] = vTarget;
				//if (Reflect.set(target, name, val)) {
					this.setVal(target, name, vTarget, oldVTarget);
					return true;
				//}
				//return false;
			},
			deleteProperty: (target, name) => {
				//console.log("del", t, n, "old=>", getTarget(t[n]));
				if (name in target) {
					const oldV = this.getTarget(target[name]);
					delete target[name];
					//if (Reflect.deleteProperty(target, name)) {
						this.setVal(target, name, undefined, oldV);
						return true;
					//}
					//return false;
				}
				return true;
			}
		};
	}
	funcGetHandler(target, name, reciver) {
		return name !== this.p_target ? reciver : target;
	}
	getChangeArrFuncHandler() {
		return {
			apply: (func, thisValue, args) => {
				const target = this.getTargetObj(thisValue),
					oldLen = target.length,
					res = func.apply(target, args);
				this.setVal(target, "length", target.length, oldLen);
				return res;
			},
			get: this.funcGetHandler
		}
	}
	getEntriesFuncHandler(isEntries) {
		const iteratorFuncHandler = this.getIteratorFuncHandler(isEntries);
		return {
			apply: (func, thisValue, args) => {
				//console.log(22222222, thisValue, thisValue[p_target], args);
				const target = this.getTargetObj(thisValue),
					i = func.apply(target, args);
				//if (cur$src !== null) {
					i.next = new Proxy(i.next, iteratorFuncHandler);
					i[this.p_target] = target;
				//}
				return i;
			},
			get: this.funcGetHandler
		};
	}
	getIteratorFuncHandler(isEntries) {
		return {
			apply: (func, thisValue, args) => {
				//console.log("next", thisValue, thisValue[this.p_target], f, args, cur$src);
				const res = func.apply(thisValue, args);
				//-- ?
				//if (!cur$src !== null) {
				//if (!cur$src !== null || val.done) {
				if (res.done) {
					return res;
				}
				const target = thisValue[this.p_target];
				//!!!!
				if (isEntries) {
					const [k, v] = res.value,
						kTarget = this.getTarget(k),
						vTarget = this.getTarget(v);
					this.getVal(target, kTarget, vTarget);
					//if (!ProxyController.isSkipValueType.has(typeof kTarget)) {
						res.value[0] = this.getProxy(kTarget);
					//}
					//if (!ProxyController.isSkipValueType.has(typeof vTarget)) {
						res.value[1] = this.getProxy(vTarget);
					//}
					return res;
				}
				const vTarget = this.getTarget(res.value);
				this.getVal(target, vTarget, vTarget);
				//if (!ProxyController.isSkipValueType.has(typeof vTarget)) {
					res.value = this.getProxy(vTarget);
				//}
				return res;
			}
		};
	}
	getFuncHandler() {
		return {
			apply: (func, thisValue, args) => {
				//console.log("getF", cur$src, thisValue, thisValue[this.p_target], args);
				const target = this.getTargetObj(thisValue),
					vTarget = this.getTarget(func.apply(target, args));
				//if (cur$src !== null) {
					this.getVal(target, this.getTarget(args[0]), vTarget);
				//}
				//return ProxyController.isSkipValueType.has(typeof vTarget) ? vTarget : this.getProxy(vTarget);
				return this.getProxy(vTarget);
			}
		};
	}
	getAddFuncHandler() {
		return {
			apply: (func, thisValue, args) => {
				const target = this.getTargetObj(thisValue),
					vTarget = this.getTarget(args[0]);
				if (target.has(vTarget)) {
				//if (target.has(v)) {
					//const oldVTarget = getTarget(target.get(val));
					//связоно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то оначе например через this.value = 1111
					//if (vTarget === oldVTarget) {
						return thisValue;
					//}
				}
				func.apply(target, [vTarget]);
				this.setVal(target, vTarget, vTarget, undefined);
				return thisValue;
			}
		};
	}
	getSetFuncHandler() {
		return {
			apply: (func, thisValue, args) => {
				const target = this.getTargetObj(thisValue),
                			[k, v] = args,
                			kTarget = this.getTarget(k),
					vTarget = this.getTarget(v),
					oldVTarget = this.getTarget(target.get(kTarget));
				//console.log("setF", t, f, args);
				if (target.has(kTarget)) {
					//связоно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то оначе например через this.value = 1111
					if (vTarget === oldVTarget) {
						return thisValue;
					}
				}
				func.apply(target, [kTarget, vTarget]);
				this.setVal(target, kTarget, vTarget, oldVTarget);
				return thisValue;
			}
		};
	}
	getDeleteSetMapFuncHandler(isSet) {
		return {
			apply: (func, thisValue, args) => {
				const target = this.getTargetObj(thisValue),
					kTarget = this.getTarget(args[0]);
				if (!target.has(kTarget) || !func.apply(target, args)) {
					return false;
				}
				if (isSet) {
					setVal(target, kTarget, undefined, kTarget);
				} else {
					setVal(target, kTarget, undefined, this.getTarget(target.get(kTarget)));
				}
				return true;
			}
		};
	};
	getHasFuncHandler() {
		return {
			apply: (func, thisValue, args) => {
				//console.log("hasF", cur$src, thisValue, thisValue[this.p_target], args);
				return func.apply(this.getTargetObj(thisValue), args);
			}
		};
	}
	getClearFuncHandler() {
		return {
			apply: (func, thisValue, args) => {
				//console.log("clearF", thisValue, thisValue[this.p_target], args);
				const target = thisValue[this.p_target] || thisValue,
					oldSize = target.size;
				func.apply(target, args);
				this.setVal(target, "size", 0, oldSize);
			}
		};
	}
	isScalar(val) {
		return ProxyController.isScalarType.has(typeof val) || val === null;
	}
	getTarget(val) {
		return this.isScalar(val) ? val : this.getTargetObj(val);
	}
	getTargetObj(obj) {
		const t = obj[this.p_target];
		return t !== undefined && t !== null ? t : obj;
	}
	getProxy(target) {
		if (this.isScalar(target)) {
			return target;
		}
		const p = this.proxyByTarget.get(target);
		return p !== undefined ? p : this.setProxy(target, this.createProxy(target));
	}
	setProxy(target, proxy) {
		this.proxyByTarget.set(target, proxy);
		return proxy;
	}
	getVal(target, name, val) {
	}
	setVal(target, name, val, oldVal) {
	}
};
