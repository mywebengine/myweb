import { getRequest } from "../lib/getRequest.js";
import { getUrl } from "../lib/getUrl.js";
import { CustomElementState } from "../MyWeb/CustomElementState.js";
import { Command } from "./Command.js";
import { config } from "../config.js";
const my = self;
export class Import extends Command {
    //importCache = new Map();
    importScriptCache = new Map();
    isWaiting = new Set();
    reset() {
        //this.importCache.clear();
        this.importScriptCache.clear();
        this.isWaiting.clear();
    }
    render(req) {
        return this.myweb.eval2(req, req.$src, true).then(value => {
            this.renderByValue(req, value);
            return null;
        });
    }
    q_render(req, arr, isLast) {
        return this.myweb.q_eval2(req, arr, isLast).then(values => {
            const arrLen = arr.length;
            for (let i = 0; i < arrLen; ++i) {
                if (!isLast.has(i)) {
                    this.renderByValue(this.myweb.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, null, req.sync), values[i]);
                }
            }
            return null;
        });
    }
    renderByValue(req, val) {
        const customElementByKey = this.myweb.context.customElementByKey;
        const cEl = this.getImport(req, val);
        if (cEl === null || cEl.readyState === "complete" || customElementByKey.has(cEl.key)) {
            return;
        }
        customElementByKey.set(cEl.key, cEl);
        if (cEl.res !== null) {
            return cEl.res.text().then((html) => this.createImportFragment(req, cEl, html));
        }
        if (cEl.req !== null) {
            return fetch(cEl.req)
                .then(res => res.text())
                .then((html) => this.createImportFragment(req, cEl, html));
        }
        //!!
        throw new Error("Такого быть не должно, так как в конструкторе CustomElementState есть защита от этой ситуации");
    }
    getImport(req, val) {
        if (val === null || val === undefined) {
            return null;
        }
        const customElementByKey = this.myweb.context.customElementByKey;
        const type = req.commandWithArgs.args[1];
        if (typeof val === "string") {
            const cElReq = getRequest(val, this.getTopUrl(this.myweb.context.srcBy$src.get(req.$src), req.str));
            if (cElReq === null) {
                return null;
            }
            const cEl = customElementByKey.get(cElReq.url);
            if (cEl !== undefined) {
                return cEl;
            }
            const imp = new CustomElementState("loading", type, cElReq.url, cElReq, null, req.scope);
            customElementByKey.set(cElReq.url, imp);
            return imp;
        }
        if (val instanceof Response) {
            const cEl = customElementByKey.get(val);
            if (cEl !== undefined) {
                return cEl;
            }
            const imp = new CustomElementState("complete", type, null, null, val, req.scope);
            customElementByKey.set(val, imp);
            return imp;
        }
        //todo так как у респонса не получится узнать гет ли он - то все добавляем кэш - А при использовании в строке в фетч - он всегда будет разный ...
        if (val.method === "GET") {
            //} || r.method === undefined) {
            const cEl = customElementByKey.get(val.url);
            if (cEl !== undefined) {
                return cEl;
            }
            const imp = new CustomElementState("loading", type, val.url, val, null, req.scope);
            customElementByKey.set(val.url, imp);
            return imp;
        }
        return new CustomElementState("loading", type, val.url, val, null, req.scope);
    }
    getTopUrl(src, str) {
        if (str !== "") {
            const topUrl = this.getAttrTopUrl(src, str); //из-за if ($i[config.p_topUrl]) { - так как это должэно работать только для робителей
            if (topUrl !== "") {
                return topUrl;
            }
        }
        const srcBy$src = this.myweb.context.srcBy$src;
        for (let $i = this.myweb.context.$srcById.get(src.id).parentNode; $i !== this.myweb.context.rootElement; $i = $i.parentNode) {
            /*--
            if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
//console.log("getTopUrl", $src, str);
                return getTopUrl($srcById.get(descrById.get(srcBy$src.get($e).descrId).srcId)]);
            }*/
            const topUrl = this.getAttrTopUrl(srcBy$src.get($i), "");
            if (topUrl !== "") {
                return topUrl;
            }
            const url = $i[config.p_topUrl];
            if (url !== undefined) {
                return url;
            }
        }
        return "";
    }
    getAttrTopUrl(src, str) {
        if (!src.isCmd) {
            return "";
        }
        const nattr = src.descr.attr.keys();
        let topUrl = "";
        if (str !== "") {
            for (const n of nattr) {
                if (n === str) {
                    break;
                }
                if (this.myweb.context.commandWithArgsByStr.get(n).commandName === config.importCmdName) {
                    //!!maybe todo пока работает только для import
                    const idx = src.getIdx(n);
                    if (idx !== undefined) {
                        topUrl = String(idx);
                    }
                }
            }
            return topUrl;
        }
        for (const n of nattr) {
            if (this.myweb.context.commandWithArgsByStr.get(n).commandName === config.importCmdName) {
                //!!maybe todo пока работает только для import
                const idx = src.getIdx(n);
                if (idx !== undefined) {
                    topUrl = String(src.getIdx(n));
                }
            }
        }
        return topUrl;
    }
    async createImportFragment(req, imp, html) {
        const $fr = this.myweb.context.document.createDocumentFragment();
        const $div = this.myweb.context.document.createElement("div");
        $div.innerHTML = html;
        for (let $i = $div.firstChild; $i !== null; $i = $div.firstChild) {
            $fr.appendChild($i);
        }
        if (my.createLineNo && imp.url !== null) {
            my.createLineNo(imp.url, html, $fr);
        }
        imp.$fr = $fr;
        imp.readyState = "complete";
        const $scripts = $fr.querySelectorAll("script");
        if ($scripts.length !== 0) {
            await this.createImportScripts(req, imp, $scripts);
        }
        if (imp.type !== "include") {
            return;
        }
        imp.$tags = [];
        this.addLinks(imp);
        this.addStyles(imp);
        if (imp.$tags.length === 0) {
            return;
        }
        //todo может быть просто вставить?
        //--req.sync.animations.add(new Task(() => {//todo- если так сделать то онрендер на тегах не сработает - пусть так
        if (imp.$tags[0].parentNode === this.myweb.context.document.head) {
            //todo такого не должно быть - можно удалять
            console.warn("createImportFragment", imp.$tags, req);
            //alert(1);
        }
        for (const $i of imp.$tags) {
            this.myweb.context.document.head.appendChild($i);
        }
        this.myweb.joinText($fr);
        //--}, req.sync.local, 0));
    }
    createImportScripts(req, imp, $scripts) {
        const $sLen = $scripts.length;
        const scripts = new Array($sLen);
        for (let i = 0; i < $sLen; ++i) {
            scripts[i] = this.createImportScript(req, imp, $scripts[i]);
        }
        return Promise.all(scripts);
    }
    createImportScript(req, imp, $e) {
        $e.parentNode.removeChild($e);
        const origUrl = $e.getAttribute("src");
        const url = origUrl !== null ? getUrl(origUrl, imp.url) : undefined;
        // if (url !== origUrl) {
        // 	$e.setAttribute("src", url);
        // }
        if ($e.type === "module") {
            if (url !== undefined) {
                return import(url)
                    .then(m => this.importToScope(m, imp))
                    .catch(err => {
                    throw this.checkScript(err, $e, req, url);
                });
            }
            const urlObject = URL.createObjectURL(new Blob([$e.textContent], {
                type: "text/javascript",
            }));
            return import(urlObject)
                .then(m => this.importToScope(m, imp))
                .catch(err => {
                throw this.checkScript(err, $e, req);
            })
                .finally(() => {
                //if (my.debugLevel !== 0) {//todo
                URL.revokeObjectURL(urlObject);
                //}
            });
        }
        if (url === undefined) {
            this.runImportScript(req, $e.textContent, $e, url);
            return;
        }
        const s = this.importScriptCache.get(url);
        if (s !== undefined) {
            this.runImportScript(req, s, $e, url);
            return;
        }
        return fetch(url, config.defRequestInit)
            .then(res => {
            if (res.ok) {
                return res.text();
            }
            throw this.myweb.getError(new Error(`>>>mw import:createImportScript: Request stat ${res.status}`), req.$src, req);
        })
            .then(text => {
            this.importScriptCache.set(url, text);
            this.runImportScript(req, text, $e, url);
        });
    }
    importToScope(module, imp) {
        imp.scope = {};
        for (const i in module) {
            const j = module[i];
            imp.scope[j.name !== undefined ? j.name : i] = j;
        }
    }
    /*
    #scopeToImport(imp, req) {
        if (imp.scope === null) {
            return;
        }
        for (const n in imp.scope) {
            req.scope[config.p_target][n] = imp.scope[n];
        }
    }*/
    runImportScript(req, text, $e, url) {
        try {
            //new Function(text).apply($e);
            self.eval(text);
        }
        catch (err) {
            throw this.checkScript(err, $e, req, url);
        }
    }
    checkScript(err, $e, req, url) {
        if (url === null) {
            return this.myweb.getError(err, $e, req, undefined, url); //, err.lineNumber, err.columnNumber);
        }
        const line = my.getLineNo ? my.getLineNo($e) : null;
        if (line === null) {
            return this.myweb.getError(err, $e, req);
        }
        const numIdx = line.lastIndexOf(":");
        return this.myweb.getError(err, $e, req, undefined, line.substring(0, numIdx), Number(line.substring(numIdx + 1))); //Number(line.substring(numIdx + 1)) - 1 + err.lineNumber);
    }
    addLinks(imp) {
        if (imp.$tags === null) {
            imp.$tags = [];
        }
        const $links = imp.$fr.querySelectorAll("link[rel]");
        const $linksLen = $links.length;
        for (let i = 0; i < $linksLen; ++i) {
            const $i = $links[i];
            imp.$tags.push($i);
            const href = $i.getAttribute("href");
            if (href) {
                const url = getUrl(href, imp.url || undefined);
                if (href !== url) {
                    $i.setAttribute("href", url);
                }
            }
        }
    }
    addStyles(imp) {
        if (imp.$tags === null) {
            imp.$tags = [];
        }
        const $styles = imp.$fr.querySelectorAll("style");
        const $stylesLen = $styles.length;
        for (let i = 0; i < $stylesLen; ++i) {
            imp.$tags.push($styles[i]);
        }
    }
}
