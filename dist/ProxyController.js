export class ProxyController {
    //static p_target = Symbol();
    //static isSkipNameType = new Set([/*todo "undefined", */"symbol"]);
    //static isSkipValueType = new Set(["function"]);
    static isScalarType = new Set(["boolean", "number", "string", "undefined", "symbol"]);
    static proxyStat = {
        value: 1,
    };
    proxyByTarget = new WeakMap();
    p_target;
    constructor(p_target = Symbol()) {
        this.p_target = p_target;
    }
    createProxy(val) {
        const target = this.getTarget(val);
        const proxy = this.proxyByTarget.get(target);
        if (proxy !== undefined) {
            return proxy;
        }
        const vType = typeof target;
        if (vType === "object") {
            return target[this.p_target] !== null ? this.setProxy(target, new Proxy(target, this.getObjectProxyHandler())) : target;
        }
        if (vType !== "function" || target[this.p_target] === null) {
            return target;
        }
        switch (target) {
            case Array.prototype.push:
            case Array.prototype.unshift:
            case Array.prototype.shift:
            case Array.prototype.pop:
            case Array.prototype.splice:
            case Array.prototype.sort:
            case Array.prototype.reverse:
                return this.setProxy(target, new Proxy(target, this.getChangeArrFuncHandler()));
            case Set.prototype.entries:
            case Map.prototype.entries:
                return this.setProxy(target, new Proxy(target, this.getEntriesFuncHandler(true)));
            case Set.prototype.values:
            case Set.prototype.keys:
            case Map.prototype.values:
            case Map.prototype.keys:
                return this.setProxy(target, new Proxy(target, this.getEntriesFuncHandler(false)));
            case Set.prototype.add:
                return this.setProxy(target, new Proxy(target, this.getAddFuncHandler()));
            case Set.prototype.has:
            case Map.prototype.has:
                return this.setProxy(target, new Proxy(target, this.getHasFuncHandler()));
            case Set.prototype.delete:
                return this.setProxy(target, new Proxy(target, this.getDeleteSetMapFuncHandler(true)));
            case Set.prototype.clear:
            case Map.prototype.clear:
                return this.setProxy(target, new Proxy(target, this.getClearFuncHandler()));
            case Map.prototype.get:
                return this.setProxy(target, new Proxy(target, this.getFuncHandler()));
            case Map.prototype.set:
                return this.setProxy(target, new Proxy(target, this.getSetFuncHandler()));
            case Map.prototype.delete:
                return this.setProxy(target, new Proxy(target, this.getDeleteSetMapFuncHandler(false)));
            default:
                return target;
        }
    }
    getObjectProxyHandler() {
        return {
            get: this.objectHandlerGet.bind(this),
            set: (target, name, val) => {
                //console.log("set", n, v, "old=>", t[n], t, v === p_target);//, Object.getOwnPropertyDescriptor(t, n) && Object.getOwnPropertyDescriptor(t, n).value);
                const vTarget = this.getTarget(val);
                const oldVTarget = this.getTarget(target[name]);
                if (name in target) {
                    //связно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то иначе, например, через this.value = 1111
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
            },
        };
    }
    objectHandlerGet(target, name) {
        //if (n == "then") {
        //	console.error("get", target, name, target[name], cur$src, typeof target[name] === "object");
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
    }
    funcHandlerGet(target, name, receiver) {
        return name !== this.p_target ? receiver : target;
    }
    getChangeArrFuncHandler() {
        return {
            apply: (func, thisValue, args) => {
                const target = this.getTargetObj(thisValue);
                const oldLen = target.length;
                const res = func.apply(target, args);
                this.setVal(target, "length", target.length, oldLen);
                return res;
            },
            get: this.funcHandlerGet,
        };
    }
    getEntriesFuncHandler(isEntries) {
        const iteratorFuncHandler = this.getIteratorFuncHandler(isEntries);
        return {
            apply: (func, thisValue, args) => {
                //console.log(22222222, thisValue, thisValue[p_target], args);
                const target = this.getTargetObj(thisValue);
                const i = func.apply(target, args);
                //if (cur$src !== null) {
                i.next = new Proxy(i.next, iteratorFuncHandler);
                i[this.p_target] = target;
                //}
                return i;
            },
            get: this.funcHandlerGet,
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
                    const [k, v] = res.value;
                    const kTarget = this.getTarget(k);
                    const vTarget = this.getTarget(v);
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
            },
        };
    }
    getFuncHandler() {
        return {
            apply: (func, thisValue, args) => {
                //console.log("getF", cur$src, thisValue, thisValue[this.p_target], args);
                const target = this.getTargetObj(thisValue);
                const vTarget = this.getTarget(func.apply(target, args));
                //if (cur$src !== null) {
                this.getVal(target, this.getTarget(args[0]), vTarget);
                //}
                //return ProxyController.isSkipValueType.has(typeof vTarget) ? vTarget : this.getProxy(vTarget);
                return this.getProxy(vTarget);
            },
        };
    }
    getAddFuncHandler() {
        return {
            apply: (func, thisValue, args) => {
                const target = this.getTargetObj(thisValue);
                const vTarget = this.getTarget(args[0]);
                if (target.has(vTarget)) {
                    //if (target.has(v)) {
                    //const oldVTarget = getTarget(target.get(val));
                    //связно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то иначе, например, через this.value = 1111
                    //if (vTarget === oldVTarget) {
                    return thisValue;
                    //}
                }
                func.apply(target, [vTarget]);
                this.setVal(target, vTarget, vTarget, undefined);
                return thisValue;
            },
        };
    }
    getSetFuncHandler() {
        return {
            apply: (func, thisValue, args) => {
                const target = this.getTargetObj(thisValue);
                const [k, v] = args;
                const kTarget = this.getTarget(k);
                const vTarget = this.getTarget(v);
                const oldVTarget = this.getTarget(target.get(kTarget));
                //console.log("setF", t, f, args);
                if (target.has(kTarget)) {
                    //связно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то иначе, например, через this.value = 1111
                    if (vTarget === oldVTarget) {
                        return thisValue;
                    }
                }
                func.apply(target, [kTarget, vTarget]);
                this.setVal(target, kTarget, vTarget, oldVTarget);
                return thisValue;
            },
        };
    }
    getDeleteSetMapFuncHandler(isSet) {
        return {
            apply: (func, thisValue, args) => {
                const target = this.getTargetObj(thisValue);
                const kTarget = this.getTarget(args[0]);
                if (!target.has(kTarget) || !func.apply(target, args)) {
                    return false;
                }
                if (isSet) {
                    this.setVal(target, kTarget, undefined, kTarget);
                }
                else {
                    this.setVal(target, kTarget, undefined, this.getTarget(target.get(kTarget)));
                }
                return true;
            },
        };
    }
    getHasFuncHandler() {
        return {
            apply: (func, thisValue, args) => {
                //console.log("hasF", cur$src, thisValue, thisValue[this.p_target], args);
                return func.apply(this.getTargetObj(thisValue), args);
            },
        };
    }
    getClearFuncHandler() {
        return {
            apply: (func, thisValue, args) => {
                //console.log("clearF", thisValue, thisValue[this.p_target], args);
                const target = thisValue[this.p_target] || thisValue;
                const oldSize = target.size;
                func.apply(target, args);
                this.setVal(target, "size", 0, oldSize);
            },
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
    getVal(target, name, val) { }
    setVal(target, name, val, oldVal) { }
}
