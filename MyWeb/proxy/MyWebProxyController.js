import config from "../../config/config.js";
import ProxyController from "./ProxyController.js";

let cur$src = null;
const proxyStat = {
	value: 1
};
export default class MyWebProxyController extends ProxyController {
	constructor(my, p_target) {
		super(p_target);
		this.my = my;
	}
	reset() {
		this.proxyByTarget.clear();
	}
	setCur$src($src) {
		cur$src = $src;
	}
	getProxyStat() {
		return proxyStat;
	}
	getVal(t, n, v) {
		if (cur$src === null) {
			return;
		}
		const tId = this.my.context.varIdByVar.get(t),
			src = this.my.context.srcBy$src.get(cur$src),
			sId = src.id,
			descr = src.descr;
//		if (!sId) {
//			console.warn("2323 всё норм, но нужно последить - сейчас такое бываес с _loading -> _inc");
//debugger;
//			return;
//		}
		if (ProxyController.isScalarType.has(typeof v) || v === null) {
/*todo может быть нужно так делать
			if (Array.isArray(t) && !isNaN(n)) {
console.warn(445435345, n, typeof n, t, n, v, $src);
				n = Number(n);
			}*/
			if (tId) {
				const s = this.my.context.srcIdsByVarId.get(tId);
				if (s !== undefined) {
					s.add(sId);
				} else {
					this.my.context.srcIdsByVarId.set(tId, new Set([sId]));
//todo
//console.warn(-1, tId);
				}
//1
				descr.varIds.add(tId);

				const vIdByProp = this.my.context.varIdByVarIdByProp.get(tId);
				if (vIdByProp !== undefined) {
					const propId = vIdByProp.get(n);
					if (propId !== undefined) {
//1
						descr.varIds.add(propId);//<--100%

						const s = this.my.context.srcIdsByVarId.get(propId);
						if (s !== undefined) {
							s.add(sId);
							return;
						}
						this.my.context.srcIdsByVarId.set(propId, new Set([sId]));
//console.log(-2, propId, tId, n, v);
						return;
					}
					const newPropId = this.my.getNewId();
//console.log(-33, this.my.context.varIdByVarIdByProp.get(tId));
//console.log(-3, newPropId, tId, n, v);
//alert(1);
//1
					vIdByProp.set(n, newPropId);
					this.my.context.srcIdsByVarId.set(newPropId, new Set([sId]));
					descr.varIds.add(newPropId);
					return;
				}
				const newPropId = this.my.getNewId();
				this.my.context.varIdByVarIdByProp.set(tId, new Map([[n, newPropId]]));
				this.my.context.srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(-44, new Set(this.my.context.varIdByVarIdByProp.get(tId)));
//console.log(-4, newPropId, tId, n, v);
//1
				descr.varIds.add(newPropId);
				return;
			}
			const nId = this.my.getNewId();
			this.my.context.varIdByVar.set(t, nId);
			this.my.context.varById.set(nId, t);
			this.my.context.srcIdsByVarId.set(nId, new Set([sId]));
//console.log(-5, nId);
//1
			descr.varIds.add(nId);

			const newPropId = this.my.getNewId();
			this.my.context.varIdByVarIdByProp.set(nId, new Map([[n, newPropId]]));
			this.my.context.srcIdsByVarId.set(newPropId, new Set([sId]));
//console.log(-6, newPropId, nId, t, n, v, $src);
//alert(1)
//1
			descr.varIds.add(newPropId);
			return;
		}
		if (tId) {
			const s = this.my.context.srcIdsByVarId.get(tId);
			if (s !== undefined) {
				s.add(sId);
			} else {
				this.my.context.srcIdsByVarId.set(tId, new Set([sId]));
//console.log(-7, tId);
			}
//1
			descr.varIds.add(tId);
		} else {
			const nId = this.my.getNewId();
			this.my.context.varIdByVar.set(t, nId);
			this.my.context.varById.set(nId, t);
			this.my.context.srcIdsByVarId.set(nId, new Set([sId]));
//console.log(-8, sId);
//1
			descr.varIds.add(nId);
		}
		const vId = this.my.context.varIdByVar.get(v);
		if (vId) {
			const s = this.my.context.srcIdsByVarId.get(vId);
			if (s !== undefined) {
				s.add(sId);
			} else {
				this.my.context.srcIdsByVarId.set(vId, new Set([sId]));
//console.log(-9, sId);
			}
//1
			descr.varIds.add(vId);
			return;
		}
		const newValId = this.my.getNewId();
		this.my.context.varIdByVar.set(v, newValId);
		this.my.context.varById.set(newValId, v);
		this.my.context.srcIdsByVarId.set(newValId, new Set([sId]));
//console.log(-10, sId);
//1
		descr.varIds.add(newValId);
	}
	setVal(t, n, v, oldV) {//!! data.arr.unshift(1); data.arr.unshift(2); - если так сделалть, то после первого - будут удалены this.my.context.varIdByVar.get(oldId), что приведет к тому что все пойдет по ветке !oldId - непонятно нужно ли что-то с этим делать??
		const tId = this.my.context.varIdByVar.get(t);
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
		const vIdByProp = this.my.context.varIdByVarIdByProp.get(tId),
//			oldScalarId = vIdByProp !== undefined ? vIdByProp.get(n) : 0,
//			oId = oldScalarId ? this.my.context.varIdByVar.get(oldV) : 0;
			oldScalarId = vIdByProp !== undefined && vIdByProp.get(n) || 0,
			oId = oldScalarId !== 0 && this.my.context.varIdByVar.get(oldV) || 0;
		if (this.my.debugLevel === 2) {
			console.info("this.my.proxy => setVar", "\n\tname=>", n, "\n\tvalue=>", v, "\n\toldVal=>", oldV, "\n\ttId=>", tId, "\n\ttarget=>", t, "\n\toldId=>", oId, "\n\toldScalarId=>", oldScalarId);//, "\n\t$current=>", cur$src);
		}
//console.error("setVar", n, v, tId, oId, oldV, oldScalarId, cur$src);
		if (cur$src !== null) {
//			proxyStat.value = 2;
			this.getVal(t, n, v, cur$src);
		}
/*!!нет в этом смысла
		if (!oId) {//если в разметке нет этого свойства, а оно используется в расчётах - для того чтобы на следующем круге понять что оно уже использовалось и не нужно чистить кэш по условию !oId
			if (ProxyController.isScalarType.has(typeof v) || v === null) {
				const newPropId = this.my.getNewId();
				if (vIdByProp) {
					vIdByProp.set(n, newPropId);
				} else {
					this.my.context.varIdByVarIdByProp.set(tId, new Map([[n, newPropId]]));
				}
			} else {
				const newId = this.my.getNewId();
				this.my.context.varIdByVar.set(v, newId);
				this.my.context.varById.set(newId, v);
			}
		}*/
/*--
		if (!oId) {
			const s = this.my.context.srcIdsByVarId.get(tId);//для push - нового элемента нет, а обновить надо - это актуально когда нет if .length
			if (s) {
//				for (const sId of s) {//
//console.log(sId, cache[sId]);
//					delete cache[sId];
////					delete currentCache[sId];
//				}
				this.my.renderBySrcIds(s);
			}
			return;
		}*/
		if (oldScalarId && !ProxyController.isScalarType.has(typeof v) && v !== null) {//это нужно для того: Изначально data.filter в proxy.get (при рендере) установится как скаляр (undef), - если новое значение объект, то нужно удалить ид из свойств
			vIdByProp.delete(n);
//!!todo GC
			if (vIdByProp.size === 0) {
				this.my.context.varIdByVarIdByProp.delete(tId);
			}
		}
//		_setVal(t, n, oldV, this.my.context.srcIdsByVarId.get(oId || tId), oId);
//	}
//	_setVal(t, n, oldV, s, oId) {
		const s = this.my.context.srcIdsByVarId.get(oId || tId);
		if (s === undefined) {
//!!todo
//console.error("!S!", t, n, oldV, s, oId);
//alert(1);
			return;
		}
//console.error("_setVal", t, n, oldV, s, oId);
		const toRender = new Set(s),
			toClear = new Set(),
			srcBy$src = this.my.context.srcBy$src;//s);
		for (const sId of s) {
			const $i = this.my.context.$srcById.get(sId);
			if ($i === undefined || toClear.has(sId)) {//похоже это при удалении элементов
//				console.warn(2, sId);
				continue;
			}
//2021-07-20 - data.arr[2] = 1111 - не очитит data.arr, но и не нужно - так как в кэше ссылка на arr
//			const iDescr = srcBy$src.get($i).descr;
			const iSrc = srcBy$src.get($i);
			if (iSrc.descr.asOnes === null) {
				toClear.add(sId);
				this.setInnerSrcIdSetBy$src(toClear, $i);
				continue;
			}
			const $els = iSrc.get$els("");
			for (let j = $els.length - 1; j > -1; j--) {
				const $j = $els[j],
					jSrc = srcBy$src.get($j);
				if (jSrc !== undefined) {
					toClear.add(jSrc.id);
					this.setInnerSrcIdSetBy$src(toClear, $j);
				}
			}
		}
//console.log(1, toClear, n);
/*
for (const sId of toClear) {
	console.log(2, sId, this.my.context.$srcById[sId]);
}*/
		if (oId !== 0) {
			const deletedVarId = new Set();
			for (const sId of toClear) {
				const c = this.my.context.srcById.get(sId).cache;
//				if (c === null) {
//					continue;
//				}
				c.value = new Map();
//console.log(61, sId)
/*todo
				if (!t[p_isUnshift]) {
					c.current = type_cacheCurrent();
console.log(11111111, sId);
				}*/
				this.decVar(t, n, oldV, sId, oId, deletedVarId);
			}
			if (deletedVarId.size !== 0) {
//todo
				requestIdleCallback(() => {
					for (const d of this.my.context.descrById.values()) {
						if (d.varIds === null) {
							continue;
						}
						for (const vId of deletedVarId) {
//							if (d.varIds.has(vId)) {
								d.varIds.delete(vId);
//							}
						}
					}
				}, config.defIdleCallbackOpt);
			}
		} else {
//console.log(1111, n, oldV, toClear);
			for (const sId of toClear) {
				const c = this.my.context.srcById.get(sId).cache;
//				if (c === null) {
//					continue;
//				}
				c.value = new Map();//<-если это новый элемент массива
//console.log(62, sId)
//todo c.current нужен для храниения текущего значения команды, удаляя его мы нарушаем идею его использования
//				c.current = type_cacheCurrent();
//--				this.decVar(t, n, oldV, sId, oId);
			}
		}
//console.error("renderBySrcIds => ", t, n, t[n], oldV, toRender, cur$src);
		this.my.renderBySrcIds(toRender);
	}
	//private
	setInnerSrcIdSetBy$src(toClear, $i) {
		const srcBy$src = this.my.context.srcBy$src,
			$parent = $i.parentNode;
		do {
//////////////////////
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined && iSrc.isCmd) {
				toClear.add(iSrc.id);
			}
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
//			while ($i = $i.parentNode) {
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
	//private
	decVar(t, n, v, sId, vId, deletedVarId) {
		if (vId === 0) {
			if (ProxyController.isScalarType.has(typeof v) || v === null) {
				const vIdByProp = this.my.context.varIdByVarIdByProp.get(this.my.context.varIdByVar.get(t));
				if (vIdByProp !== undefined) {
					vId = vIdByProp.get(n);
					if (vId === undefined) {
						vId = 0;
					}
				}
			} else {
				vId = this.my.context.varIdByVar.get(v);
				if (vId === undefined) {
					vId = 0;
				}
			}
		}
		if (vId !== 0) {
			const s = this.my.context.srcIdsByVarId.get(vId);
			if (s === undefined || !s.has(sId)) {
				this.delVar(vId, v, t, n, deletedVarId);
				return;
			}
			s.delete(sId);
			if (s.size === 0) {
				this.delVar(vId, v, t, n, deletedVarId);
			}
		}
		if (Array.isArray(v)) {
			const len = v.length;
			for (let i = 0; i < len; i++) {
				this.decVar(v, i, getTarget(v[i]), sId, 0, deletedVarId);
			}
			return;
		}
//todo Set and Map
		if (typeof v !== "object" || v === null) {
			return;
		}
		for (const i in v) {
			this.decVar(v, i, getTarget(v[i]), sId, 0, deletedVarId);
		}
	}
	//private
	delVar(vId, v, t, n, deletedVarId) {
//console.log("DEL", vId);
		deletedVarId.add(vId);
		this.my.context.srcIdsByVarId.delete(vId);
		if (ProxyController.isScalarType.has(typeof v) || v === null) {
			const vIdByProp = this.my.context.varIdByVarIdByProp.get(vId = this.my.context.varIdByVar.get(t));
			if (vIdByProp === undefined) {
				return;
			}
			vIdByProp.delete(n);
			if (vIdByProp.size === 0) {
				this.my.context.varIdByVarIdByProp.delete(vId);
			}
			return;
		}
		//пробегать по свойствам объекта и удалять их - не нужно, так как свойства могут быть (объекты и скаляры) использоваться где-нибудь ещё
		this.my.context.varIdByVar.delete(v);
		this.my.context.varById.delete(vId);
//!!		this.my.context.varIdByVarIdByProp.delete(vId);
		const vIdByProp = this.my.context.varIdByVarIdByProp.get(vId);
//!! не надо - там должно быть песто, но если нет - то можно будет заметить
//!! сейчас там то что не используется, - по какойто причине в get прокси запрашивается "then" - хотя в шаблоне нет такого запроса
		if (vIdByProp !== undefined) {
			this.my.context.varIdByVarIdByProp.delete(vId);
			for (const pId of vIdByProp.values()) {
				this.my.context.srcIdsByVarId.delete(pId);
			}
		}
	}


//todo--
	_testVars = function() {
		const v = new Set(Array.from(this.my.context.varIdByVar.values()));
		for (const [vId, srcIds] of this.my.context.srcIdsByVarId) {
			let fv;
			if (!v.has(vId)) {
				let f;
				for (const vvId of v) {
					const vIdByProp = this.my.context.varIdByVarIdByProp.get(vvId);
					if (vIdByProp === undefined) {
						continue;
					}
					for (const pId of vIdByProp.values()) {
						if (pId === vId) {
							for (const sId of srcIds) {
								if (!this.my.context.$srcById.has(sId)) {
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
					if (!this.my.context.$srcById.has(sId)) {
						console.log(11111, vId, sId);
					}
				}
			}
		}
		for (const vId of this.my.context.varIdByVar.keys()) {
			const s = this.my.context.srcIdsByVarId.get(vId);
			if (!s) {// || !s.has(sId)) {
				continue;
			}
			for (const sId of s) {
				if (!this.my.context.$srcById.has(sId)) {
					console.log(1, sId);
				}
			}
			const vIdByProp = this.my.context.varIdByVarIdByProp.get(vId);
			if (vIdByProp !== undefined) {
				for (const pId of vIdByProp.values()) {
					const propS = this.my.context.srcIdsByVarId.get(pId);
					if (propS) {// && propS.has(sId)) {
//						_del(pId, propS, sId);//, d, dId);
						for (const sId of propS) {
							if (!this.my.context.$srcById.has(sId)) {
								console.log(2, sId);
							}
						}
					}
				}
			}
		}
	}
};
