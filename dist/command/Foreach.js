import { kebabToCamelCase } from "../lib/kebabToCamelCase.js";
import { Q_I } from "../MyWeb/Q_$i.js";
import { Q_arr } from "../MyWeb/Q_arr.js";
import { Task } from "../MyWeb/Task.js";
import { RenderRes } from "../MyWeb/RenderRes.js";
import { Command } from "./Command.js";
import { config } from "../config.js";
export class Foreach extends Command {
    isHasScope = true;
    isAsOne = true;
    render(req) {
        return this.myweb.eval2(req, req.$src, true).then(value => this.renderByVal(req, value));
    }
    q_render(req, arr, isLast) {
        return this.myweb.q_eval2(req, arr, isLast).then(values => {
            const arrLen = arr.length;
            const res = new Array(arrLen);
            for (let i = 0; i < arrLen; i++) {
                if (!isLast.has(i)) {
                    res[i] = this.renderByVal(this.myweb.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, null, req.sync), values[i]);
                }
            }
            return Promise.all(res);
        });
    }
    get$first($first, str, expr, pos) {
        const srcBy$src = this.myweb.context.srcBy$src;
        for (let $i = $first; $i !== null; $i = $i.previousSibling) {
            const iSrc = srcBy$src.get($i);
            if (iSrc === undefined || !iSrc.isCmd) {
                continue;
            }
            if (iSrc.asOneIdx === null) {
                return $first;
            }
            const nStr = iSrc.getNextStr(str);
            const asOneIdx = iSrc.asOneIdx.get(str);
            $first = nStr !== "" ? iSrc.get$first(nStr) : $i;
            for ($i = $first.previousSibling; $i !== null; $i = $i.previousSibling) {
                const iSrc = srcBy$src.get($i);
                if (iSrc === undefined || !iSrc.isCmd) {
                    continue;
                }
                if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(str) !== asOneIdx) {
                    return $first;
                }
                if (nStr === "") {
                    $first = $i;
                    continue;
                }
                $first = $i = iSrc.get$first(nStr);
            }
            return $first;
        }
        throw new Error("foreach");
    }
    get$els($src, str, expr, pos) {
        //todo , expr, pos
        const $els = this.get$elsGroupByElements(this.get$first($src, str, expr, pos), str /*, expr, pos*/);
        const $elsLen = $els.length;
        const $ret = [];
        for (let i = 0; i < $elsLen; ++i) {
            const $iLen = $els[i].length;
            for (let j = 0; j < $iLen; ++j) {
                $ret.push($els[i][j]);
            }
        }
        return $ret;
    }
    renderByVal(req, val) {
        //console.error("_for", req.sync.syncId, req, req.$src);
        //alert(1);
        //if (self.a && req.expr === 'game.log') {
        //	console.log(req, val);
        //	alert(1);
        //}
        const srcBy$src = this.myweb.context.srcBy$src;
        const src = srcBy$src.get(req.$src);
        if (src.asOneIdx === null) {
            src.asOneIdx = new Map();
        }
        if (!src.asOneIdx.has(req.str)) {
            src.setAsOneIdx(req.str, this.myweb.getNewId());
            src.setIdx(req.str, 0);
        }
        const context = this.getContext(req, val);
        const elsLen = context.els.length;
        const keysLen = context.keys.length;
        const l = context.els[elsLen - 1].$els;
        const $last = l[l.length - 1];
        if (keysLen === 0) {
            this.show$first(req, context, this.myweb.hide.bind(this.myweb));
            req.sync.animations.add(new Task(() => {
                for (let j, i = elsLen - 1; i > 0; --i) {
                    const $elsI = context.els[i].$els;
                    for (j = $elsI.length - 1; j > -1; --j) {
                        this.myweb.removeChild($elsI[j]);
                    }
                }
            }, req.sync.local, 0));
            return new RenderRes($last);
        }
        //console.error("for context", context.els, context, req);
        //alert(2);
        const res = new RenderRes($last);
        if (elsLen === 1) {
            //todo подумать об этом
            const $e0 = context.els[0].$els;
            //if ($e00.nodeName === "TEMPLATE" && $e00.getAttribute(hideName) !== null) {
            for (let $j = $e0[0];; $j = $j.nextSibling) {
                //if ($j.nodeType !== 1) {//в принципе можно и убрать
                //	break;
                //}
                const jSrc = srcBy$src.get($j);
                if (jSrc === undefined) {
                    continue;
                }
                if (!jSrc.isHide) {
                    break;
                }
                this.show$first(req, context, this.myweb.show.bind(this.myweb));
                for (let j = $e0.length - 1; j > -1; --j) {
                    $e0[j] = $e0[j].content.firstChild;
                }
                req.sync.afterAnimations.add(new Task(() => this.q_forRender(req, context, context.els, elsLen < keysLen ? () => this.q_add(req, context) : null), req.sync.local, 0));
                return res;
            }
        }
        if (elsLen === keysLen) {
            const p = this.q_forRender(req, context, context.els, null);
            return p === undefined ? res : p.then(() => res);
        }
        if (elsLen < keysLen) {
            const p = this.q_forRender(req, context, context.els, () => this.q_add(req, context));
            return p === undefined ? res : p.then(() => res);
        }
        console.log("rem", req, context, keysLen, elsLen, context.els.concat(), context.keys.concat(), val);
        const toRem = new Set();
        //for (let i = elsLen - 1; i >= keysLen; --i) {
        //	for (let j = context.els[i].length - 1; j > -1; --j) {
        for (let i = keysLen; i < elsLen; ++i) {
            const l = context.els[i].$els.length;
            const $elsI = context.els[i].$els;
            for (let j = 0; j < l; ++j) {
                toRem.add($elsI[j]);
            }
        }
        debugger;
        context.els.splice(keysLen, elsLen - keysLen);
        req.sync.animations.add(new Task(() => {
            for (const $i of toRem) {
                this.myweb.removeChild($i);
            }
        }, req.sync.local, 0));
        req.sync.afterAnimations.add(new Task(() => this.q_forRender(req, context, context.els, null), req.sync.local, 0));
        return res;
        /*
        const p = this.q_forRender(req, context);
        return p === null ? res : p
            .then(() => {
                req.sync.animations.add(new Task(() => {
                    for (const $i of toRem) {
                        this.my.removeChild($i);
                    }
                }, req.sync.local, 0));
                return res;
            });*/
    }
    getContext(req, value) {
        const pos = -1; //нужно было бы запускать с нулевого элемента для получения кэша - эта задача режется в функции получения кэша
        const $first = this.get$first(req.$src, req.str, req.expr, pos);
        const $els = this.get$elsGroupByElements($first, req.str /*, req.expr, pos*/);
        const valName = kebabToCamelCase(req.commandWithArgs.args[0]);
        const keyName = kebabToCamelCase(req.commandWithArgs.args[1]);
        if (!value) {
            return new ForeachContext([], [], $els, valName, keyName);
        }
        if (Array.isArray(value)) {
            const len = value.length;
            const keys = new Array(len);
            for (let i = 0; i < len; ++i) {
                keys[i] = i;
            }
            return new ForeachContext(keys, value, $els, valName, keyName);
        }
        if (value instanceof Set || value instanceof Map) {
            const keys = new Array(value.size);
            const arr = new Array(value.size);
            let i = 0;
            for (const [k, v] of value.entries()) {
                keys[i] = k;
                arr[i++] = v;
            }
            return new ForeachContext(keys, arr, $els, valName, keyName);
        }
        const keys = [];
        const arr = [];
        for (const key in value) {
            keys.push(key);
            arr.push(value[key]);
        }
        return new ForeachContext(keys, arr, $els, valName, keyName);
    }
    show$first(req, context, showFunc) {
        const first$els = context.els[0].$els;
        const first$elsLen = first$els.length;
        //for (let j = first$elsLen - 1; j > -1; --j) {
        for (let j = 0; j < first$elsLen; ++j) {
            showFunc(req, first$els[j]);
        }
    }
    get$elsGroupByElements($e, str /*, expr, pos*/) {
        const srcBy$src = this.myweb.context.srcBy$src;
        for (let $i = $e, iSrc = srcBy$src.get($i); $i !== null; $i = $i.nextSibling, iSrc = srcBy$src.get($i)) {
            if (iSrc === undefined || !iSrc.isCmd) {
                continue;
            }
            if (iSrc.asOneIdx === null) {
                //if foreach
                return [[$e]];
            }
            const nStr = iSrc.getNextStr(str);
            const asOneIdx = iSrc.asOneIdx.get(str);
            const $els = new Array();
            do {
                if (nStr !== "") {
                    const $e = $els[$els.push(iSrc.get$els(nStr)) - 1];
                    $i = $e[$e.length - 1];
                }
                else {
                    $els.push([$i]);
                }
                for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
                    iSrc = srcBy$src.get($i);
                    if (iSrc === undefined || !iSrc.isCmd) {
                        continue;
                    }
                    if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(str) !== asOneIdx) {
                        return $els;
                    }
                    break;
                }
            } while ($i !== null);
            return $els;
        }
        throw new Error("foreach");
    }
    q_add(req, context) {
        const elsLen = context.els.length;
        const keysLen = context.keys.length;
        const from = context.els[elsLen - 1];
        const from$elsLen = from.$els.length;
        //const from$last = from.$els[from$elsLen - 1];
        const idx = elsLen;
        const srcBy$src = this.myweb.context.srcBy$src;
        let viewSize = 0; //todo расположение может быть и горизонтальным, тогда будем отрендерить по одной* штуке
        let srcId = 0;
        for (let j = 0; j < from$elsLen; ++j) {
            const $j = from.$els[j];
            const iSrc = srcBy$src.get($j);
            if (srcId === 0 && iSrc !== undefined) {
                srcId = iSrc.id;
            }
            if ($j.nodeType === 1) {
                viewSize += $j.offsetHeight;
            }
        }
        //if (srcId === 0) {
        //	throw new Error("foreach");
        //}
        const step = viewSize !== 0
            ? Math.ceil((document.scrollingElement.clientHeight * config.visibleScreenSize) / viewSize)
            : config.renderBatchSize;
        //if (this.my.is$visible(from$last)) {
        if (this.myweb.is$visible(from.$els[from$elsLen - 1])) {
            req.sync.animations.add(new Task(() => this.q_addInsert(req, context, this.myweb.getSrcId(req.sync.local, srcId), keysLen, idx, step), req.sync.local, 0)); //!! нельзя не вставить этот элемент двигаться дальше, так что если даже на момент отрисовки его не будет видно, его всё рано нужно вставить
            return;
        }
        req.sync.afterAnimations.add(new Task(() => this.q_addDeferred(req, context, srcId, keysLen, idx, step), req.sync.local, 0));
    }
    q_addDeferred(req, context, srcId, keysLen, idx, step) {
        return new Promise(ricResolve => {
            //обязательно нужен промис
            const ricId = requestIdleCallback(() => {
                req.sync.idleCallback.delete(ricId);
                req.sync.animations.add(new Task(() => this.q_addInsert(req, context, this.myweb.getSrcId(req.sync.local, srcId), keysLen, idx, step), req.sync.local, srcId));
                ricResolve(undefined);
            }, config.defIdleCallbackOpt);
            req.sync.idleCallback.set(ricId, ricResolve);
        });
    }
    q_addInsert(req, context, srcId, keysLen, idx, step) {
        const $fr = this.myweb.context.document.createDocumentFragment();
        const newEls = this.q_addI(req, srcId, $fr, keysLen, idx, step); //!!перенесли в анимации, что бы дать возможность отрисовать всё перед клонированием
        const newElsLen = newEls.length;
        //const $last = this.get$last(req, from$last, idx - 1);
        const $last = this.get$last(req, this.myweb.context.$srcById.get(srcId), idx - 1);
        idx += newElsLen;
        if (idx >= keysLen) {
            /*
//todo
if (!$last.parentNode) {
    console.error(req, context, secId, keysLen, idx, step, $last);
}*/
            $last.parentNode.insertBefore($fr, $last.nextSibling);
            req.sync.afterAnimations.add(new Task(() => this.q_forRenderI(req, context, newEls), req.sync.local, 0));
            return;
        }
        const newElsLast$els = newEls[newElsLen - 1].$els;
        const srcBy$src = this.myweb.context.srcBy$src;
        for (let $i = newElsLast$els[newElsLast$els.length - 1]; $i !== null; $i = $i.previousSibling) {
            const iSrc = srcBy$src.get($i);
            if (iSrc === undefined) {
                continue;
            }
            srcId = iSrc.id;
            $last.parentNode.insertBefore($fr, $last.nextSibling);
            req.sync.afterAnimations.add(new Task(() => this.q_forRenderI(req, context, newEls).then(() => this.q_addDeferred(req, context, srcId, keysLen, idx, step)), req.sync.local, 0));
            return;
        }
        throw new Error("foreach");
    }
    get$last(req, $last, lastIdx) {
        const srcBy$src = this.myweb.context.srcBy$src;
        const src = srcBy$src.get($last);
        const asOneIdx = src.asOneIdx.get(req.str);
        const $els = src.get$els(req.str);
        $last = $els[$els.length - 1];
        for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
            const iSrc = srcBy$src.get($i);
            if (iSrc === undefined || !iSrc.isCmd) {
                continue;
            }
            if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || iSrc.getIdx(req.str) !== lastIdx) {
                return $last;
            }
            const $els = srcBy$src.get($i).get$els(req.str);
            $last = $els[$els.length - 1];
        }
        return $last;
    }
    /*
function get$last(req, $last, lastIdx) {
    const asOneIdx = this.my.context.srcBy$src.get($last).asOneIdx.get(req.str);
    for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
        const iSrc = this.my.context.srcBy$src.get($i);
        if (iSrc === undefined || !iSrc.isCmd) {
            continue;
        }
        if (iSrc.asOneIdx === null || iSrc.asOneIdx.get(req.str) !== asOneIdx || iSrc.getIdx(req.str) !== lastIdx) {
            return $last;
        }
        $last = $i;
    }
    return $last;
}*/
    q_addI(req, srcId, $fr, keysLen, idx, step) {
        const len = idx + step > keysLen ? keysLen - idx : step;
        //const newEls = q_cloneNode(req, srcId, idx, len);
        const newEls = this.myweb.context.srcById.get(this.myweb.getSrcId(req.sync.local, srcId)).q_cloneNode(req, idx, len);
        const $elsILen = newEls[0].$els.length;
        for (let j, i = 0; i < len; ++i) {
            const $elsI = newEls[i].$els;
            for (j = 0; j < $elsILen; ++j) {
                $fr.appendChild($elsI[j]);
            }
        }
        //console.log(222, srcId, $new, req.str);
        //alert(1);
        return newEls;
    }
    q_forRender(req, context, els, addF) {
        const nows = new Array();
        const deferreds = new Array();
        const elsLen = els.length;
        if (!req.sync.renderParam.isLinking) {
            // const srcBy$src = this.my.context.srcBy$src;
            for (let i = 0; i < elsLen; i++) {
                const elsI = els[i];
                const $elsI = elsI.$els;
                const $elsILen = $elsI.length;
                let f = false;
                for (let j = 0; j < $elsILen; ++j) {
                    //const jSrc = srcBy$src.get($elsI[j]);
                    //if (iSrc !== undefined && this.my.is$visible($elsI[j])) {
                    if (this.myweb.is$visible($elsI[j])) {
                        f = true;
                        break;
                    }
                }
                if (f) {
                    nows.push(elsI);
                }
                else {
                    deferreds.push(elsI);
                }
            }
        }
        else {
            for (let i = 0; i < elsLen; ++i) {
                nows.push(els[i]);
            }
        }
        if (nows.length !== 0) {
            //console.log(1, nows)
            return this.q_forRenderI(req, context, nows).then(() => {
                if (deferreds.length !== 0) {
                    req.sync.afterAnimations.add(new Task(() => this.q_forRender(req, context, deferreds, addF), req.sync.local, 0));
                    return;
                }
                if (addF !== null) {
                    addF();
                }
            });
        }
        //console.log(2, delayers)
        return new Promise(ricResolve => {
            const ricId = requestIdleCallback(() => {
                req.sync.idleCallback.delete(ricId);
                this.q_forRenderI(req, context, deferreds.splice(0, config.renderBatchSize)).then(() => {
                    if (deferreds.length !== 0) {
                        return this.q_forRender(req, context, deferreds, addF).then(ricResolve);
                    }
                    if (addF !== null) {
                        addF();
                    }
                    ricResolve(undefined);
                });
            }, config.defIdleCallbackOpt);
            req.sync.idleCallback.set(ricId, ricResolve);
        });
        /*



//console.error(nowsIdxs, deferredsIdxs);
//alert(1);
        if (deferredsIdxs.size !== 0) {
            this.q_forRenderAddDeferredI(req, context, $deferreds, deferredsIdxs, 0, addF);
            if (nowsIdxs.size !== 0) {
                return this.q_forRenderI(req, context, $nows, nowsIdxs);
            }
            return;
        }
        if (nowsIdxs.size === 0) {
            return;
        }
        return this.q_forRenderI(req, context, $nows, nowsIdxs)
            .then(() => {
                if (addF !== null) {
                    addF();
                }
            });*/
    }
    /*
function q_forRenderAddDeferredI(req, context, $deferreds, deferredsIdxs, i, addF) {
    req.sync.afterAnimations.add(new Task(() => new Promise(ricResolve => {
        const ricId = requestIdleCallback(() => {
            req.sync.idleCallback.delete(ricId);
            const idxs = new Set(),
                s = i,
                $defLen = $deferreds.length;
            let c = 0;
            for (const idx of deferredsIdxs) {
                idxs.add(idx);
                deferredsIdxs.delete(idx);
                ++i;
                ++c;
                if (c === config.renderBatchSize || i === $defLen) {
                    break;
                }
            }
            const isF = i < $defLen;
            this.q_forRenderI(req, context, $deferreds.slice(s, s + c), idxs)
                .then(() => {
                    if (!isF && addF !== null) {
                        addF();
                    }
                    ricResolve();
                });
            if (isF) {
                this.q_forRenderAddDeferredI(req, context, $deferreds, deferredsIdxs, i, addF);
            }
        }, config.defIdleCallbackOpt);
        req.sync.idleCallback.set(ricId, ricResolve);
    }), req.sync.local, 0));
}*/
    q_forRenderI(req, context, els) {
        //!!idxs необходим для разделения на текущие и отложенные рендер-ы
        const arrLen = els.length;
        const arr = []; //new Array(arrLen);
        const srcBy$src = this.myweb.context.srcBy$src;
        const isSetVal = context.valName !== "";
        const isSetKey = context.keyName !== "";
        const isNotSet = !isSetVal && !isSetKey;
        for (let $i, j, i = 0; i < arrLen; ++i) {
            const elsI = els[i];
            const $elsI = elsI.$els;
            // const $elsILen = $elsI.length;
            $i = $elsI[0];
            if ($i.parentNode === null) {
                // так может получиться если удалить элемент, который рендерится из дом-а
                continue;
            }
            if (!srcBy$src.has($i)) {
                j = 1;
                do {
                    $i = $elsI[j++];
                    // так может получиться если удалить элемент, который рендерится из дом-а
                    // if ($i === undefined) {
                    // 	console.warn(22323432, req, context, els, j);
                    // 	alert(1)
                    // }
                } while (!srcBy$src.has($i)); // && j < $elsILen);//!!то что в $elsI может отсутствовать команда - проверено на этапе q_add
            }
            if (isNotSet) {
                arr[i] = new Q_arr($i, req.scope, null);
                continue;
            }
            const scopePatchI = {};
            const idxI = elsI.idx;
            if (isSetVal) {
                scopePatchI[context.valName] = context.value[idxI];
            }
            if (isSetKey) {
                scopePatchI[context.keyName] = context.keys[idxI];
            }
            arr[i] = new Q_arr($i, req.scope, scopePatchI);
            // arr.push(new Q_arr($i, req.scope, scopePatchI));
        }
        if (arr.length === 0) {
            return Promise.resolve();
        }
        //todo  нужно переносить на стр - атрибуты мешают рендерить фор->инк (1)
        return this.myweb.q_renderTag(arr, req.str, new Set(), req.sync);
    }
}
class ForeachContext {
    keys;
    value;
    els;
    valName;
    keyName;
    constructor(keys, value, $els, valName, keyName) {
        const $elsLen = $els.length;
        const els = new Array($elsLen);
        for (let i = 0; i < $elsLen; ++i) {
            els[i] = new Q_I($els[i], i);
        }
        this.keys = keys;
        this.value = value;
        this.els = els;
        this.valName = valName;
        this.keyName = keyName;
    }
}
