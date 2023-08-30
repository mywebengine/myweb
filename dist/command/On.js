import { config } from "../config.js";
import { kebabToCamelCase } from "../lib/kebabToCamelCase.js";
import { Command } from "./Command.js";
const holdsKeys = new Set(["ctrl", "alt", "shift", "meta"]);
export class On extends Command {
    isInit = new WeakMap();
    // reset() {
    // 	this.isInit.clear();
    // }
    render(req) {
        this.renderBy$src(req, req.$src);
        return null;
    }
    q_render(req, arr, isLast) {
        const arrLen = arr.length;
        for (let i = 0; i < arrLen; ++i) {
            if (!isLast.has(i)) {
                this.renderBy$src(req, arr[i].$src);
            }
        }
        return null;
    }
    renderBy$src(req, $src) {
        const n = kebabToCamelCase(req.commandWithArgs.args[0]);
        if (n === "") {
            throw this.myweb.getError(new Error(">>>mw on:render:01: Need set action name"), $src, req);
        }
        const src = this.myweb.context.srcBy$src.get($src);
        //if (src !== undefined) {
        //	const c = getCacheBySrcId($src[p_srcId]);
        const cache = src.cache;
        if (cache.isInits.has(req.str)) {
            // || ($src._isInit !== undefined && $src._isInit.has(req.str))) {
            return;
        }
        cache.isInits.add(req.str);
        const ii = this.isInit.get($src);
        if (ii !== undefined && ii.has(req.str)) {
            ii.delete(req.str);
            return;
        }
        /*
//todo
        } else {
console.warn(32423423, req);
            const ii = this.isInit.get($src);
            if (ii !== undefined && ii.has(req.str)) {
                return;
            }
            this.isInit.set($src, new Set([req.str]));
        }*/
        const opt = new ListenerOptions();
        //todo
        // const opt = {};
        for (let i = req.commandWithArgs.args.length - 1; i > 0; --i) {
            switch (req.commandWithArgs.args[i]) {
                case "capture":
                    opt.capture = true;
                    continue;
                case "once":
                    opt.once = true;
                    continue;
                case "passive":
                    opt.passive = true;
            }
        }
        $src.addEventListener(n, evt => this.listen(req, $src, evt), opt);
    }
    listen(req, $src, evt) {
        const argsLen = req.commandWithArgs.args.length;
        const actions = new Set();
        for (let i = 1; i < argsLen; ++i) {
            const mod = req.commandWithArgs.args[i]; //.toLowerCase();
            switch (mod) {
                case "":
                case "capture":
                case "once":
                case "passive":
                    continue;
                case config.preventDefaultModName:
                    evt.preventDefault();
                    continue;
                case config.stopModName:
                    // evt.cancelBubble = true;
                    evt.stopPropagation();
                    continue;
                case config.selfModName:
                    if (evt.target === $src) {
                        continue;
                    }
                    return;
                case "ctrl":
                    if (evt.ctrlKey) {
                        actions.add("ctrl");
                        continue;
                    }
                    return;
                case "alt":
                    if (evt.altKey) {
                        actions.add("alt");
                        continue;
                    }
                    return;
                case "shift":
                    if (evt.shiftKey) {
                        actions.add("shift");
                        continue;
                    }
                    return;
                case "meta":
                    if (evt.metaKey) {
                        actions.add("meat");
                        continue;
                    }
                    return;
                case config.exactModName:
                    for (const i of holdsKeys) {
                        if (actions.has(i)) {
                            continue;
                        }
                        switch (i) {
                            case "ctrl":
                                if (evt.ctrlKey) {
                                    return;
                                }
                                continue;
                            case "alt":
                                if (evt.altKey) {
                                    return;
                                }
                                continue;
                            case "shift":
                                if (evt.shiftKey) {
                                    return;
                                }
                                continue;
                            case "meta":
                                if (evt.metaKey) {
                                    return;
                                }
                        }
                    }
                    continue;
            }
            if (evt.type === "input") {
                const data = evt.data;
                if (data !== null && mod === data.toLowerCase()) {
                    continue;
                }
                return;
            }
            //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
            //https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key
            //https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
            //console.log(mod)
            if (evt.type.indexOf("key") === 0) {
                if (mod === evt.key.toLowerCase()) {
                    continue;
                }
                return;
            }
            if (evt.type.indexOf("mouse") === 0) {
                //} && !isNaN(Number(mod))) {
                if (Number(mod) === evt.button) {
                    continue;
                }
                return;
            }
        }
        // const src = this.my.context.srcBy$src.get($src) as Src;
        // //--scope[config.p_target][config.eventScopeName] = evt;
        // (src.cache as Cache).value.clear();
        //todo {} as Sync !!
        this.myweb.eval2Execute(this.myweb.createReq($src, req.str, req.expr, this.myweb.get$srcScope($src), evt, {}), $src);
    }
}
class ListenerOptions {
    capture;
    once;
    passive;
    constructor() {
        this.capture = false;
        this.once = false;
        this.passive = false;
    }
}
