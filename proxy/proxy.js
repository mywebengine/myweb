import {renderBySrcIds} from "../render/algo.js";
import {p_target, defIdleCallbackOpt} from "../config/config.js";
import {getNewId, get$els} from "../description/descr.js";
/*
//!!instance
export const varIdByVar = new Map();
export const varById = new Map();
export const varIdByVarIdByProp = new Map();
export const srcIdsByVarId = new Map();

//self.mVarIdByVar = varIdByVar;
//self.mVarById = varById;
//self.mVarIdByVarIdByProp = varIdByVarIdByProp;
//self.mSrcIdsByVarId = srcIdsByVarId;*/

//todo--
self._testVars = function() {
	const v = new Set(Array.from(my.ctx.varIdByVar.values()));
	for (const [vId, srcIds] of my.ctx.srcIdsByVarId) {
		let fv;
		if (!v.has(vId)) {
			let f;
			for (const vvId of v) {
				const vIdByProp = my.ctx.varIdByVarIdByProp.get(vvId);
				if (vIdByProp === undefined) {
					continue;
				}
				for (const pId of vIdByProp.values()) {
					if (pId === vId) {
						for (const sId of srcIds) {
							if (!my.ctx.$srcById.has(sId)) {
								console.log(111222, vId, sId);
							}
						}
						f = true;
						break;
					}
				}
				if (f) {
					break;
				}
			}
			if (!f) {
				console.log(0, vId, srcIds);
			}
		} else {
			for (const sId of srcIds) {
				if (!my.ctx.$srcById.has(sId)) {
					console.log(11111, vId, sId);
				}
			}
		}
	}
	for (const vId of my.ctx.varIdByVar.keys()) {
		const s = my.ctx.srcIdsByVarId.get(vId);
		if (!s) {// || !s.has(sId)) {
			continue;
		}
		for (const sId of s) {
			if (!my.ctx.$srcById.has(sId)) {
				console.log(1, sId);
			}
		}
		const vIdByProp = my.ctx.varIdByVarIdByProp.get(vId);
		if (vIdByProp !== undefined) {
			for (const pId of vIdByProp.values()) {
				const propS = my.ctx.srcIdsByVarId.get(pId);
				if (propS) {// && propS.has(sId)) {
//					_del(pId, propS, sId);//, d, dId);
					for (const sId of propS) {
						if (!my.ctx.$srcById.has(sId)) {
							console.log(2, sId);
						}
					}
				}
			}
		}
	}
}


const isSkipNameType = new Set([/*todo "undefined", */"symbol"]),
	isSkipValueType = new Set(["function"]),
	isScalarType = new Set(["boolean", "number", "string", "undefined"]);
let cur$src = null;
export function setCur$src($src) {
	cur$src = $src;
}
export const proxyStat = {
	value: 1
};
export function getProxy(v) {
	if (typeof v === "object" && v !== null) {
		const t = v[p_target];
		if (t === null || t !== undefined) {
//		if (t || t === null) {
			return v;
		}
	} else {
		return v;
	}
	if (Array.isArray(v)) {
		const len = v.length;
		for (let i = 0; i < len; i++) {
			v[i] = getProxy(v[i]);
		}
		v.push = new Proxy(v.push, changeArrFuncHandler);
		v.unshift = new Proxy(v.unshift, changeArrFuncHandler);
		v.shift = new Proxy(v.shift, changeArrFuncHandler);
		v.pop = new Proxy(v.pop, changeArrFuncHandler);
		v.splice = new Proxy(v.splice, changeArrFuncHandler);
		v.sort = new Proxy(v.sort, changeArrFuncHandler);
		v.reverse = new Proxy(v.reverse, changeArrFuncHandler);
		return new Proxy(v, proxyHandler);
	}
	if (v instanceof Set) {
		const s = new Set(v);
		v.clear();
		for (const vv of s) {
			v.add(getProxy(vv));
		}
		v.entries = new Proxy(v.entries, getEntriesFuncHandler(true));
		v.values = new Proxy(v.values, getEntriesFuncHandler(false));
		v.keys = new Proxy(v.keys, getEntriesFuncHandler(false));
		v.add = new Proxy(v.add, addFuncHandler);
		v.has = new Proxy(v.has, hasFuncHandler);
		v.delete = new Proxy(v.delete, deleteSetMapFuncHandler(true));
		v.clear = new Proxy(v.clear, clearFuncHandler);
		return new Proxy(v, proxyHandler);
	}
	if (v instanceof Map) {
		const s = new Map(v);
		v.clear();
		for (const [kk, vv] of s) {
			v.set(getProxy(kk), getProxy(vv));
		}
		v.entries = new Proxy(v.entries, getEntriesFuncHandler(true));
		v.values = new Proxy(v.values, getEntriesFuncHandler(false));
		v.keys = new Proxy(v.keys, getEntriesFuncHandler(false));
		v.get = new Proxy(v.get, getFuncHandler);
		v.set = new Proxy(v.set, setFuncHandler);
		v.delete = new Proxy(v.delete, deleteSetMapFuncHandler(false));
		v.has = new Proxy(v.has, hasFuncHandler);
		v.clear = new Proxy(v.clear, clearFuncHandler);
		return new Proxy(v, proxyHandler);
	}
	for (const i in v) {
		const val = v[i];
		if (typeof val !== "object" || val === null || val === v) {
			continue;
		}
		const d = Object.getOwnPropertyDescriptor(v, i);
		if (d !== undefined && d.writable) {
			v[i] = getProxy(val);
		}
	}
	return new Proxy(v, proxyHandler);
}
const proxyHandler = {
	get(t, n) {
//if (n == "then") {
//console.error("get", t, n, t[n], cur$src, typeof t[n] === "object");
//}
		if (proxyStat.value === 0) {
			proxyStat.value = 1;
		}
		if (n === p_target) {
			return t;
		}
		const v = t[n],
			vType = typeof v;
//		if (cur$src !== null && !isSkipNameType.has(typeof n) && (Array.isArray(t) || !isSkipValueType.has(vType))) {
		if (cur$src !== null && !isSkipNameType.has(typeof n) && !isSkipValueType.has(vType)) {
			addVar(t, n, getTarget(v), cur$src);
			return v;
		}
		return n !== Symbol.iterator ? v : (t instanceof Map ? t.entries : t.values);
	},
	set(t, n, v, r) {
//console.log("set", n, v, "old=>", t[n], t, v === p_target);//, Object.getOwnPropertyDescriptor(t, n) && Object.getOwnPropertyDescriptor(t, n).value);
//todo ---
/*
		if (Array.isArray(t) && n === "length") {
			const oVal = t[n];
			t[n] = v;
//			if (v !== oVal && !Reflect.set(t, n, v)) {//todo проверить: push и ... изменяю длину в фоне - это условие не сработает, а вот splice на удаление вроде бы выдает разные значения
//				return false;
//			}
			setVal(t, n, v, oVal);
			return true;
		}*/
		const vTarget = getTarget(v);
		if (n in t) {
			const oldVTarget = getTarget(t[n]);
//связоно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то оначе например через this.value = 1111
			if (vTarget === oldVTarget) {
				return true;
			}
			t[n] = getProxy(v);
//			if (Reflect.set(t, n, getProxy(v))) {
				setVal(t, n, vTarget, oldVTarget);
				return true;
//			}
//			return false;
		}
		t[n] = getProxy(v);
//		if (Reflect.set(t, n, getProxy(v))) {
			setVal(t, n, vTarget, undefined);
			return true;
//		}
//		return false;
	},
	deleteProperty(t, n, r) {
//console.log("del", t, n, "old=>", getTarget(t[n]));
		if (n in t) {
			const oldV = getTarget(t[n]);
			delete t[n];
//			if (Reflect.deleteProperty(t, n)) {
				setVal(t, n, undefined, oldV);
				return true;
//			}
//			return false;
		}
		return true;
	}
};
const changeArrFuncHandler = {
	apply(f, thisValue, args) {
		const t = thisValue[p_target];
		if (t === undefined) {
console.warn(1111111111, f, thisValue, args);
			return f.apply(thisValue, args);
		}
		for (let i = args.length - 1; i > -1; i--) {
			args[i] = getProxy(args[i]);
		}
		const oldLen = t.length,
			res = f.apply(t, args);
		setVal(t, "length", t.length, oldLen);
		return res;
	}
};
function getEntriesFuncHandler(isEntries) {
	const iteratorFuncHandler = getIteratorFuncHandler(isEntries);
	return {
		apply(f, thisValue, args) {
//console.log(22222222, thisValue, thisValue[p_target], args);
			const t = thisValue[p_target];
			if (t === undefined) {
//console.warn(1111111111, f, thisValue, args);
				return f.apply(thisValue, args);
			}
			const i = f.apply(t, args);
			if (cur$src !== null) {
				i.next = new Proxy(i.next, iteratorFuncHandler);
				i[p_target] = thisValue;
			}
			return i;
		}
	};
};
function getIteratorFuncHandler(isEntries) {
	return {
		apply(f, thisValue, args) {
//console.log("next", thisValue, thisValue[p_target], f, args, cur$src);
			const val = f.apply(thisValue, args);
//-- ?
//			if (!cur$src !== null) {
			if (!cur$src !== null || val.done) {
				return val;
			}
//			if (val.done) {
//				return val;
//			}
			const t = thisValue[p_target][p_target];
			if (isEntries) {
				const [k, v] = val.value;
				addVar(t, getTarget(k), getTarget(v), cur$src);
				return val;
			}
			const vTarget = getTarget(val.value);
			addVar(t, vTarget, vTarget, cur$src);
			return val;
		}
	};
};
const getFuncHandler = {
	apply(f, thisValue, args) {
//console.log("getF", cur$src, thisValue, thisValue[p_target], args);
		const t = thisValue[p_target];
		if (t === undefined) {
			return f.apply(thisValue, args);
		}
		const v = f.apply(t, args);
		if (cur$src !== null) {
			addVar(t, getTarget(args[0]), getTarget(v), cur$src);
		}
		return v;
	}
};
const addFuncHandler = {
	apply(f, thisValue, args) {
		const t = thisValue[p_target];
		if (t === undefined) {
//todo
console.warn(8888, f, thisValue, args);
			return f.apply(thisValue, args);
		}
		const v = args[0],
			vTarget = getTarget(v);
//console.log("addF", t, f, args);
		if (t.has(vTarget)) {
//		if (t.has(v)) {
//			const oldVTarget = getTarget(t.get(v));
//связоно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то оначе например через this.value = 1111
//			if (vTarget === oldVTarget) {
				return thisValue;
//			}
		}
		f.apply(t, [getProxy(v)]);
		setVal(t, vTarget, vTarget, undefined);
		return thisValue;
	}
};
const setFuncHandler = {
	apply(f, thisValue, args) {
		const t = thisValue[p_target];
		if (t === undefined) {
//todo
console.warn(8888, f, thisValue, args);
			return f.apply(thisValue, args);
		}
                const [k, v] = args,
			vTarget = getTarget(v);
//console.log("setF", t, f, args);
		if (t.has(k)) {
			const oldVTarget = getTarget(t.get(k));
//связоно с тем что обновить элемент стоит даже если значение такое же та как он может быть изменен как то оначе например через this.value = 1111
			if (vTarget === oldVTarget) {
				return thisValue;
			}
			f.apply(t, [k, getProxy(v)]);
			setVal(t, getTarget(k), vTarget, oldVTarget);
			return thisValue;
		}
		const kk = getProxy(k);
		f.apply(t, [kk, getProxy(v)]);
		setVal(t, getTarget(k), vTarget, undefined);
		return thisValue;
	}
};
function deleteSetMapFuncHandler(isSet) {
	return {
		apply(f, thisValue, args) {
			const t = thisValue[p_target];
			if (t === undefined) {
//todo
console.warn(8888, f, thisValue, args);
				return f.apply(thisValue, args);
			}
			const k = args[0];
			if (!t.has(k) || !f.apply(t, args)) {
				return false;
			}
			if (isSet) {
				setVal(t, getTarget(k), undefined, k);
			} else {
				setVal(t, getTarget(k), undefined, getTarget(t.get(k)));
			}
			return true;
		}
	};
};
const hasFuncHandler = {
	apply(f, thisValue, args) {
//console.log("hasF", cur$src, thisValue, thisValue[p_target], args);
		return f.apply(thisValue[p_target] || thisValue, args);
	}
};
const clearFuncHandler = {
	apply(f, thisValue, args) {
//console.log("clearF", thisValue, thisValue[p_target], args);
		const t = thisValue[p_target];
		if (t === undefined) {
console.warn(8888, f, thisValue, args);
			return f.apply(thisValue, args);
		}
		const oldSize = t.size;
		f.apply(t, args);
		setVal(t, "size", 0, oldSize);
	}
};
function getTarget(v) {
	return typeof v === "object" && v !== null ? v[p_target] || v : v;
}
//export 
function addVar(t, n, v, $src) {
	const tId = my.ctx.varIdByVar.get(t),
		src = my.ctx.srcBy$src.get($src),
		sId = src.id,
		descr = src.descr;
//	if (!sId) {
//		console.warn("2323 всё норм, но нужно последить - сейчас такое бываес с _loading -> _inc");
//debugger;
//		return;
//	}
	if (isScalarType.has(typeof v) || v === null) {
/*todo может быть нужно так делать
		if (Array.isArray(t) && !isNaN(n)) {
console.warn(445435345, n, typeof n, t, n, v, $src);
			n = Number(n);
		}*/
		if (tId) {
			const s = my.ctx.srcIdsByVarId.get(tId);
			if (s !== undefined) {
				s.add(sId);
			} else {
				my.ctx.srcIdsByVarId.set(tId, new Set([sId]));
//todo
//console.warn(-1, tId);
			}
//1
			descr.varIds.add(tId);

			const vIdByProp = my.ctx.varIdByVarIdByProp.get(tId);
			if (vIdByProp !== undefined) {
				const propId = vIdByProp.get(n);
				if (propId !== undefined) {
//1
					descr.varIds.add(propId);//<--100%

					const s = my.ctx.srcIdsByVarId.get(propId);
					if (s !== undefined) {
						s.add(sId);
						return;
					}
					my.ctx.srcIdsByVarId.set(propId, new Set([sId]));
//console.log(-2, propId, tId, n, v);
					return;
				}
				const newPropId = getNewId();
//console.log(-33, my.ctx.varIdByVarIdByProp.get(tId));
//console.log(-3, newPropId, tId, n, v);
//alert(1);
//1
				vIdByProp.set(n, newPropId);
				my.ctx.srcIdsByVarId.set(newPropId, new Set([sId]));
				descr.varIds.add(newPropId);
				return;
			}
			const newPropId = getNewId();
			my.ctx.varIdByVarIdByProp.set(tId, new Map([[n, newPropId]]));
			my.ctx.srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(-44, new Set(my.ctx.varIdByVarIdByProp.get(tId)));
//console.log(-4, newPropId, tId, n, v);
//1
			descr.varIds.add(newPropId);
			return;
		}
		const nId = getNewId();
		my.ctx.varIdByVar.set(t, nId);
		my.ctx.varById.set(nId, t);
		my.ctx.srcIdsByVarId.set(nId, new Set([sId]));
//console.log(-5, nId);
//1
		descr.varIds.add(nId);

		const newPropId = getNewId();
		my.ctx.varIdByVarIdByProp.set(nId, new Map([[n, newPropId]]));
		my.ctx.srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(-6, newPropId, nId, t, n, v, $src);
//alert(1)
//1
		descr.varIds.add(newPropId);
		return;
	}
	if (tId) {
		const s = my.ctx.srcIdsByVarId.get(tId);
		if (s !== undefined) {
			s.add(sId);
		} else {
			my.ctx.srcIdsByVarId.set(tId, new Set([sId]));
//console.log(-7, tId);
		}
//1
		descr.varIds.add(tId);
	} else {
		const nId = getNewId();
		my.ctx.varIdByVar.set(t, nId);
		my.ctx.varById.set(nId, t);
		my.ctx.srcIdsByVarId.set(nId, new Set([sId]));
//console.log(-8, sId);
//1
		descr.varIds.add(nId);
	}
	const vId = my.ctx.varIdByVar.get(v);
	if (vId) {
		const s = my.ctx.srcIdsByVarId.get(vId);
		if (s !== undefined) {
			s.add(sId);
		} else {
			my.ctx.srcIdsByVarId.set(vId, new Set([sId]));
//console.log(-9, sId);
		}
//1
		descr.varIds.add(vId);
		return;
	}
	const newValId = getNewId();
	my.ctx.varIdByVar.set(v, newValId);
	my.ctx.varById.set(newValId, v);
	my.ctx.srcIdsByVarId.set(newValId, new Set([sId]));
//console.log(-10, sId);
//1
	descr.varIds.add(newValId);
}
function setVal(t, n, v, oldV) {//!! data.arr.unshift(1); data.arr.unshift(2); - если так сделалть, то после первого - будут удалены my.ctx.varIdByVar.get(oldId), что приведет к тому что все пойдет по ветке !oldId - непонятно нужно ли что-то с этим делать??
	const tId = my.ctx.varIdByVar.get(t);
//console.info("setVar", "name=>", n, typeof n, "\nvalue=>", v, "\ntarget=>", t, "\ntId=>", tId, "\noldVal=>", oldV);
	if (!tId) {//!tId - такое получается когда данные изменяются, а отрисовки ещё небыло - первая загрузка странцы и добавление данных на старте - это корректно
		return;
	}
/*todo может быть нужно так делать
	if (Array.isArray(t) && !isNaN(n)) {
//todo
console.warn(423423, n, typeof n, t, n, v, oldV)
		n = Number(n);
	}*/
	const vIdByProp = my.ctx.varIdByVarIdByProp.get(tId),
//		oldScalarId = vIdByProp !== undefined ? vIdByProp.get(n) : 0,
//		oId = oldScalarId ? my.ctx.varIdByVar.get(oldV) : 0;
		oldScalarId = vIdByProp !== undefined && vIdByProp.get(n) || 0,
		oId = oldScalarId !== 0 && my.ctx.varIdByVar.get(oldV) || 0;
	if (my.debugLevel === 2) {
		console.info("my.proxy => setVar", "\n\tname=>", n, "\n\tvalue=>", v, "\n\toldVal=>", oldV, "\n\ttId=>", tId, "\n\ttarget=>", t, "\n\toldId=>", oId, "\n\toldScalarId=>", oldScalarId);//, "\n\t$current=>", cur$src);
	}
//console.error("setVar", n, v, tId, oId, oldV, oldScalarId, cur$src);
	if (cur$src !== null) {
//		proxyStat.value = 2;
		addVar(t, n, v, cur$src);
	}
/*!!нет в этом смысла
	if (!oId) {//если в разметке нет этого свойства, а оно используется в расчётах - для того чтобы на следующем круге понять что оно уже использовалось и не нужно чистить кэш по условию !oId
		if (isScalarType.has(typeof v) || v === null) {
			const newPropId = getNewId();
			if (vIdByProp) {
				vIdByProp.set(n, newPropId);
			} else {
				my.ctx.varIdByVarIdByProp.set(tId, new Map([[n, newPropId]]));
			}
		} else {
			const newId = getNewId();
			my.ctx.varIdByVar.set(v, newId);
			my.ctx.varById.set(newId, v);
		}
	}*/
/*--
	if (!oId) {
		const s = my.ctx.srcIdsByVarId.get(tId);//для push - нового элемента нет, а обновить надо - это актуально когда нет if .length
		if (s) {
//			for (const sId of s) {//
//console.log(sId, cache[sId]);
//				delete cache[sId];
////				delete currentCache[sId];
//			}
			renderBySrcIds(s);
		}
		return;
	}*/
	if (oldScalarId && !isScalarType.has(typeof v) && v !== null) {//это нужно для того: Изначально data.filter в proxy.get (при рендере) установится как скаляр (undef), - если новое значение объект, то нужно удалить ид из свойств
		vIdByProp.delete(n);
//!!todo GC
		if (vIdByProp.size === 0) {
			my.ctx.varIdByVarIdByProp.delete(tId);
		}
	}
//	_setVal(t, n, oldV, my.ctx.srcIdsByVarId.get(oId || tId), oId);
//}
//function _setVal(t, n, oldV, s, oId) {
	const s = my.ctx.srcIdsByVarId.get(oId || tId);
	if (s === undefined) {
//!!todo
//console.error("!S!", t, n, oldV, s, oId);
//alert(1);
		return;
	}
//console.error("_setVal", t, n, oldV, s, oId);
	const toRender = new Set(s),
		toClear = new Set(),
		srcBy$src = my.ctx.srcBy$src;//s);
	for (const sId of s) {
		const $i = my.ctx.$srcById.get(sId);
		if ($i === undefined || toClear.has(sId)) {//похоже это при удалении элементов
//			console.warn(2, sId);
			continue;
		}
//2021-07-20 - data.arr[2] = 1111 - не очитит data.arr, но и не нужно - так как в кэше ссылка на arr
		const iDescr = srcBy$src.get($i).descr;
		if (iDescr.asOnes === null) {
			toClear.add(sId);
			setInnerSrcIdSetBy$src(toClear, $i);
			continue;
		}
		const $els = get$els($i, iDescr.get$elsByStr, "");
		for (let j = $els.length - 1; j > -1; j--) {
			const $j = $els[j],
				jSrc = srcBy$src.get($j);
			if (jSrc !== undefined) {
				toClear.add(jSrc.id);
				setInnerSrcIdSetBy$src(toClear, $j);
			}
		}
	}
//console.log(1, toClear, n);
/*
for (const sId of toClear) {
	console.log(2, sId, my.ctx.$srcById[sId]);
}*/
	if (oId !== 0) {
		const deletedVarId = new Set();
		for (const sId of toClear) {
			const c = my.ctx.srcById.get(sId).cache;
//			if (c === null) {
//				continue;
//			}
			c.value = new Map();
//console.log(61, sId)
/*todo
			if (!t[p_isUnshift]) {
				c.current = type_cacheCurrent();
console.log(11111111, sId);
			}*/
			decVar(t, n, oldV, sId, oId, deletedVarId);
		}
		if (deletedVarId.size !== 0) {
//todo
			requestIdleCallback(() => {
				for (const d of my.ctx.descrById.values()) {
					if (d.varIds === null) {
						continue;
					}
					for (const vId of deletedVarId) {
//						if (d.varIds.has(vId)) {
							d.varIds.delete(vId);
//						}
					}
				}
			}, defIdleCallbackOpt);
		}
	} else {
//console.log(1111, n, oldV, toClear);
		for (const sId of toClear) {
			const c = my.ctx.srcById.get(sId).cache;
//			if (c === null) {
//				continue;
//			}
			c.value = new Map();//<-если это новый элемент массива
//console.log(62, sId)
//todo c.current нужен для храниения текущего значения команды, удаляя его мы нарушаем идею его использования
//			c.current = type_cacheCurrent();
//--			decVar(t, n, oldV, sId, oId);
		}
	}
//console.error("renderBySrcIds => ", t, n, t[n], oldV, toRender, cur$src);
	renderBySrcIds(toRender);
}
function setInnerSrcIdSetBy$src(toClear, $i) {
	const srcBy$src = my.ctx.srcBy$src,
		$parent = $i.parentNode;
	do {
		const iSrc = srcBy$src.get($i);
		if (iSrc !== undefined && iSrc.isCmd) {
			toClear.add(iSrc.id);
		}
//////////////////////
		if ($i.firstChild !== null) {
			$i = $i.firstChild;
			continue;
		}
		if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
			break;
		}
		if ($i.nextSibling !== null) {
			$i = $i.nextSibling;
			continue;
		}
//		while ($i = $i.parentNode) {
		do {
			$i = $i.parentNode;
			if ($i.parentNode === $parent) {
				$i = null;
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				break;
			}
		} while (true);
	} while ($i !== null);
}
function decVar(t, n, v, sId, vId, deletedVarId) {
	if (vId === 0) {
		if (isScalarType.has(typeof v) || v === null) {
			const vIdByProp = my.ctx.varIdByVarIdByProp.get(my.ctx.varIdByVar.get(t));
			if (vIdByProp !== undefined) {
				vId = vIdByProp.get(n);
				if (vId === undefined) {
					vId = 0;
				}
			}
		} else {
			vId = my.ctx.varIdByVar.get(v);
			if (vId === undefined) {
				vId = 0;
			}
		}
	}
	if (vId !== 0) {
		const s = my.ctx.srcIdsByVarId.get(vId);
		if (s === undefined || !s.has(sId)) {
			delVar(vId, v, t, n, deletedVarId);
			return;
		}
		s.delete(sId);
		if (s.size === 0) {
			delVar(vId, v, t, n, deletedVarId);
		}
	}
	if (Array.isArray(v)) {
		const len = v.length;
		for (let i = 0; i < len; i++) {
			decVar(v, i, getTarget(v[i]), sId, 0, deletedVarId);
		}
		return;
	}
//todo Set and Map
	if (typeof v !== "object" || v === null) {
		return;
	}
	for (const i in v) {
		decVar(v, i, getTarget(v[i]), sId, 0, deletedVarId);
	}
}
function delVar(vId, v, t, n, deletedVarId) {
//console.log("DEL", vId);
	deletedVarId.add(vId);
	my.ctx.srcIdsByVarId.delete(vId);
	if (isScalarType.has(typeof v) || v === null) {
		const vIdByProp = my.ctx.varIdByVarIdByProp.get(vId = my.ctx.varIdByVar.get(t));
		if (vIdByProp === undefined) {
			return;
		}
		vIdByProp.delete(n);
		if (vIdByProp.size === 0) {
			my.ctx.varIdByVarIdByProp.delete(vId);
		}
		return;
	}
	//пробегать по свойствам объекта и удалять их - не нужно, так как свойства могут быть (объекты и скаляры) использоваться где-нибудь ещё
	my.ctx.varIdByVar.delete(v);
	my.ctx.varById.delete(vId);
//!!	my.ctx.varIdByVarIdByProp.delete(vId);
	const vIdByProp = my.ctx.varIdByVarIdByProp.get(vId);
//!! не надо - там должно быть песто, но если нет - то можно будет заметить
//!! сейчас там то что не используется, - по какойто причине в get прокси запрашивается "then" - хотя в шаблоне нет такого запроса
	if (vIdByProp !== undefined) {
		my.ctx.varIdByVarIdByProp.delete(vId);
		for (const pId of vIdByProp.values()) {
			my.ctx.srcIdsByVarId.delete(pId);
		}
	}
}
