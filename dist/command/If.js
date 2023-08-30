import { kebabToCamelCase } from "../lib/kebabToCamelCase.js";
import { config } from "../config.js";
import { RenderRes } from "../MyWeb/RenderRes.js";
import { Task } from "../MyWeb/Task.js";
import { Command } from "./Command.js";
export class If extends Command {
    isHasScope = true;
    ifCmdName = config.ifCmdName;
    elseifCmdName = config.elseifCmdName;
    elseCmdName = config.elseCmdName;
    render(req) {
        // console.log("if", req);
        //alert(1);
        this.make$first(req);
        return this.myweb.eval2(req, req.$src, true).then(value => this.renderByVal(req, value));
        // .then(async val => {
        // 	const r = await this.renderByVal(req, val);
        // 	console.log("ifres", req.str, req.expr, val, r, req);
        // 	alert(1);
        // 	return r;
        // });
    }
    q_render(req, arr, isLast) {
        let i = 0;
        while (isLast.has(i)) {
            ++i;
        }
        const arrLen = arr.length;
        if (i === arrLen) {
            return null;
        }
        //так как иф при ку-рендере может быть только сингл, то можно не задумываться про то что в req
        return this.myweb.q_eval2(req, arr, isLast).then(values => {
            const res = new Array(arrLen);
            do {
                const reqI = this.myweb.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, null, req.sync);
                this.make$first(reqI);
                res[i] = this.renderByVal(reqI, values[i]);
                while (isLast.has(++i))
                    ;
                if (i === arrLen) {
                    break;
                }
            } while (true);
            return Promise.all(res);
        });
    }
    get$first($src, str, expr, pos) {
        return this.if_get$first($src, str, null);
    }
    get$els($src, str, expr, pos) {
        //console.error(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
        //todo type
        const srcBy$src = this.myweb.context.srcBy$src;
        const firstStr = new FirstStr("");
        let $first = this.if_get$first($src, str, firstStr);
        for (let iSrc = srcBy$src.get($first); iSrc !== undefined && !iSrc.isCmd; $first = $first.nextSibling, iSrc = srcBy$src.get($first)) {
            $first = $first.nextSibling;
        }
        //if (!$i) {
        //	!!такого не должно быть
        //}
        const iSrc = srcBy$src.get($first);
        const nStr = this.getNextStr(iSrc, firstStr.str);
        const $els = nStr !== "" ? iSrc.get$els(nStr) : [$first];
        const beforeAttrCount = this.isSingle(iSrc, firstStr.str);
        if (beforeAttrCount === -1) {
            return $els;
        }
        if (nStr !== "") {
            $first = $els[$els.length - 1];
        }
        let $maybe = new Array();
        for (let $i = $first.nextSibling; $i !== null; $i = $i.nextSibling) {
            //if ($i.nodeType !== 1) {
            //--if (!$i[p_descrId]) {//это коммент, текст или когда template и в нем скрыта текстовая нода
            const iSrc = srcBy$src.get($i);
            if (iSrc === undefined) {
                //это коммент, текст или когда template и в нем скрыта текстовая нода
                $maybe.push($i);
                continue;
            }
            if (!iSrc.isCmd) {
                return $els;
            }
            let f = true;
            let pos = 0;
            //const iDescr = iSrc.descr;
            for (const n of iSrc.descr.attr.keys()) {
                if (pos++ < beforeAttrCount) {
                    continue;
                }
                const rc = this.myweb.context.commandWithArgsByStr.get(n);
                if (rc.commandName !== this.elseifCmdName && rc.commandName !== this.elseCmdName) {
                    break;
                }
                //if (pos++ !== beforeAttrCount) {
                //	throw this.my.getError(new Error(">>>mw if:ifGet$els:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
                //}
                //!!*3
                f = false;
                //todo--if ($els.length > 20) {
                //debugger
                //}
                const nStr = this.getNextStr(iSrc, n);
                //const $iEls = nStr !== "" ? get$els($i, iDescr.get$elsByStr, nStr) : [$i];
                const $iEls = nStr !== "" ? iSrc.get$els(nStr) : [$i];
                if ($iEls.length === 1) {
                    if ($maybe.length !== 0) {
                        $els.push(...$maybe);
                        $maybe = [];
                    }
                    $els.push($i);
                    break;
                }
                //todo тут вроде всё работает - проверить доказательство
                $i = $iEls[0].previousSibling;
                $maybe = [];
                //while (!$i[p_descrId]) {
                while (true) {
                    const iSrc = srcBy$src.get($i);
                    if (iSrc === undefined) {
                        break;
                    }
                    $maybe.push($i);
                    $i = $i.previousSibling;
                }
                const $maybeLen = $maybe.length;
                if ($maybeLen !== 0) {
                    for (let i = $maybeLen - 1; i > -1; --i) {
                        $els.push($maybe[i]);
                    }
                    $maybe = [];
                }
                $i = $els[$els.push(...$iEls) - 1];
                //console.error($i, $i.nextSibling, $i.nextSibling.nextSibling);
                break;
            }
            if (f) {
                return $els;
            }
        }
        return $els;
    }
    //1) предполагается что если первый скрыт то и все такие же скрыты - и наоборот
    //2) !!: !$i[p_descrId] - это коммент, текст или когда template и в нем скрыта текстовая нода
    //3) в этом алгоритме нет проверки на идентичность условий (предполагается, что если они есть, то должны быть правильными - так как такого рода ошибка может быть в серверном рендеренге - и это точно ошибка)
    async renderByVal(req, val, testFunc = (f) => f) {
        const srcBy$src = this.myweb.context.srcBy$src;
        const src = srcBy$src.get(req.$src);
        const pScope = this.myweb.get$srcScope(req.$src.parentNode); //todo разобраться с парентом
        const reqI = this.myweb.createReq(req.$src, req.str, req.expr, src.scope !== null ? src.getScope(pScope) : req.scope, null, req.sync);
        let isTrue = testFunc(val);
        if (isTrue) {
            const valName = kebabToCamelCase(reqI.commandWithArgs.args[0]);
            if (valName !== "") {
                reqI.scope[config.p_target][valName] = val;
            }
        }
        let showRes = this.makeShow(reqI, reqI.$src, reqI.str, isTrue);
        const beforeAttrCount = this.isSingle(srcBy$src.get(reqI.$src), reqI.str);
        // console.log(1, isTrue, beforeAttrCount, req);
        if (beforeAttrCount === -1) {
            //return new RenderRes(!isTrue, $attr, $last);
            //return new RenderRes(attrStr === "", null, $last, attrStr, $attr); //info если attrStr === "" - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запущен рендер в афтерАнимации
            return showRes.attrStr === "" ? new RenderRes(showRes.$last) : null;
        }
        for (let $i = showRes.$last.nextSibling; $i !== null; $i = $i.nextSibling) {
            //if ($i.nodeType !== 1) {
            //if (!$i[p_descrId]) {//это коммент, текст или когда template и в нем скрыта текстовая нода
            const iSrc = srcBy$src.get($i);
            if (iSrc === undefined) {
                //это коммент, текст или когда template и в нем скрыта текстовая нода
                continue;
            }
            if (!iSrc.isCmd) {
                break;
            }
            let f = true;
            let pos = 0;
            for (const [n, v] of iSrc.descr.attr) {
                if (pos++ < beforeAttrCount) {
                    continue;
                }
                const rc = this.myweb.context.commandWithArgsByStr.get(n);
                //console.log(req.str, iSrc, $i, n, rc.commandName, elseifCmdName, elseCmdName)
                if (rc.commandName !== this.elseifCmdName && rc.commandName !== this.elseCmdName) {
                    break;
                }
                //if (pos++ !== beforeAttrCount) {
                //	throw this.my.getError(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
                //}
                const reqI = this.myweb.createReq($i, n, v, iSrc.scope !== null ? iSrc.getScope(pScope) : req.scope, null, req.sync);
                //!!*3
                f = false;
                if (isTrue) {
                    //это означает, что ранее был показан блок и текущий нужно скрыть, и далее рендерить по ранее заданному $attr
                    //if ($i.nodeName === "TEMPLATE") {
                    //	$last = $i;
                    //	break;
                    //}
                    $i = showRes.$last = this.makeShow(reqI, $i, n, false).$last;
                    //console.log(2, $last, $attr, attrStr);
                    // $i = $last;
                    break;
                }
                if (rc.commandName === this.elseCmdName) {
                    showRes = this.makeShow(reqI, $i, n, true);
                    //console.log(3, $last, $attr, attrStr);
                    $i = showRes.$last;
                    break;
                }
                //это elsif
                val = await this.myweb.eval2(reqI, $i, true);
                isTrue = testFunc(val);
                if (isTrue) {
                    const valName = kebabToCamelCase(reqI.commandWithArgs.args[0]);
                    if (valName !== "") {
                        reqI.scope[config.p_target][valName] = val;
                    }
                    showRes = this.makeShow(reqI, $i, n, true);
                    //console.log(4, $last, $attr, attrStr);
                    $i = showRes.$last;
                    val = true;
                    break;
                }
                showRes = this.makeShow(reqI, $i, n, false);
                //console.log(5, f, $i, $last, $attr, attrStr);
                $i = showRes.$last;
                //val = false;
                break;
            }
            if (f) {
                break;
            }
        }
        //return new RenderRes(attrStr === "" ? $last : null, $attr, attrStr); //info если attrStr === "" - это значит, что что-то не показывается, а если нужно рендерить вглубь, то был запущен рендер в афтерАнимации
        console.log(122, showRes.$last, showRes.$attr, showRes.attrStr);
        return new RenderRes(showRes.$last, showRes.$attr, showRes.attrStr); //info если attrStr === "" - это значит, что что-то не показывается, а если нужно рендерить вглубь, то был запущен рендер в афтерАнимации
    }
    // //todo--
    // private getParentScope($e: HTMLElement) {
    // 	const srcBy$src = this.my.context.srcBy$src;
    // 	const $top = this.my.context.rootElement.parentNode;
    // 	for (let $i = $e.parentNode; $i !== $top; $i = ($i as HTMLElement).parentNode) {
    // 		const iSrc = srcBy$src.get($i as HTMLElement) as Src;
    // 		if (iSrc.scope !== null) {
    // 			return iSrc.scope;
    // 		}
    // 	}
    // 	return {};
    // }
    make$first(req) {
        let pos = 0;
        for (const name of this.myweb.context.srcBy$src.get(req.$src).descr.attr.keys()) {
            if (name === req.str) {
                break;
            }
            ++pos;
        }
        const $first = this.if_get$first(req.$src, req.str, null);
        if (this.myweb.context.commandWithArgsByStr.get(req.str).commandName === this.ifCmdName) {
            req.$src = $first;
            return;
        }
        for (const [str, expr] of this.myweb.context.srcBy$src.get($first).descr.attr) {
            const rc = this.myweb.context.commandWithArgsByStr.get(str);
            if (rc.commandName === this.ifCmdName) {
                req.commandWithArgs = rc;
                req.str = str;
                req.expr = expr;
                req.$src = $first;
                return;
            }
        }
    }
    if_get$first($src, str, firstStr) {
        const isStrIf = str !== "" && this.myweb.context.commandWithArgsByStr.get(str).commandName === this.ifCmdName;
        const srcBy$src = this.myweb.context.srcBy$src;
        for (let $i = $src; $i !== null; $i = $i.previousSibling) {
            // if ($i.nodeType !== 1) {
            const iSrc = srcBy$src.get($i);
            if (iSrc === undefined) {
                //это коммент, текст или когда template и в нем скрыта текстовая нода
                continue;
            }
            if (!iSrc.isCmd) {
                break;
            }
            let f = true;
            let l = 0;
            for (const n of iSrc.descr.attr.keys()) {
                const rc = this.myweb.context.commandWithArgsByStr.get(n);
                if (rc.commandName === config.importCmdName) {
                    l = 0;
                    continue;
                }
                ++l;
                if (isStrIf) {
                    if (n !== str) {
                        continue;
                    }
                }
                else if (rc.commandName === this.elseifCmdName || rc.commandName === this.elseCmdName) {
                    if (l !== 1) {
                        throw this.myweb.getError(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
                    }
                    f = false;
                    break;
                }
                else if (rc.commandName !== this.ifCmdName) {
                    // || (isStrIf && n !== str)) {
                    continue;
                }
                if (firstStr !== null) {
                    firstStr.str = n;
                }
                let incCount = 0;
                let forBefore = new Array();
                let forStr = "";
                let forIdx;
                const attrIt = iSrc.descr.attr.keys();
                for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
                    if (incCount === 0) {
                        const n = i.value;
                        const rc = this.myweb.context.commandWithArgsByStr.get(n);
                        if (rc.commandName === config.foreachCmdName) {
                            forBefore.push([n, iSrc.getIdx(n)]);
                        }
                    }
                    if (i.value !== str) {
                        continue;
                    }
                    for (i = attrIt.next(); !i.done; i = attrIt.next()) {
                        const n = i.value;
                        const rc = this.myweb.context.commandWithArgsByStr.get(n);
                        if (forStr === "" && rc.commandName === config.importCmdName) {
                            if (iSrc.getIdx(n) !== undefined) {
                                ++incCount;
                            }
                        }
                        else if (incCount === 0 && forStr === "" && rc.commandName === config.foreachCmdName) {
                            forIdx = iSrc.getIdx(n);
                            if (forIdx !== undefined) {
                                forStr = n;
                            }
                        }
                    }
                    break;
                }
                if (incCount !== 0) {
                    for ($i = $i.previousSibling; $i !== null; $i = $i.previousSibling) {
                        if ($i.nodeType === 8 && $i.textContent === "inc_begin") {
                            if (--incCount) {
                                continue;
                            }
                            for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
                                const iSrc = srcBy$src.get($i);
                                if (iSrc !== undefined && iSrc.isCmd) {
                                    return $i;
                                }
                            }
                            break;
                        }
                    }
                    throw this.myweb.getError(new Error(">>>mw if:make$first:02 Invalid structure: inc_begin not found"), $src);
                }
                if (forIdx !== undefined) {
                    //forStr !== "") {
                    const forBeforeLen = forBefore.length;
                    for (let $j = $i.previousSibling; $j !== null; $j = $j.previousSibling) {
                        const jSrc = srcBy$src.get($j);
                        if (jSrc === undefined || !jSrc.isCmd) {
                            continue;
                        }
                        const jdx = jSrc.getIdx(forStr);
                        if (jdx === undefined || forIdx < jdx) {
                            return $i;
                        }
                        if (forBeforeLen > 0) {
                            for (let i = 0; i < forBeforeLen; ++i) {
                                const b = forBefore[i];
                                if (jSrc.getIdx(b[0]) !== b[1]) {
                                    return $i;
                                }
                            }
                        }
                        $i = $j;
                        forIdx = jdx;
                        //--if (jdx === "0") {
                        //	$i = $j;
                        //}
                    }
                    return $i;
                }
                return $i;
            }
            if (f) {
                break;
            }
        }
        throw this.myweb.getError(new Error(`>>>mw if:ifGet$first:02 Invalid structure: if-command not found - str => "${str}"`), $src);
    }
    isSingle(src, str) {
        //проверка на то что этот иф входит в конструкцию типа: <div elseif="*" if="этот иф"
        let beforeAttrCount = 0;
        let isNotSingle = true;
        for (const n of src.descr.attr.keys()) {
            if (n === str) {
                break;
            }
            const nn = this.myweb.context.commandWithArgsByStr.get(n).commandName;
            if (this.ifCmdName === config.switchCmdName && nn === config.switchCmdName) {
                continue;
            }
            ++beforeAttrCount;
            switch (nn) {
                case this.ifCmdName:
                case config.elseifCmdName:
                case config.elseCmdName:
                case config.foreachCmdName:
                //case config.switchCmdName:
                case config.caseCmdName:
                case config.defaultCmdName:
                    //++beforeAttrCount;
                    isNotSingle = false;
                    //console.log(333333, $src, str, n, this.my.context.descrById.get($src[p_descrId]).attr);
                    break;
                case config.importCmdName:
                    /*
                    const $els = get$els($src, src.descr.get$elsByStr, n);
                    for (let $i = $els[$els.length - 2];; $i = $i.previousSibling) {
                        const iSrc = srcBy$src.get($i);
                        if (!iSrc.isCmd) {
                            continue;
                        }
                        if (iSrc.descr.attr.has(str)) {
                            return -1;
                        }
                        break;
                    }*/
                    //++beforeAttrCount;
                    isNotSingle = true;
                    break;
            }
        }
        return isNotSingle ? beforeAttrCount : -1;
    }
    makeShow(req, $i, str, isShow) {
        const srcBy$src = this.myweb.context.srcBy$src;
        const src = srcBy$src.get($i);
        const nStr = this.getNextStr(src, str);
        const $els = nStr !== "" ? src.get$els(nStr) : [$i];
        const $elsLen = $els.length;
        const $last = $els[$elsLen - 1];
        if (!isShow) {
            for (let i = 0; i < $elsLen; ++i) {
                //$i = $els[i];
                //if ($i.nodeType === 1) {
                //	this.my.hide(req, $i);
                //}
                this.myweb.hide(req, $els[i]);
            }
            return new ShowRes($last, null, "");
        }
        let $attr = null;
        // let attrStr = "";
        let isNotAnimations = true;
        for (let i = 0; i < $elsLen; ++i) {
            $i = $els[i];
            const iSrc = srcBy$src.get($i);
            //if ($i.nodeType !== 1) {
            if (iSrc === undefined) {
                if ($i.nodeType === 1) {
                    //info тег без описания - это текстовая нода скрытая за template
                    this.myweb.show(req, $i);
                    isNotAnimations = false;
                }
                continue;
            }
            //if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
            if (iSrc.isHide) {
                this.myweb.show(req, $i);
                isNotAnimations = false;
            }
            if ($attr === null) {
                $attr = $i;
                // attrStr = str;
            }
        }
        /*<==
        for (let i = 0; i < $elsLen; ++i) {
            $i = $els[i];
            if ($i.nodeType === 8) {
                continue;
            }
            if ($attr === null) {
                const iSrc = srcBy$src.get($i);
                if (iSrc !== undefined && iSrc.isCmd) {
                    $attr = $i;
                    attrStr = str;
                }
            }
            if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
                this.my.show(req, $i);
                isNotAnimations = false;
            }
        }*/
        console.log(111, $els, isNotAnimations);
        if (isNotAnimations) {
            return new ShowRes($last, $attr, str);
        }
        const srcId = srcBy$src.get($attr).id;
        req.sync.afterAnimations.add(new Task(() => this.myweb.renderTag(this.myweb.context.$srcById.get(srcId), req.scope, str, req.sync), req.sync.local, 0));
        return new ShowRes($last, null, "");
    }
    getNextStr(src, str) {
        return str !== config.switchCmdName ? src.getNextStr(str) : src.getNextStr(src.getNextStr(str));
    }
}
class FirstStr {
    str;
    constructor(str) {
        this.str = str;
    }
}
class ShowRes {
    $last;
    $attr;
    attrStr;
    constructor($last, $attr, attrStr) {
        this.$last = $last;
        this.$attr = $attr;
        this.attrStr = attrStr;
    }
}
