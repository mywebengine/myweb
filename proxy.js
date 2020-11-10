﻿import {cache, type_cacheValue, type_cacheCurrent} from "./cache.js";
import {srcId, descrId, isCmd, _target, dataVarName, cmdVarName} from "./config.js";
import {$srcById, descrById, getNewId} from "./descr.js";
import {getIdx, getTopLocalId} from "./dom.js";
import {renderBySrcIdSet} from "./render/algo.js";
import {reqCmd} from "./req.js";
import {oset} from "./util.js";

export const varIdByVar = new Map();
export const varIdByVarIdByProp = {};
export const srcIdSetByVarId = new Map();
//!!!!!!!!!!!!
self.varIdByVar = varIdByVar;
self.varIdByVarIdByProp = varIdByVarIdByProp;
self.srcIdSetByVarId = srcIdSetByVarId;

const _isUnshift = Symbol();
/*
const isValuesOnlyArrayByVarId = {};
const oldArray = {};
const oldStateByVarIdByProp = {};*/

const isSkipNameType = {
	"undefined": true,
	"symbol": true
};
const isSkipValueType = {
	"function": true
};
const isScalarType = {
	"boolean": true,
	"number": true,
	"string": true,
	"undefined": true
};

export let cur$src;
export function setCur$src($src) {
	cur$src = $src;
}
let isScoping;
export function setIsScoping(f) {
	isScoping = f;
}
export let proxyStat = 1;
export function setProxyStat(stat) {
	proxyStat = stat;
}
export let proxySetInSet = [];
export function setProxySetInSet(v) {
	proxySetInSet = v;
}

export function getProxy(v) {
	if (typeof v === "object" && v !== null) {
		const t = v[_target];
		if (t || t === null) {
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
		v.unshift = new Proxy(v.unshift, unshiftHandler);
		return new Proxy(v, proxyHandler);
	}
//todo Sen and Map || not todo
	for (const i in v) {
		v[i] = getProxy(v[i]);
	}
	return new Proxy(v, proxyHandler);
}
export function getTarget(v) {
	return typeof v === "object" && v !== null && v[_target] || v;
}
const proxyHandler = {
	get(t, n) {
//console.log("get", t, n, t[n], cur$src, typeof t[n] === "object");
		if (proxyStat === 0) {
			proxyStat = 1;
		}
		if (n === _target) {
			return t;
		}
		const v = t[n];
		if (cur$src && !isSkipValueType[typeof v] && !isSkipNameType[typeof n]) {
			addVar(t, n, getTarget(v), cur$src);
		}
		return v;
	},
	set(t, n, v) {
//console.log('set', n, v, "old=>", t[n]);//, Object.getOwnPropertyDescriptor(t, n) && Object.getOwnPropertyDescriptor(t, n).value);
		if (Array.isArray(t) && n === "length") {
			const oVal = t[n];
			if (v !== oVal && !Reflect.set(t, n, v)) {//todo проверить: push и ... изменяю длину в фоне - это условие не сработает, а вот splice на удаление вроде бы выдает разные значения
				return false;
			}
			setVal(t, n, v, oVal);
			return true;
//			t[n] = v;
//			setVal(t, n, v, oVal);
//			return true;
		}
		const vTarget = getTarget(v);
		if (n in t) {
			const oldVTarget = getTarget(t[n]);
			if (vTarget === oldVTarget) {
				return true;
			}
			if (Reflect.set(t, n, getProxy(v))) {
				setVal(t, n, vTarget, oldVTarget);
				return true;
			}
			return false;
//			t[n] = getProxy(v);
//			setVal(t, n, vTarget, oldVTarget);
//			return true;
		}
		if (Reflect.set(t, n, getProxy(v))) {
			setVal(t, n, vTarget, undefined);
			return true;
		}
		return false;
//		t[n] = getProxy(v);
//		setVal(t, n, vTarget, undefined);
//		return true;
	},
	deleteProperty(t, n) {
		const oldV = getTarget(t[n]);
//console.log('del', t, n, "old=>", oldV);
		if (n in t) {
			if (Reflect.deleteProperty(t, n)) {
				setVal(t, n, undefined, oldV);
				return true;
			}
			return false;
//			delete t[n];
//			setVal(t, n, undefined, getTarget(t[n]));
		}
		return true;
	}
};
const unshiftHandler = {
	apply(t, thisValue, args) {
		getTarget(thisValue)[_isUnshift] = true;
		Reflect.apply(t, thisValue, args);
//		t.apply(thisValue, args);
	}
};
export function addVar(t, n, v, $src) {
//	gc();
	const tId = varIdByVar.get(t),
		sId = $src[srcId],
		d = descrById.get($src[descrId]);
	if (isScalarType[typeof v]) {
		if (Array.isArray(t) && !isNaN(n)) {
			n = Number(n);
		}
		if (tId) {
			const s = srcIdSetByVarId.get(tId);
			if (s) {
				s.add(sId);
			} else {
				srcIdSetByVarId.set(tId, new Set([sId]));
			}
//1
			d.varIdSet.add(tId);

			const vIdByProp = varIdByVarIdByProp[tId];
			if (vIdByProp) {
				const propId = vIdByProp.get(n);
				if (propId) {
//1
					d.varIdSet.add(propId);//<--100%

					const s = srcIdSetByVarId.get(propId);
					if (s) {
						s.add(sId);
						return;
					}
					srcIdSetByVarId.set(propId, new Set([sId]));
					return;
				}
				const newPropId = getNewId();
				vIdByProp.set(n, newPropId);
				srcIdSetByVarId.set(newPropId, new Set([sId]));
//1
				d.varIdSet.add(newPropId);
				return;
			}
			const newPropId = getNewId();
			varIdByVarIdByProp[tId] = new Map([[n, newPropId]]);
			srcIdSetByVarId.set(newPropId, new Set([sId]));
//1
			d.varIdSet.add(newPropId);
			return;
		}
		const nId = getNewId();
		varIdByVar.set(t, nId);
		srcIdSetByVarId.set(nId, new Set([sId]));
//1
		d.varIdSet.add(nId);

		const newPropId = getNewId();
		varIdByVarIdByProp[nId] = new Map([[n, newPropId]]);
		srcIdSetByVarId.set(newPropId, new Set([sId]));
//1
		d.varIdSet.add(newPropId);
		return;
	}
	if (tId) {
		const s = srcIdSetByVarId.get(tId);
		if (s) {
			s.add(sId);
		} else {
			srcIdSetByVarId.set(tId, new Set([sId]));
		}
//1
		d.varIdSet.add(tId);
	} else {
		const nId = getNewId();
		varIdByVar.set(t, nId);
		srcIdSetByVarId.set(nId, new Set([sId]));
//1
		d.varIdSet.add(nId);
	}
	const vId = varIdByVar.get(v);
	if (vId) {
		const s = srcIdSetByVarId.get(vId);
		if (s) {
			s.add(sId);
		} else {
			srcIdSetByVarId.set(vId, new Set([sId]));
		}
//1
		d.varIdSet.add(vId);
		return;
	}
	const newValId = getNewId();
	varIdByVar.set(v, newValId);
	srcIdSetByVarId.set(newValId, new Set([sId]));
//1
	d.varIdSet.add(newValId);
}
function setVal(t, n, v, oldV) {//!! data.arr.unshift(1); data.arr.unshift(2); - если так сделалть, то после первого - будут удалены varIdByVar.get(oldId), что приведет к тому что все пойдет по ветке !oldId - непонятно нужно ли что-то с этим делать??
	const tId = varIdByVar.get(t);
//console.info('setVar', "name=>", n, "\nvalue=>", v, "\ntarget=>", t, "\ntId=>", tId, "\noldVal=>", oldV);
	if (!tId) {//!tId - такое получается когда данные изменяются, а отрисовки ещё небыло - первая загрузка странцы и добавление данных на старте - это корректно
		return;
	}
	if (Array.isArray(t) && !isNaN(n)) {
		n = Number(n);
	}
	const vIdByProp = varIdByVarIdByProp[tId],
		oldScalarId = vIdByProp && vIdByProp.get(n) || 0,
		oId = oldScalarId || varIdByVar.get(oldV) || 0;
	if (t[_isUnshift]) {
		if (n === "length") {
			_setVal(t, n, oldV, srcIdSetByVarId.get(tId), oId);
			delete t[_isUnshift];
		}
		return;
	}
//console.error('setVar', n, v, tId, oId, oldV, oldScalarId, cur$src);
	if (cur$src) {
//		proxyStat = 2;
		proxySetInSet.push(type_proxySetInSet(t, n, v, cur$src));
	}
	if (!oId) {
		const s = srcIdSetByVarId.get(tId);//для push - нового элемента нет, а обновить надо - это актуально когда нет if .length
		if (s) {
//			for (const sId of s) {//
//console.log(sId, cache[sId]);
//				delete cache[sId];
////				delete currentCache[sId];
//			}
			renderBySrcIdSet(s);
		}
		return;
	}
	if (oldScalarId && !isScalarType[typeof v]) {//это нужно для того: Изначально data.filter в proxy.get (при рендере) установится как скаляр (=undef), - если новое значение объект, то нужно удалить ид из свойств
		vIdByProp.delete(n);
//!!todo GC
		if (!vIdByProp.size) {
			delete varIdByVarIdByProp[tId];
		}
	}
	_setVal(t, n, oldV, srcIdSetByVarId.get(oId), oId, oldScalarId);
}
function type_proxySetInSet(t, n, v, $src) {
	return {
		t,
		n,
		v,
		$src
	};
}
function _setVal(t, n, oldV, s, oId, oldScalarId) {
	if (!s) {
//!!todo
console.error("!S!", t, n, oldV, s, oId, oldScalarId);
//alert(1);
		return;
	}
	const toRender = new Set(s),
		vSet = new Set(s);
	for (const sId of s) {
		const $i = $srcById[sId];
		if (!$i) {//похоже это при удалении элементов
//			console.warn(2, sId);
			continue;
		}
		setInnerSrcIdSetBy$src(vSet, $i);
		const d = descrById.get($i[descrId]);
		if (d.isAsOne) {
			for (const str of d.attr.keys()) {
				if (reqCmd[str].cmd.isAsOne) {
					const idx = getIdx($i, str);
					for (let $j = $i.nextSibling; $j; $j = $j.nextSibling) {
						if ($j.nodeType === 1) {
							if (getIdx($j, str) !== idx) {
								break;
							}
							vSet.add($j[srcId]);
							setInnerSrcIdSetBy$src(vSet, $j);
						}
					}
					break;
				}
			}
		}
	}
	if (isScoping) {
		return;
	}
	if (oId) {
		for (const sId of vSet) {
			const c = cache[sId];
			if (c) {
//console.log(sId, c, n, $srcById[sId]);
				c.value = type_cacheValue();
				if (!t[_isUnshift]) {
					c.current = type_cacheCurrent();
				}
				decVar(t, n, oldV, sId, oId);
			}
		}
	} else {
		for (const sId of vSet) {
			const c = cache[sId];
			if (c) {
				c.value = type_cacheValue();
				c.current = type_cacheCurrent();
			}
		}
	}
/*
//todo GC
////	if (!s.size) {
		delVar(oId, oldV, t, n);
////	}*/
	renderBySrcIdSet(toRender);
}
function setInnerSrcIdSetBy$src(vSet, $e) {
	const $p = $e.parentNode;
	let $i = $e;
	do {
		if ($i[isCmd]) {
			vSet.add($i[srcId]);
		}
		if ($i.firstChild) {
			$i = $i.firstChild;
			continue;
		}
		if ($i.parentNode === $p) {
			break;
		}
		if ($i.nextSibling) {
			$i = $i.nextSibling;
			continue;
		}
		while ($i = $i.parentNode) {
			if ($i.parentNode === $p) {
				$i = null;
				break;
			}
			if ($i.nextSibling) {
				$i = $i.nextSibling;
				break;
			}
		}
	} while ($i);
/*
	for ($i = $i.firstChild; $i; $i = $i.nextSibling) {
		if ($i.nodeType === 1) {
			const sId = $i[srcId];
			if (sId) {
				vSet.add(sId);
				setInnerSrcIdSetBy$src(vSet, $i);
			}
		}
	}*/
}
function decVar(t, n, v, sId/*, deletedVarIdSetBySrcId*/, vId) {
	if (!vId) {
		if (isScalarType[typeof v]) {
			const vIdByProp = varIdByVarIdByProp[varIdByVar.get(t)];
			if (vIdByProp) {
				vId = vIdByProp.get(n);
			}
		} else {
			vId = varIdByVar.get(v);
		}
	}
//console.log(222222, vId);//, t, n, v, sId);
	if (vId) {
		const s = srcIdSetByVarId.get(vId);
//!! !s
		if (!s || !s.has(sId)) {
			return;
		}
		s.delete(sId);
//todo GC
		if (!s.size) {
			delVar(vId, v, t, n);
		}
/*
		const del = deletedVarIdSetBySrcId[sId];
		if (del) {
//			if (!del.has(vId)) {
				del.add(vId);
//			}
		} else {
			deletedVarIdSetBySrcId[sId] = new Set([vId]);
		}*/
	}
	if (Array.isArray(v)) {
		const len = v.length;
		for (let i = 0; i < len; i++) {
			decVar(v, i, getTarget(v[i]), sId/*, deletedVarIdSetBySrcId*/, 0);
		 }
		return;
	}
//todo Set and Map
	if (typeof v !== "object" || v === null) {
		return;
	}
	for (const i in v) {
		decVar(v, i, getTarget(v[i]), sId/*, deletedVarIdSetBySrcId*/, 0);
	}
}
function delVar(vId, v, t, n) {
//console.log("DEL", vId);
	srcIdSetByVarId.delete(vId);
	if (isScalarType[typeof v]) {
		const vIdByProp = varIdByVarIdByProp[varIdByVar.get(t)];
		if (vIdByProp) {
			vIdByProp.delete(n);
		}
		return;
	}
	//пробегать по свойствам объекта и удалять их - не нужно, так как свойства могут быть (объекты и скаляры) использоваться гденибудь
	varIdByVar.delete(v);
	const vIdByProp = varIdByVarIdByProp[vId];
	if (vIdByProp) {
		for (const propId of vIdByProp.values()) {
			srcIdSetByVarId.delete(propId);
		}
		delete varIdByVarIdByProp[vId];
	}
//	delete isValuesOnlyArrayByVarId[vId];
}




/*
let _cl = false;
function gc() {
//	if (_cl) {
	if (1) {
		return;
	}
	_cl = true;
	setTimeout(() => {
		requestIdleCallback(() => {
			_gc();
			_cl = false;
		});
	}, 1000);
}
function _gc() {
	for (const [v, vId] of varIdByVar) {
		const s = srcIdSetByVarId.get(vId);
		if (s && s.size) {
			if (varIdByVarIdByProp[vId]) {
				for (const [k, i] of varIdByVarIdByProp[vId]) {
					const ss = srcIdSetByVarId.get(i);
//if (k === 'rateDurationLeft') {
//	console.log(vId, i, ss);
//}
					if (ss && !ss.size) {
						srcIdSetByVarId.delete(i);
					}
				}
			}
			continue;
		}
		varIdByVar.delete(v);
		srcIdSetByVarId.delete(vId);
		if (varIdByVarIdByProp[vId]) {
			for (const i of varIdByVarIdByProp[vId].values()) {
				srcIdSetByVarId.delete(i);
			}
			delete varIdByVarIdByProp[vId];
		}
		delete isValuesOnlyArrayByVarId[vId];
//иначе получается, что в ДОМ мы теряем ссылки
//		for (const d of descrById.values()) {
////			if (d.varIdSet.has(vId)) {
//				d.varIdSet.delete(vId);
////			}
//		}
console.log("del", vId, v);
	}
//console.log("gc");
}*/




export function getLocalScopeProxyHandler($e, str, propName) {
	return {
		get(t, n) {
			const v = t[n];
//console.error("inc get", t, n, t[n], !!(v || n in t[_target]), $e, str);
			if (v || n in t) {
				return v;
			}
			const lData = self.localScope[getTopLocalId($e, str)];
//console.log("scope.js", n, getTopLocalId($e, str), str, $e);
			if (lData) {
				const lD = lData[propName],
					lV = lD[n];
				if (lV || n in lD) {
					return lD[n];
				}
			}
//console.log(777, t, n, $e, str, propName);
			if (self[propName]) {
				return self[propName][n];
			}
		},
		set(t, n, v) {
			if (n in t) {
				return Reflect.set(t, n, v);
			}
			const lData = self.localScope[getTopLocalId($e, str)];
			if (lData) {
				const lD = lData[propName];
				if (n in lD) {
					return Reflect.set(lD, n, v);
				}
			}
			if (self[propName] && n in self[propName]) {
				return Reflect.set(self[propName], n, v);
			}
			return Reflect.set(t, n, v);
		},
		deleteProperty(t, n) {
			if (n in t) {
				return Reflect.deleteProperty(t, n);
			}
			const lData = self.localScope[getTopLocalId($e, str)];
			if (lData) {
				const lD = lData[propName];
				if (n in lD) {
					return Reflect.deleteProperty(lD, n);
				}
			}
			if (self[propName] && n in self[propName]) {
				return Reflect.deleteProperty(self[propName], n);
			}
			return true;
		}
	};
}
