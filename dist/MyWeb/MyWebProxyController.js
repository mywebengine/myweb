import { config } from "../config.js";
import { my } from "../myweb.js";
import { ProxyController } from "../ProxyController.js";
let cur$src = null;
const proxyStat = {
    value: 1,
};
export class MyWebProxyController extends ProxyController {
    myweb;
    constructor(myweb, p_target) {
        super(p_target);
        this.myweb = myweb;
    }
    reset() {
        // this.proxyByTarget.clear();
    }
    createScopeProxy(val) {
        const target = this.getTarget(val);
        const proxy = this.proxyByTarget.get(target);
        if (proxy !== undefined) {
            return proxy;
        }
        const vType = typeof target;
        if (vType === "object") {
            return target[this.p_target] !== null ? this.setProxy(target, new Proxy(target, this.getScopeObjectProxyHandler())) : target;
        }
        return target;
    }
    getScopeObjectProxyHandler() {
        return {
            get: this.objectHandlerGet.bind(this),
            set: this.scopeHandlerError,
            deleteProperty: this.scopeHandlerError,
        };
    }
    scopeHandlerError() {
        throw new Error("Can't change Scope object");
    }
    setCur$src($src) {
        cur$src = $src;
    }
    getProxyStat() {
        return proxyStat;
    }
    getVal(t, n, v) {
        // console.error(11, t, n, v, cur$src)
        if (cur$src === null) {
            return;
        }
        const tId = this.myweb.context.varIdByVar.get(t);
        const src = this.myweb.context.srcBy$src.get(cur$src);
        const srcId = src.id;
        const descr = src.descr;
        const varIds = descr.varIds; //!!
        //if (!srcId) {
        //	console.warn("2323 всё норм, но нужно последить - сейчас такое бывает с _loading -> _inc");
        //debugger;
        //	return;
        //}
        if (this.isScalar(v)) {
            /*todo может быть нужно так делать
            if (Array.isArray(t) && !isNaN(n)) {
console.warn(445435345, n, typeof n, t, n, v, $src);
                n = Number(n);
            }*/
            if (tId) {
                const s = this.myweb.context.srcIdsByVarId.get(tId);
                if (s !== undefined) {
                    s.add(srcId);
                }
                else {
                    this.myweb.context.srcIdsByVarId.set(tId, new Set([srcId]));
                    //todo
                    //console.warn(-1, tId);
                }
                //1
                varIds.add(tId);
                const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(tId);
                if (vIdByProp !== undefined) {
                    const propId = vIdByProp.get(n);
                    if (propId !== undefined) {
                        //1
                        varIds.add(propId); //<--100%
                        const s = this.myweb.context.srcIdsByVarId.get(propId);
                        if (s !== undefined) {
                            s.add(srcId);
                            return;
                        }
                        this.myweb.context.srcIdsByVarId.set(propId, new Set([srcId]));
                        //console.log(-2, propId, tId, n, v);
                        return;
                    }
                    const newPropId = this.myweb.getNewId();
                    //console.log(-33, this.my.context.varIdByVarIdByProp.get(tId));
                    //console.log(-3, newPropId, tId, n, v);
                    //alert(1);
                    //1
                    vIdByProp.set(n, newPropId);
                    this.myweb.context.srcIdsByVarId.set(newPropId, new Set([srcId]));
                    varIds.add(newPropId);
                    return;
                }
                const newPropId = this.myweb.getNewId();
                this.myweb.context.varIdByVarIdByProp.set(tId, new Map([[n, newPropId]]));
                this.myweb.context.srcIdsByVarId.set(newPropId, new Set([srcId]));
                //console.log(-44, new Set(this.my.context.varIdByVarIdByProp.get(tId)));
                //console.log(-4, newPropId, tId, n, v);
                //1
                varIds.add(newPropId);
                return;
            }
            const nId = this.myweb.getNewId();
            this.myweb.context.varIdByVar.set(t, nId);
            this.myweb.context.varById.set(nId, t);
            this.myweb.context.srcIdsByVarId.set(nId, new Set([srcId]));
            //console.log(-5, nId);
            //1
            varIds.add(nId);
            const newPropId = this.myweb.getNewId();
            this.myweb.context.varIdByVarIdByProp.set(nId, new Map([[n, newPropId]]));
            this.myweb.context.srcIdsByVarId.set(newPropId, new Set([srcId]));
            //console.log(-6, newPropId, nId, t, n, v, $src);
            //alert(1)
            //1
            varIds.add(newPropId);
            return;
        }
        if (tId) {
            const s = this.myweb.context.srcIdsByVarId.get(tId);
            if (s !== undefined) {
                s.add(srcId);
            }
            else {
                this.myweb.context.srcIdsByVarId.set(tId, new Set([srcId]));
                //console.log(-7, tId);
            }
            //1
            varIds.add(tId);
        }
        else {
            const nId = this.myweb.getNewId();
            this.myweb.context.varIdByVar.set(t, nId);
            this.myweb.context.varById.set(nId, t);
            this.myweb.context.srcIdsByVarId.set(nId, new Set([srcId]));
            //console.log(-8, srcId);
            //1
            varIds.add(nId);
        }
        const vId = this.myweb.context.varIdByVar.get(v); //!!
        if (vId) {
            const s = this.myweb.context.srcIdsByVarId.get(vId);
            if (s !== undefined) {
                s.add(srcId);
            }
            else {
                this.myweb.context.srcIdsByVarId.set(vId, new Set([srcId]));
                //console.log(-9, srcId);
            }
            //1
            varIds.add(vId);
            return;
        }
        const newValId = this.myweb.getNewId();
        this.myweb.context.varIdByVar.set(v, newValId); //!!
        this.myweb.context.varById.set(newValId, v); //!!
        this.myweb.context.srcIdsByVarId.set(newValId, new Set([srcId]));
        //console.log(-10, srcId);
        //1
        varIds.add(newValId);
    }
    setVal(t, n, v, oldVal) {
        //!! data.arr.unshift(1); data.arr.unshift(2); - если так сделать, то после первого - будут удалены this.my.context.varIdByVar.get(oldId), что приведет к тому что все пойдет по ветке !oldId - непонятно нужно ли что-то с этим делать??
        const tId = this.myweb.context.varIdByVar.get(t);
        // console.info("setVar", "name=>", n, typeof n, "\nvalue=>", v, "\ntarget=>", t, "\ntId=>", tId, "\noldVal=>", oldVal, tId);
        if (!tId) {
            //!tId - такое получается когда данные изменяются, а отрисовки ещё не было - первая загрузка страницы и добавление данных на старте - это корректно
            return;
        }
        /*todo может быть нужно так делать
        if (Array.isArray(t) && !isNaN(n)) {
//todo
console.warn(423423, n, typeof n, t, n, v, oldV)
            n = Number(n);
        }*/
        const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(tId);
        //const oldScalarId = vIdByProp !== undefined ? vIdByProp.get(n) : 0;
        //const oId = oldScalarId ? this.my.context.varIdByVar.get(oldV) : 0;
        const oldScalarId = (vIdByProp !== undefined && vIdByProp.get(n)) || 0;
        const oId = (oldScalarId !== 0 && this.myweb.context.varIdByVar.get(oldVal)) || 0; //!!
        if (my.debugLevel === 2) {
            console.info("this.my.proxy => setVar", "\n\tname=>", n, "\n\tvalue=>", v, "\n\toldVal=>", oldVal, "\n\ttId=>", tId, "\n\ttarget=>", t, "\n\toldId=>", oId, "\n\toldScalarId=>", oldScalarId); //, "\n\t$current=>", cur$src);
        }
        // console.error("setVar", n, v, tId, oId, oldVal, oldScalarId, cur$src);
        if (cur$src !== null) {
            //proxyStat.value = 2;
            this.getVal(t, n, v);
        }
        /*!!нет в этом смысла
        if (!oId) {//если в разметке нет этого свойства, а оно используется в расчётах - для того чтобы на следующем круге понять что оно уже использовалось и не нужно чистить кэш по условию !oId
            if (this.isScalar(v)) {
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
        if (oldScalarId !== 0 && !this.isScalar(v)) {
            //это нужно для того: Изначально data.filter в proxy.get (при рендере) установится как скаляр (undef), - если новое значение объект, то нужно удалить ид из свойств
            vIdByProp.delete(n); //!!
            //!!todo GC
            if (vIdByProp.size === 0) {
                //!!
                this.myweb.context.varIdByVarIdByProp.delete(tId);
            }
        }
        //_setVal(t, n, oldV, this.my.context.srcIdsByVarId.get(oId || tId), oId);
        //}
        //(t, n, oldV, s, oId) {
        const s = this.myweb.context.srcIdsByVarId.get(oId || tId);
        if (s === undefined) {
            //!!todo
            //console.error("!S!", t, n, oldV, s, oId);
            //alert(1);
            return;
        }
        //console.error("_setVal", t, n, oldV, s, oId);
        const toRender = new Set(s);
        const toClear = new Set();
        const srcBy$src = this.myweb.context.srcBy$src; //s);
        for (const sId of s) {
            const $i = this.myweb.context.$srcById.get(sId);
            if ($i === undefined || toClear.has(sId)) {
                //похоже это при удалении элементов
                //console.warn(2, sId);
                continue;
            }
            //2021-07-20 - data.arr[2] = 1111 - не очистит data.arr, но и не нужно - так как в кэше ссылка на arr
            //			const iDescr = srcBy$src.get($i).descr;
            const iSrc = srcBy$src.get($i); //!!
            if (iSrc.descr.asOnes === null) {
                toClear.add(sId);
                this.setInnerSrcIdSetBy$src(toClear, $i);
                continue;
            }
            const $els = iSrc.get$els("");
            for (let j = $els.length - 1; j > -1; --j) {
                const $j = $els[j], jSrc = srcBy$src.get($j);
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
                const cache = this.myweb.context.srcById.get(sId).cache; //!!
                //if (c === null) {
                //	continue;
                //}
                cache.value.clear();
                //console.log(61, sId)
                /*todo
                if (!t[p_isUnshift]) {
                    c.current = type_cacheCurrent();
console.log(11111111, sId);
                }*/
                this.decVar(t, n, oldVal, sId, oId, deletedVarId);
            }
            if (deletedVarId.size !== 0) {
                //todo
                requestIdleCallback(() => {
                    for (const d of this.myweb.context.descrById.values()) {
                        if (d.varIds === null) {
                            continue;
                        }
                        for (const vId of deletedVarId) {
                            //if (d.varIds.has(vId)) {
                            d.varIds.delete(vId);
                            //}
                        }
                    }
                }, config.defIdleCallbackOpt);
            }
        }
        else {
            //console.log(1111, n, oldV, toClear);
            for (const sId of toClear) {
                const cache = this.myweb.context.srcById.get(sId).cache;
                //if (c === null) {
                //	continue;
                //}
                cache.value.clear(); //<-если это новый элемент массива
                //console.log(62, sId)
                //todo c.current нужен для хранения текущего значения команды, удаляя его мы нарушаем идею его использования
                //c.current = type_cacheCurrent();
                //--this.decVar(t, n, oldV, sId, oId);
            }
        }
        //console.error("renderBySrcIds => ", t, n, t[n], oldV, toRender, cur$src);
        this.myweb.renderBySrcIds(toRender);
    }
    setInnerSrcIdSetBy$src(toClear, $i) {
        const srcBy$src = this.myweb.context.srcBy$src;
        const $parent = $i.parentNode;
        do {
            //////////////////////
            const iSrc = srcBy$src.get($i); //!!
            if (iSrc !== undefined && iSrc.isCmd) {
                toClear.add(iSrc.id);
            }
            if ($i.firstChild !== null) {
                $i = $i.firstChild;
                continue;
            }
            if ($i.parentNode === $parent) {
                //если мы не ушли вглубь - значит и вправо двигаться нельзя
                return;
            }
            if ($i.nextSibling !== null) {
                $i = $i.nextSibling;
                continue;
            }
            //while ($i = $i.parentNode) {
            do {
                $i = $i.parentNode; //!!
                if ($i.parentNode === $parent) {
                    return;
                }
                if ($i.nextSibling !== null) {
                    $i = $i.nextSibling;
                    break;
                }
            } while (true);
        } while (true);
    }
    decVar(t, n, v, srcId, varId, deletedVarId) {
        let vId = varId;
        if (vId === 0) {
            if (this.isScalar(v)) {
                const scalarTargetId = this.myweb.context.varIdByVar.get(t);
                if (scalarTargetId !== undefined) {
                    const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(scalarTargetId);
                    if (vIdByProp !== undefined) {
                        vId = vIdByProp.get(n);
                        if (vId === undefined) {
                            vId = 0;
                        }
                    }
                }
            }
            else {
                vId = this.myweb.context.varIdByVar.get(v); //!!
                if (vId === undefined) {
                    vId = 0;
                }
            }
        }
        if (vId !== 0) {
            const s = this.myweb.context.srcIdsByVarId.get(vId);
            if (s === undefined || !s.has(srcId)) {
                this.delVar(vId, v, t, n, deletedVarId);
                return;
            }
            s.delete(srcId);
            if (s.size === 0) {
                this.delVar(vId, v, t, n, deletedVarId);
            }
        }
        if (Array.isArray(v)) {
            const len = v.length;
            for (let i = 0; i < len; ++i) {
                this.decVar(v, i, this.getTarget(v[i]), srcId, 0, deletedVarId);
            }
            return;
        }
        //todo Set and Map
        if (typeof v !== "object" || v === null) {
            return;
        }
        for (const i in v) {
            this.decVar(v, i, this.getTarget(v[i]), srcId, 0, deletedVarId);
        }
    }
    delVar(vId, v, t, n, deletedVarId) {
        //console.log("DEL", vId);
        deletedVarId.add(vId);
        this.myweb.context.srcIdsByVarId.delete(vId);
        if (this.isScalar(v)) {
            const scalarTargetId = this.myweb.context.varIdByVar.get(t);
            if (scalarTargetId === undefined) {
                return;
            }
            const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(scalarTargetId);
            if (vIdByProp === undefined) {
                return;
            }
            vIdByProp.delete(n);
            if (vIdByProp.size === 0) {
                this.myweb.context.varIdByVarIdByProp.delete(vId);
            }
            return;
        }
        //пробегать по свойствам объекта и удалять их - не нужно, так как свойства могут быть (объекты и скаляры) использоваться где-нибудь ещё
        this.myweb.context.varIdByVar.delete(v); //!!
        this.myweb.context.varById.delete(vId);
        //!!this.my.context.varIdByVarIdByProp.delete(vId);
        const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(vId);
        //!! не надо - там должно быть пусто, но если нет - то можно будет заметить
        //!! сейчас там то что не используется - по какой-то причине в get прокси запрашивается "then" - хотя в шаблоне нет такого запроса
        if (vIdByProp !== undefined) {
            this.myweb.context.varIdByVarIdByProp.delete(vId);
            for (const pId of vIdByProp.values()) {
                this.myweb.context.srcIdsByVarId.delete(pId);
            }
        }
    }
    //todo--
    _testVars() {
        const v = new Set(Array.from(this.myweb.context.varIdByVar.values()));
        for (const [vId, srcIds] of this.myweb.context.srcIdsByVarId) {
            if (!v.has(vId)) {
                let f;
                for (const vvId of v) {
                    const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(vvId);
                    if (vIdByProp === undefined) {
                        continue;
                    }
                    for (const pId of vIdByProp.values()) {
                        if (pId === vId) {
                            for (const sId of srcIds) {
                                if (!this.myweb.context.$srcById.has(sId)) {
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
            }
            else {
                for (const sId of srcIds) {
                    if (!this.myweb.context.$srcById.has(sId)) {
                        console.log(11111, vId, sId);
                    }
                }
            }
        }
        for (const vId of this.myweb.context.varIdByVar.values()) {
            const s = this.myweb.context.srcIdsByVarId.get(vId);
            if (!s) {
                // || !s.has(sId)) {
                continue;
            }
            for (const sId of s) {
                if (!this.myweb.context.$srcById.has(sId)) {
                    console.log(1, sId);
                }
            }
            const vIdByProp = this.myweb.context.varIdByVarIdByProp.get(vId);
            if (vIdByProp !== undefined) {
                for (const pId of vIdByProp.values()) {
                    const propS = this.myweb.context.srcIdsByVarId.get(pId);
                    if (propS) {
                        // && propS.has(sId)) {
                        //_del(pId, propS, sId);//, d, dId);
                        for (const sId of propS) {
                            if (!this.myweb.context.$srcById.has(sId)) {
                                console.log(2, sId);
                            }
                        }
                    }
                }
            }
        }
    }
}
