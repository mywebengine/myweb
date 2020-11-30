import {cache, type_cacheValue, type_cacheCurrent} from "./cache.js";
import {Tpl_$src, p_srcId, p_descrId, p_isCmd, p_target, dataVarName, cmdVarName} from "./config.js";
import {$srcById, descrById, getNewId} from "./descr.js";
import {getIdx, getTopLocal} from "./dom.js";
import {renderBySrcIdSet} from "./render/algo.js";
import {reqCmd} from "./req.js";
import {oset} from "./util.js";

export const varIdByVar = new Map();
export const varById = {};
export const varIdByVarIdByProp = {};
export const srcIdSetByVarId = new Map();
//!!!!!!!!!!!!
self.varIdByVar = varIdByVar;
self.varById = varById;
self.varIdByVarIdByProp = varIdByVarIdByProp;
self.srcIdSetByVarId = srcIdSetByVarId;


//todo--
self.aa = function() {
	const v = new Set(Array.from(varIdByVar.values()));
	for (const [vId, srcIdSet] of srcIdSetByVarId) {
		let fv;
		if (!v.has(vId)) {
			let f;
			for (const vvId of v) {
				if (!varIdByVarIdByProp[vvId]) {
					continue;
				}
				for (const pId of varIdByVarIdByProp[vvId].values()) {
					if (pId === vId) {
						for (const sId of srcIdSet) {
							if (!$srcById[sId]) {
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
				console.log(0, vId, srcIdSet);
			}
		} else {
			for (const sId of srcIdSet) {
				if (!$srcById[sId]) {
					console.log(11111, vId, sId);
				}
			}
		}
	}
	for (const vId of varIdByVar.keys()) {
		const s = srcIdSetByVarId.get(vId);
		if (!s) {// || !s.has(sId)) {
			continue;
		}
		for (const sId of s) {
			if (!$srcById[sId]) {
				console.log(1, sId);
			}
		}
		const vIdByProp = varIdByVarIdByProp[vId];
		if (vIdByProp) {
			for (const pId of vIdByProp.values()) {
				const propS = srcIdSetByVarId.get(pId);
				if (propS) {// && propS.has(sId)) {
//					_del(pId, propS, sId);//, d, dId);
					for (const sId of propS) {
						if (!$srcById[sId]) {
							console.log(2, sId);
						}
					}
				}
			}
		}
	}
}


const _isUnshift = Symbol();
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
		const t = v[p_target];
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
	return typeof v === "object" && v !== null && v[p_target] || v;
}
const proxyHandler = {
	get(t, n) {
//if (n == "then") {
//console.error("get", t, n, t[n], cur$src, typeof t[n] === "object");
//}
		if (proxyStat === 0) {
			proxyStat = 1;
		}
		if (n === p_target) {
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
//		if (n in t) {
			if (Reflect.deleteProperty(t, n)) {
//console.log(1, t, n);
				setVal(t, n, undefined, oldV);
				return true;
			}
			return false;
//			delete t[n];
//			setVal(t, n, undefined, getTarget(t[n]));
//		}
//		return true;
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
//console.log("addVar", n, v, t, $src, $src[p_srcId]);
//	gc();
	const tId = varIdByVar.get(t),
		sId = $src[p_srcId],
		d = descrById.get($src[p_descrId]);
	if (isScalarType[typeof v] || v === null) {
		if (Array.isArray(t) && !isNaN(n)) {
			n = Number(n);
		}
		if (tId) {
			const s = srcIdSetByVarId.get(tId);
			if (s) {
				s.add(sId);
			} else {
				srcIdSetByVarId.set(tId, new Set([sId]));
//console.log(1, tId);
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
//console.log(2, propId);
					return;
				}
				const newPropId = getNewId();
				vIdByProp.set(n, newPropId);
				srcIdSetByVarId.set(newPropId, new Set([sId]));
//console.log(3, newPropId);
//1
				d.varIdSet.add(newPropId);
				return;
			}
			const newPropId = getNewId();
			varIdByVarIdByProp[tId] = new Map([[n, newPropId]]);
			srcIdSetByVarId.set(newPropId, new Set([sId]));
//console.log(4, newPropId);
//1
			d.varIdSet.add(newPropId);
			return;
		}
		const nId = getNewId();
		varIdByVar.set(t, nId);
		varById[nId] = t;
		srcIdSetByVarId.set(nId, new Set([sId]));
//console.log(5, nId);
//1
		d.varIdSet.add(nId);

		const newPropId = getNewId();
		varIdByVarIdByProp[nId] = new Map([[n, newPropId]]);
		srcIdSetByVarId.set(newPropId, new Set([sId]));
//console.log(6, newPropId, t, n, v, $src);
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
//console.log(7, tId);
		}
//1
		d.varIdSet.add(tId);
	} else {
		const nId = getNewId();
		varIdByVar.set(t, nId);
		varById[nId] = t;
		srcIdSetByVarId.set(nId, new Set([sId]));
//console.log(8, sId);
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
//console.log(9, sId);
		}
//1
		d.varIdSet.add(vId);
		return;
	}
	const newValId = getNewId();
	varIdByVar.set(v, newValId);
	varById[newValId] = v;
	srcIdSetByVarId.set(newValId, new Set([sId]));
//console.log(10, sId);
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
//console.error('setVar', tId, oId, oldScalarId, n, t);
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
	if (oldScalarId && !isScalarType[typeof v] || v === null) {//это нужно для того: Изначально data.filter в proxy.get (при рендере) установится как скаляр (=undef), - если новое значение объект, то нужно удалить ид из свойств
		vIdByProp.delete(n);
//!!todo GC
		if (!vIdByProp.size) {
			delete varIdByVarIdByProp[tId];
		}
	}
	_setVal(t, n, oldV, srcIdSetByVarId.get(oId), oId, oldScalarId);
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
		const d = descrById.get($i[p_descrId]);
		if (!d.isAsOne) {
			continue;
		}
		for (const str of d.attr.keys()) {
			if (reqCmd[str].cmd.isAsOne) {
				const idx = getIdx($i, str);
				for (let $j = $i.nextSibling; $j; $j = $j.nextSibling) {
//					if ($j.nodeType === 1) {
					if ($j[p_isCmd]) {
						if (getIdx($j, str) !== idx) {
							break;
						}
						vSet.add($j[p_srcId]);
						setInnerSrcIdSetBy$src(vSet, $j);
					}
				}
				break;
			}
		}
	}
	if (isScoping) {
		return;
	}
	if (oId) {
		const deletedVarId = new Set();
		for (const sId of vSet) {
			const c = cache[sId];
			if (c) {
				c.value = type_cacheValue();
//console.log(sId, n, oId, cache[sId].value);
/*todo
				if (!t[_isUnshift]) {
					c.current = type_cacheCurrent();
console.log(11111111, sId);
				}*/
				decVar(t, n, oldV, sId, oId, deletedVarId);
			}
		}
		if (deletedVarId.size) {
			requestIdleCallback(() => {
				for (const vId of deletedVarId) {
					for (const d of descrById.values()) {
						if (d.varIdSet && d.varIdSet.has(vId)) {
							d.varIdSet.delete(vId);
						}
					}
				}
			});
		}
	} else {
		for (const sId of vSet) {
			const c = cache[sId];
			if (c) {
				c.value = type_cacheValue();
				c.current = type_cacheCurrent();
//--				decVar(t, n, oldV, sId, oId);
			}
		}
	}
	renderBySrcIdSet(toRender);
}
function setInnerSrcIdSetBy$src(vSet, $i) {
	const $parent = $i.parentNode;
	do {
		if ($i[p_isCmd]) {
			vSet.add($i[p_srcId]);
		}
		if ($i.firstChild) {
			$i = $i.firstChild;
			continue;
		}
		if ($i.parentNode === $parent) {
			break;
		}
		if ($i.nextSibling) {
			$i = $i.nextSibling;
			continue;
		}
		while ($i = $i.parentNode) {
			if ($i.parentNode === $parent) {
				$i = null;
				break;
			}
			if ($i.nextSibling) {
				$i = $i.nextSibling;
				break;
			}
		}
	} while ($i);
}
function decVar(t, n, v, sId, vId, deletedVarId) {
	if (!vId) {
		if (isScalarType[typeof v] || v === null) {
			const vIdByProp = varIdByVarIdByProp[varIdByVar.get(t)];
			if (vIdByProp) {
				vId = vIdByProp.get(n);
			}
		} else {
			vId = varIdByVar.get(v);
		}
	}
	if (vId) {
		const s = srcIdSetByVarId.get(vId);
		if (!s || !s.has(sId)) {
			delVar(vId, v, t, n, deletedVarId);
			return;
		}
		s.delete(sId);
//if (sId == 26) {
//console.log(222222, vId, t, n, v, sId);
//}
		if (!s.size) {
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
	srcIdSetByVarId.delete(vId);
	if (isScalarType[typeof v] || v === null) {
		const vIdByProp = varIdByVarIdByProp[vId = varIdByVar.get(t)];
		if (vIdByProp) {
			vIdByProp.delete(n);
			if (!vIdByProp.size) {
				delete varIdByVarIdByProp[vId];
			}
		}
		return;
	}
	//пробегать по свойствам объекта и удалять их - не нужно, так как свойства могут быть (объекты и скаляры) использоваться гденибудь
	varIdByVar.delete(v);
	delete varById[vId];
//!!	delete varIdByVarIdByProp[vId];
	const vIdByProp = varIdByVarIdByProp[vId];
//!! не надо - там должно быть песто, но если нет - то можно будет заметить
//!! сейчас там то что не используется, - по какойто причине в get прокси запрашивается "then" - хотя в шаблоне нет такого запроса
	if (vIdByProp) {
		delete varIdByVarIdByProp[vId];
		for (const pId of vIdByProp.values()) {
			srcIdSetByVarId.delete(pId);
		}
	}
}
function type_proxySetInSet(t, n, v, $src) {
	return {
		t,
		n,
		v,
		$src
	};
}

export function getLocalScopeProxyHandler($e, str, propName) {
	return {
		get(t, n) {
			const v = t[n];
//console.error("inc get", t, n, t[n], !!(v || n in t[p_target]), $e, str);
			if (v || n in t) {
				return v;
			}
//console.log("scope.js", n, str, $e);
			do {
				const l = getTopLocal($e, str);
				if (!l) {
					break;
				}
				const lD = self.localScope[l.id][propName];//,
//					lV = lD[n];
//				if (lV) {
//					return lV; 
//				}
				if (n in lD) {
					return lD[n];
				}
				$e = l.$src.parentNode;
				if (!$e || $e.nodeType === 11) {
					$e = $srcById[descrById.get(l.$src[p_descrId]).sId].parentNode;
				}
			} while ($e !== Tpl_$src);
//console.log(777, t, n, $e, str, propName);
			if (self[propName]) {
				return self[propName][n];
			}
		},
		set(t, n, v) {
//console.log(1, n, t);
			if (n in t) {
//console.log(2, n, t, t[n]);
				return Reflect.set(t, n, v);
			}
			do {
				const l = getTopLocal($e, str);
				if (!l) {
					break;
				}
				const lD = self.localScope[l.id][propName];
				if (n in lD) {
					return Reflect.set(lD, n, v);
				}
				$e = l.$src.parentNode;
				if (!$e || $e.nodeType === 11) {
					$e = $srcById[descrById.get(l.$src[p_descrId]).sId].parentNode;
				}
			} while ($e !== Tpl_$src);
			if (self[propName] && n in self[propName]) {
//console.log(4, n, t);
				return Reflect.set(self[propName], n, v);
			}
			return Reflect.set(t, n, v);
		},
		deleteProperty(t, n) {
			if (n in t) {
				return Reflect.deleteProperty(t, n);
			}
			do {
				const l = getTopLocal($e, str);
				if (!l) {
					break;
				}
				const lD = self.localScope[l.id][propName];
				if (n in lD) {
					return Reflect.deleteProperty(lD, n);
				}
				$e = l.$src.parentNode;
				if (!$e || $e.nodeType === 11) {
					$e = $srcById[descrById.get(l.$src[p_descrId]).sId].parentNode;
				}
			} while ($e !== Tpl_$src);
			if (self[propName] && n in self[propName]) {
				return Reflect.deleteProperty(self[propName], n);
			}
//console.log(11, t, n);
			return Reflect.deleteProperty(t, n);
		}
	};
}
