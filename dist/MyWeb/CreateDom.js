import { Command } from "../command/Command.js";
import { config } from "../config.js";
import { Cache } from "./Cache.js";
import { Descr } from "./Descr.js";
import { Get$elsByStr } from "./Get$elsByStr.js";
import { Base_MyWeb } from "./Base_MyWeb.js";
import { Src } from "./Src.js";
const null_get$els = Command.prototype.get$els;
export class CreateDom extends Base_MyWeb {
    createSrc($e, descr, asOneIdx, idx) {
        //вызов этой функции должен быть обязательно слева направо по документу, если это фрагмент, то нужно обработать края
        const srcId = this.getNewId();
        const isHide = $e.getAttribute(config.hideName) !== null;
        //!!!
        if (descr === null) {
            //if (1) {
            descr = this.createDescr($e, srcId);
            const src = descr.attr === null
                ? new Src(this, srcId, descr, false, isHide, null, null, null, null)
                : new Src(this, srcId, descr, true, isHide, descr.isHasScope ? this.getScopeReact({}) : null, null, null, new Cache());
            //if (descr.asOnes !== null && asOneIdx !== undefined) {src.asOneIdx = asOneIdx;}
            this.context.$srcById.set(srcId, $e);
            this.context.srcById.set(srcId, src);
            this.context.srcBy$src.set($e, src);
            //!!если мы сделаем это, то в Инке во время Подготовки будет вызываться это место и мы потеряем старые асОне
            //if (descr.asOnes !== null) {
            //	src.asOneIdx = new Map();
            //	src.idx = new Map();
            //	for (const str of descr.asOnes) {
            //		src.setAsOneIdx(str, this.getNewId());
            //		src.setIdx(str, 0);
            //	}
            //}
            return src;
        }
        descr.srcIds.add(srcId); //пока используется для получения .srcId при удалении and prepareParam
        const src = descr.attr !== null
            ? new Src(this, srcId, descr, true, isHide, descr.isHasScope ? this.getScopeReact({}) : null, asOneIdx, idx, new Cache())
            : new Src(this, srcId, descr, false, isHide, null, null, null, null);
        this.context.$srcById.set(srcId, $e);
        this.context.srcById.set(srcId, src);
        this.context.srcBy$src.set($e, src);
        // if (!srcByDescr.isCmd) {
        // 	return srcByDescr;
        // }
        /*
        for (const [n, v] of descr.attr) {
            if (n !== importCmdName) {
                continue;
            }
            const incKey = src.getIdx(n);
            if (incKey !== undefined) {
                ++importCache.get(src.getIdx(n)).counter;
            }
        }
*/
        //moveLoading($e, srcId);
        return src;
    }
    createDescr($e, srcId) {
        const id = this.getNewId();
        const attr = this.createAttr($e);
        if (attr.size === 0) {
            const descr = new Descr(id, srcId, null, null);
            this.context.descrById.set(id, descr);
            return descr;
        }
        const descr = new Descr(id, srcId, attr, new Set());
        let pos = 0;
        for (const [str, expr] of attr) {
            const rc = this.context.commandWithArgsByStr.get(str);
            // if (rc === null) {
            // 	continue;
            // }
            if (rc.command.get$els !== null_get$els) {
                if (descr.get$elsByStr === null) {
                    descr.get$elsByStr = new Map([[str, new Get$elsByStr(/*rc.command, str, */ expr, pos)]]);
                }
                else {
                    descr.get$elsByStr.set(str, new Get$elsByStr(/*rc.command, str, */ expr, pos));
                }
            }
            ++pos;
            if (rc.command.isHasScope === true &&
                descr.isHasScope === false &&
                rc.args.length !== 0 &&
                (rc.args[0] !== "" || (rc.command.isAsOne && rc.args[1] !== ""))) {
                descr.isHasScope = true;
            }
            if (rc.command.isCustomHtml === true && descr.isCustomHtml === false) {
                descr.isCustomHtml = true;
            }
            if (rc.command.isAsOne === true) {
                if (descr.asOnes === null) {
                    descr.asOnes = new Set();
                }
                descr.asOnes.add(str);
            }
        }
        this.context.descrById.set(id, descr);
        return descr;
    }
    /*
    moveLoading($e, srcId) {
        const l = this.context.loadingCount.get($e);
        if (l === undefined) {
            return;
        }
        this.context.loadingCount.set(srcId, l);
        this.context.loadingCount.delete($e);
    }
*/
    prepare$src($i, isLinking) {
        //$i = this.context.rootElement, isLinking) {//todo это не будет работать если после фора идет вставка на много тегов
        const $parent = $i.parentNode;
        const $p = [];
        const idAlias = new Map(); //todo разнотипный мап!? ---- это вообще нужно убрать - это про старый SSR
        do {
            //////////////////////
            switch ($i.nodeType) {
                case 1:
                    if ($i.firstChild !== null) {
                        $i = $i.firstChild;
                        continue;
                    }
                    if ($i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {
                        $p.push($i);
                        $i = $i.content.firstChild;
                        continue;
                    }
                    $i = this.prepare$src_createSrc($i, idAlias, isLinking);
                    break;
                case 3:
                    $i = this.replaceTextBlocks($i);
                    break;
            }
            if ($i.parentNode === $parent) {
                //если мы не ушли вглубь - значит и вправо двигаться нельзя
                return;
            }
            if ($i.nextSibling !== null) {
                $i = $i.nextSibling;
                continue;
            }
            do {
                $i = $i.parentNode; //!!
                if ($i.nodeType === 11) {
                    $i = $p.pop();
                }
                $i = this.prepare$src_createSrc($i, idAlias, isLinking);
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
    joinText($e) {
        for (let $next, $i = $e.firstChild; $i !== null; $i = $i.nextSibling) {
            while ($i.nodeType === 3 && ($next = $i.nextSibling) !== null && $next.nodeType === 3) {
                $i.textContent += $e.removeChild($next).textContent || "";
            }
        }
    }
    createAttr($e) {
        const attr = new Map();
        const attrs = $e.attributes;
        const attrsLen = attrs.length;
        for (let i = 0; i < attrsLen; ++i) {
            ////const a = attrs.item(i);
            const a = attrs[i];
            //todo	for (const a of $e.attributes) {
            if (this.addStrToCommandWithArgsIfThatCommend(a.name)) {
                attr.set(a.name, a.value);
            }
        }
        return attr;
    }
    prepare$src_createSrc($e, idAlias, isLinking) {
        if (!isLinking) {
            this.createSrc($e, null, null, null);
            return $e;
        }
        //todo --
        const src = this.prepare_getSrc($e, idAlias); //todo
        if (src.descr.attr === null) {
            //!src.isCmd) {
            return $e;
        }
        for (const str of src.descr.attr.keys()) {
            const asOneIdx = $e.getAttribute(config.asOneIdxName + str);
            const idx = $e.getAttribute(config.idxName + str);
            if (asOneIdx !== null) {
                const aIdx = idAlias.get(asOneIdx); //todo
                if (aIdx === undefined) {
                    const nIdx = this.getNewId();
                    idAlias.set(asOneIdx, nIdx);
                    if (src.asOneIdx === null) {
                        src.asOneIdx = new Map([[str, nIdx]]);
                    }
                    else {
                        src.asOneIdx.set(str, nIdx);
                    }
                }
                else if (src.asOneIdx === null) {
                    src.asOneIdx = new Map([[str, aIdx]]);
                }
                else {
                    src.asOneIdx.set(str, aIdx);
                }
            }
            if (idx !== null) {
                if (src.idx === null) {
                    src.idx = new Map([[str, Number(idx)]]);
                    continue;
                }
                src.idx.set(str, Number(idx));
            }
            /*!!!!!!
            if (this.context.commandWithArgsByStr.get(str).command.isAsOne === false) {
                continue;
            }
            const $from = $i;
            for (let $j = $i.nextSibling; $j !== null; $j = $j.nextSibling) {
                if ($j.nodeType !== 1) {
                    continue;
                }
                if (get$asOneIdx($j, str) !== asOneIdx && !(get$Idx($j, str) > 0)) {
                    break;
                }
                this._preRenderCopy($from, iDescr, $i = $j);
            }
            break;*/
        }
        return $e;
    }
    prepare_getSrc($e, idAlias) {
        const descrId = $e.getAttribute(config.descrIdName);
        if (descrId === null) {
            return this.createSrc($e, null, null, null);
        }
        const descr = idAlias.get(descrId);
        if (descr !== undefined) {
            return this.createSrc($e, descr, null, null);
        }
        const src = this.createSrc($e, this.createDescr($e, 0), null, null);
        src.descr.srcId = src.id;
        idAlias.set(descrId, src.descr);
        return src;
    }
    /*
    //private
    preRenderCopy($f, fDescr, $i) {
        const $parent = $f.parentNode,
            $p = [],
            $fP = [];
        do {
            if ($i.nodeType === 1) {
//console.log($f, $i);
                this.createSrc($i, fDescr);
            }
//////////////////////
            //todo команда или нет?
            if ($i.nodeName === "TEMPLATE" && $i.content.firstChild.firstChild !== null) {
                $p.push($i);
                $i = $i.content.firstChild;
            }
            if ($f.nodeName === "TEMPLATE" && $f.content.firstChild.firstChild !== null) {
                $fP.push($f);
                $f = $f.content.firstChild;
            }
            if ($i.firstChild !== null) {
                $i = $i.firstChild;
                $f = $f.firstChild;
                continue;
            }
            if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
                break;
            }
            if ($i.nextSibling !== null) {
                $i = $i.nextSibling;
                while ($f.nextSibling !== null) {
                    $f = $f.nextSibling;
                }
                continue;
            }
            do {
                $i = $i.parentNode;
                if ($i.parentNode === $parent) {
//					$i = null;
                    $f = null;
                    break;
                }
                if ($i.parentNode.nodeType === 11) {
                    $i = $p.pop();
                    if ($i.parentNode === $parent) {
//						$i = null;
                        $f = null;
                        break;
                    }
                }
                $f = $f.parentNode;
                if ($f.parentNode.nodeType === 11) {
                    $f = $fP.pop();
                }
                if ($i.nextSibling !== null) {
                    $i = $i.nextSibling;
                    while ($f.nextSibling !== null) {
                        $f = $f.nextSibling;
                    }
                    break;
                }
            } while (true);
        } while ($f);
    }*/
    replaceTextBlocks($src) {
        // const text = $src.textContent;
        // if (text.indexOf("${") === -1 || $src.parentNode.nodeName === "SCRIPT") {
        // 	return $src;
        // }
        // if ($src.nextSibling === null && $src.previousSibling === null) {
        // 	$src.parentNode.setAttribute(config.textCmdName, "`" + text + "`");
        // 	return $src;
        // }
        // const $t = this.context.document.createElement("span");
        // $t.setAttribute(config.textCmdName, "`" + text + "`");
        // $src.parentNode.replaceChild($t, $src);
        // this.createSrc($t);
        // return $t;
        const text = $src.textContent || "";
        let i = text.indexOf("${");
        if (i === -1 || $src.parentNode.nodeName === "SCRIPT") {
            return $src;
        }
        const $parent = $src.parentNode; //!!
        const textLen = text.length;
        let count = 1;
        let exprStartIdx = i;
        let textStartIdx = 0;
        let $i = null;
        i += 2;
        for (; i < textLen; ++i) {
            const c = text[i];
            if (c === "{") {
                if (++count === 1) {
                    exprStartIdx = i - 1;
                }
                continue;
            }
            if (c !== "}") {
                continue;
            }
            if (--count !== 0) {
                if (count < 0) {
                    throw this.getError(new Error(">>>mw dom:replaceTextBlocks:01: Syntax error: need open"), $src);
                }
                continue;
            }
            if (text[exprStartIdx] === "$") {
                $i = this.context.document.createElement("span");
                $i.setAttribute(config.textCmdName, text.substring(exprStartIdx + 2, i));
                if (exprStartIdx === 0) {
                    $parent.replaceChild($i, $src); //!!
                }
                else {
                    $src.textContent = text.substring(textStartIdx, exprStartIdx);
                    $parent.insertBefore($i, $src.nextSibling); //!!
                }
                textStartIdx = i + 1;
                this.createSrc($i, null, null, null);
            }
        }
        if (count !== 0) {
            throw this.getError(new Error(">>>mw dom:replaceTextBlocks:01: Syntax error: need close"), $src);
        }
        // if (textStartIdx === textLen) {
        if ($i === null) {
            return $i;
        }
        return $parent.insertBefore(this.context.document.createTextNode(text.substring(textStartIdx)), $i.nextSibling);
    }
}
