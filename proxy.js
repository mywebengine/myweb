import {renderBySrcIds} from "./render/algo.js";
import {type_cacheValue} from "./cache.js";
import {Tpl_$src, p_target} from "./config.js";
import {$srcById, srcById, srcBy$src, descrById, getNewId, get$els} from "./descr.js";
//--import {getIdx} from "./dom.js";
import {oset} from "./util.js";

export const varIdByVar = new Map();
export const varById = {};
export const varIdByVarIdByProp = {};
export const srcIdsByVarId = new Map();
//!!!!!!!!!!!!
self.varIdByVar = varIdByVar;
self.varById = varById;
self.varIdByVarIdByProp = varIdByVarIdByProp;
self.srcIdsByVarId = srcIdsByVarId;


//todo--
self.aa = function() {
	const v = new Set(Array.from(varIdByVar.values()));
	for (const [vId, srcIds] of srcIdsByVarId) {
		let fv;
		if (!v.has(vId)) {
			let f;
			for (const vvId of v) {
				if (!varIdByVarIdByProp[vvId]) {
					continue;
				}
				for (const pId of varIdByVarIdByProp[vvId].values()) {
					if (pId === vId) {
						for (const sId of srcIds) {
							if (!$srcById.has(sId)) {
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
				if (!$srcById.has(sId)) {
					console.log(11111, vId, sId);
				}
			}
		}
	}
	for (const vId of varIdByVar.keys()) {
		const s = srcIdsByVarId.get(vId);
		if (!s) {// || !s.has(sId)) {
			continue;
		}
		for (const sId of s) {
			if (!$srcById.has(sId)) {
				console.log(1, sId);
			}
		}
		const vIdByProp = varIdByVarIdByProp[vId];
		if (vIdByProp) {
			for (const pId of vIdByProp.values()) {
				const propS = srcIdsByVarId.get(pId);
				if (propS) {// && propS.has(sId)) {
//					_del(pId, propS, sId);//, d, dId);
					for (const sId of propS) {
						if (!$srcById.has(sId)) {
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
export const proxyStat = {
	value: 1
};

export function getProxy(v) {
	if (typeof v === "object" && v !== null) {
		const t = v[p_target];
		if (t || t === null) {//null to skiped objects
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
		const val = v[i];
		if (typeof val === "object" && val !== null && val !== v && Object.getOwnPropertyDescriptor(v, i)?.writable) {
			v[i] = getProxy(val);
		}
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
		if (proxyStat.value === 0) {
			proxyStat.value = 1;
		}
		if (n === p_target) {
			return t;
		}
		const v = t[n],
			type = typeof v;
		if (cur$src && !isSkipValueType[type] && !isSkipNameType[typeof n]) {
			addVar(t, n, getTarget(v), cur$src);
//???		} else if (type === "function") {
//			return v.bind(t);
		}
		return v;
	},
	set(t, n, v) {
//console.log('set', n, v, "old=>", t[n]);//, Object.getOwnPropertyDescriptor(t, n) && Object.getOwnPropertyDescriptor(t, n).value);
		if (Array.isArray(t) && n === "length") {
			const oVal = t[n];
			t[n] = v;
//			if (v !== oVal && !Reflect.set(t, n, v)) {//todo проверить: push и ... изменяю длину в фоне - это условие не сработает, а вот splice на удаление вроде бы выдает разные значения
//				return false;
//			}
			setVal(t, n, v, oVal);
			return true;
		}
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
	deleteProperty(t, n) {
		const oldV = getTarget(t[n]);
//console.log('del', t, n, "old=>", oldV);
		if (n in t) {
			delete t[n];
//			if (Reflect.deleteProperty(t, n)) {
				setVal(t, n, undefined, oldV);
				return true;
//			}
//			return false;
		}
//console.log('del skip', t, n, "old=>", oldV);
		return true;
	}
};
//todo
self.getProxy = getProxy;
self.proxyHandler = proxyHandler;

const unshiftHandler = {
	apply(t, thisValue, args) {
		getTarget(thisValue)[_isUnshift] = true;
		t.apply(thisValue, args);
//		Reflect.apply(t, thisValue, args);
	}
};
//export 
function addVar(t, n, v, $src) {
	const tId = varIdByVar.get(t),
		src = srcBy$src.get($src),
		sId = src.id,
		descr = src.descr;
//	if (!sId) {
//		console.warn("2323 всё норм, но нужно последить - сейчас такое бываес с _loading -> _inc");
//debugger;
//		return;
//	}
	if (isScalarType[typeof v] || v === null) {
		if (Array.isArray(t) && !isNaN(n)) {
			n = Number(n);
		}
		if (tId) {
			const s = srcIdsByVarId.get(tId);
			if (s) {
				s.add(sId);
			} else {
				srcIdsByVarId.set(tId, new Set([sId]));
//console.log(1, tId);
			}
//1
			descr.varIds.add(tId);

			const vIdByProp = varIdByVarIdByProp[tId];
			if (vIdByProp) {
				const propId = vIdByProp.get(n);
				if (propId) {
//1
					descr.varIds.add(propId);//<--100%

					const s = srcIdsByVarId.get(propId);
					if (s) {
						s.add(sId);
						return;
					}
					srcIdsByVarId.set(propId, new Set([sId]));
//console.log(2, propId);
					return;
				}
				const newPropId = getNewId();
				vIdByProp.set(n, newPropId);
				srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(3, newPropId);
//1
				descr.varIds.add(newPropId);
				return;
			}
			const newPropId = getNewId();
			varIdByVarIdByProp[tId] = new Map([[n, newPropId]]);
			srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(4, newPropId);
//1
			descr.varIds.add(newPropId);
			return;
		}
		const nId = getNewId();
		varIdByVar.set(t, nId);
		varById[nId] = t;
		srcIdsByVarId.set(nId, new Set([sId]));
//console.log(5, nId);
//1
		descr.varIds.add(nId);

		const newPropId = getNewId();
		varIdByVarIdByProp[nId] = new Map([[n, newPropId]]);
		srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(6, newPropId, t, n, v, $src);
//1
		descr.varIds.add(newPropId);
		return;
	}
	if (tId) {
		const s = srcIdsByVarId.get(tId);
		if (s) {
			s.add(sId);
		} else {
			srcIdsByVarId.set(tId, new Set([sId]));
//console.log(7, tId);
		}
//1
		descr.varIds.add(tId);
	} else {
		const nId = getNewId();
		varIdByVar.set(t, nId);
		varById[nId] = t;
		srcIdsByVarId.set(nId, new Set([sId]));
//console.log(8, sId);
//1
		descr.varIds.add(nId);
	}
	const vId = varIdByVar.get(v);
	if (vId) {
		const s = srcIdsByVarId.get(vId);
		if (s) {
			s.add(sId);
		} else {
			srcIdsByVarId.set(vId, new Set([sId]));
//console.log(9, sId);
		}
//1
		descr.varIds.add(vId);
		return;
	}
	const newValId = getNewId();
	varIdByVar.set(v, newValId);
	varById[newValId] = v;
	srcIdsByVarId.set(newValId, new Set([sId]));
//console.log(10, sId);
//1
	descr.varIds.add(newValId);
}
function setVal(t, n, v, oldV) {//!! data.arr.unshift(1); data.arr.unshift(2); - если так сделалть, то после первого - будут удалены varIdByVar.get(oldId), что приведет к тому что все пойдет по ветке !oldId - непонятно нужно ли что-то с этим делать??
	const tId = varIdByVar.get(t);
//console.info('setVar', "name=>", n, "\nvalue=>", v, "\ntarget=>", t, "\ntId=>", tId, "\noldVal=>", oldV, t[_isUnshift]);
	if (!tId) {//!tId - такое получается когда данные изменяются, а отрисовки ещё небыло - первая загрузка странцы и добавление данных на старте - это корректно
		return;
	}
	if (Array.isArray(t) && !isNaN(n)) {
		n = Number(n);
	}
	const vIdByProp = varIdByVarIdByProp[tId],
		oldScalarId = vIdByProp ? vIdByProp.get(n) : 0,
		oId = oldScalarId ? varIdByVar.get(oldV) : 0;
	if (self.Tpl_debugLevel === 2) {
		console.info("Tpl_proxy => setVar", "\n\tname=>", n, "\n\tvalue=>", v, "\n\toldVal=>", oldV, "\n\ttId=>", tId, "\n\ttarget=>", t, "\n\toldId=>", oId, "\n\toldScalarId=>", oldScalarId);
	}
	if (t[_isUnshift]) {
		if (n === "length") {
			_setVal(t, n, oldV, srcIdsByVarId.get(tId), oId);
			delete t[_isUnshift];
		}
		return;
	}
//console.error('setVar', n, v, tId, oId, oldV, oldScalarId, cur$src);
	if (cur$src) {
//		proxyStat.value = 2;
		addVar(t, n, v, cur$src);
	}
/*!!нет в этом смысла
	if (!oId) {//если в разметке нет этого свойства, а оно используется в расчётах - для того чтобы на следующем круге понять что оно уже использовалось и не нужно чистить кэш по условию !oId
		if (isScalarType[typeof v] || v === null) {
			const newPropId = getNewId();
			if (vIdByProp) {
				vIdByProp.set(n, newPropId);
			} else {
				varIdByVarIdByProp[tId] = new Map([[n, newPropId]]);
			}
		} else {
			const newId = getNewId();
			varIdByVar.set(v, newId);
			varById[newId] = v;
		}
	}*/
/*--
	if (!oId) {
		const s = srcIdsByVarId.get(tId);//для push - нового элемента нет, а обновить надо - это актуально когда нет if .length
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
	if (oldScalarId && !isScalarType[typeof v] && v !== null) {//это нужно для того: Изначально data.filter в proxy.get (при рендере) установится как скаляр (undef), - если новое значение объект, то нужно удалить ид из свойств
		vIdByProp.delete(n);
//!!todo GC
		if (vIdByProp.size === 0) {
			delete varIdByVarIdByProp[tId];
		}
	}
	_setVal(t, n, oldV, srcIdsByVarId.get(oId || tId), oId);
}
function _setVal(t, n, oldV, s, oId) {
	if (!s) {
//!!todo
//console.error("!S!", t, n, oldV, s, oId);
//alert(1);
		return;
	}
//console.error("_setVal", t, n, oldV, s, oId);
	const toRender = new Set(s),
		toClear = new Set();//s);
	for (const sId of s) {
		const $i = $srcById.get(sId);
		if (!$i || toClear.has(sId)) {//похоже это при удалении элементов
//			console.warn(2, sId);
			continue;
		}
/*2021-06-16 - ниже проще
		setInnerSrcIdSetBy$src(toClear, $i);
		const d = descrById.get($i[p_descrId]);
		if (!d.isAsOne) {
			continue;
		}
		for (const str of d.attr.keys()) {
			if (!reqCmd[str].cmd.isAsOne) {
				continue;
			}
			const idx = getIdx($i, str);
console.log(idx, d);
			for (let $j = $i.nextSibling; $j !== null; $j = $j.nextSibling) {
console.log(1, $j);
//				if ($j.nodeType === 1) {
				if ($j[p_isCmd]) {
					if (getIdx($j, str) !== idx) {
console.log(11, $j);
						break;
					}
					toClear.add($j[p_srcId]);
					setInnerSrcIdSetBy$src(toClear, $j);
				}
			}
			break;
		}*/
/*
//2021-06-18
		const d = descrById.get($i[p_descrId]);
		if (!d.isAsOne) {
			setInnerSrcIdSetBy$src(toClear, $i);
			continue;
		}
console.log(1111, d.srcIds, n, t[n], s);
//if (t[n] === undefined) {
//	debugger;
//}
		for (const sId of d.srcIds) {
			if (!toClear.has(sId)) {
				toClear.add(sId);
console.log(1, sId, $srcById[sId]);
				setInnerSrcIdSetBy$src(toClear, $srcById[sId]);
			}
		}*/
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
			if (jSrc === undefined) {
				continue;
			}
			toClear.add(jSrc.id);
			setInnerSrcIdSetBy$src(toClear, $j);
		}
//todo--
/*
		const attrIt = descr.attr.keys();
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			const str = i.value;
			if (!reqCmd[str].cmd.isAsOne) {
				continue;
			}
			const idx = getIdx(src, str);
//todo leto zima local
//!! в случаи когда обновление прилось только на один элемент (это что-то типа _for="f ? arr1 : arr2"), сейчас очищаем кэш для всех элементов, только в случаи когда обновление пришлось на нулевой элемент (когда все нули) - этобедет коректно работать если _for* будет добавлять новые элементы в конец (сецчас это так - и должно остаться так, по пичине отложенного рендера в скроле)
// - это не совсем то что хочется, но работать будет, всё из-за _for="f ? arr1 : arr2", когда меням f
// --- это не так работает, сейчас когда вычислялся  фор - привязка идет тольтко к базовому элементу, все остальные не привязаны в выражению у фор
			if (idx === 0) {
				let isFirst = true;
				for (i = attrIt.next(); !i.done; i = attrIt.next()) {
					if (reqCmd[i.value].cmd.isAsOne && getIdx(src, i.value) !== 0) {
						isFirst = false;
						break;
					}
				}
				if (isFirst) {
					for (const iId of descr.srcIds) {//можно взять все на этом уровне по фыЩтуШвч
						if (iId !== sId) {
							toClear.add(iId);
							setInnerSrcIdSetBy$src(toClear, $srcById[iId]);
						}
					}
					continue;
				}
			}
//--			setInnerSrcIdSetBy$src(toClear, $i);
			for (let $j = $i.nextSibling; $j !== null; $j = $j.nextSibling) {
//				if ($j.nodeType === 1) {
				const jSrc = srcBy$src.get($j);
				if (jSrc !== undefined && jSrc.isCmd) {
					if (getIdx(jSrc, str) !== idx) {
						break;
					}
					toClear.add(jSrc.id);
					setInnerSrcIdSetBy$src(toClear, $j);
				}
			}
			break;
		}*/
	}
//console.log(1, toClear, n);
/*
for (const sId of toClear) {
	console.log(2, sId, $srcById[sId]);
}*/
	if (oId !== 0) {
		const deletedVarId = new Set();
		for (const sId of toClear) {
			const c = srcById.get(sId).cache;
//			if (c === null) {
//				continue;
//			}
			c.value = type_cacheValue();
/*todo
			if (!t[_isUnshift]) {
				c.current = type_cacheCurrent();
console.log(11111111, sId);
			}*/
			decVar(t, n, oldV, sId, oId, deletedVarId);
		}
		if (deletedVarId.size !== 0) {
//todo
			requestIdleCallback(() => {
				for (const d of descrById.values()) {
					if (d.varIds === null) {
						continue;
					}
					for (const vId of deletedVarId) {
//						if (d.varIds.has(vId)) {
							d.varIds.delete(vId);
//						}
					}
				}
			});
		}
	} else {
//console.log(1111, n, oldV);
		for (const sId of toClear) {
			const c = srcById.get(sId).cache;
//			if (c === null) {
//				continue;
//			}
			c.value = type_cacheValue();//<-если это новый элемент массива
//todo c.current нужен для храниения текущего значения команды, удаляя его мы нарушаем идею его использования
//			c.current = type_cacheCurrent();
//--			decVar(t, n, oldV, sId, oId);
		}
	}
//console.error("renderBySrcIds => ", t, n, t[n], oldV, toRender, cur$src);
	renderBySrcIds(toRender);
}
function setInnerSrcIdSetBy$src(toClear, $i) {
	const $parent = $i.parentNode;
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
		if ($i.parentNode === $parent) {
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
	} while ($i);
}
function decVar(t, n, v, sId, vId, deletedVarId) {
	if (vId === 0) {
		if (isScalarType[typeof v] || v === null) {
			const vIdByProp = varIdByVarIdByProp[varIdByVar.get(t)];
			if (vIdByProp) {
				vId = vIdByProp.get(n) || 0;
			}
		} else {
			vId = varIdByVar.get(v) || 0;
		}
	}
	if (vId !== 0) {
		const s = srcIdsByVarId.get(vId);
		if (!s || !s.has(sId)) {
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
	srcIdsByVarId.delete(vId);
	if (isScalarType[typeof v] || v === null) {
		const vIdByProp = varIdByVarIdByProp[vId = varIdByVar.get(t)];
		if (vIdByProp) {
			vIdByProp.delete(n);
			if (vIdByProp.size === 0) {
				delete varIdByVarIdByProp[vId];
			}
		}
		return;
	}
	//пробегать по свойствам объекта и удалять их - не нужно, так как свойства могут быть (объекты и скаляры) использоваться где-нибудь ещё
	varIdByVar.delete(v);
	delete varById[vId];
//!!	delete varIdByVarIdByProp[vId];
	const vIdByProp = varIdByVarIdByProp[vId];
//!! не надо - там должно быть песто, но если нет - то можно будет заметить
//!! сейчас там то что не используется, - по какойто причине в get прокси запрашивается "then" - хотя в шаблоне нет такого запроса
	if (vIdByProp) {
		delete varIdByVarIdByProp[vId];
		for (const pId of vIdByProp.values()) {
			srcIdsByVarId.delete(pId);
		}
	}
}
