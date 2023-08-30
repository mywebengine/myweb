import { config } from "../config.js";
import { AfterAnimationSyncValue } from "../MyWeb/AfterAnimationSyncValue.js";
import { Task } from "../MyWeb/Task.js";
import { loc } from "../myweb.js";
import { Command } from "./Command.js";
//1) _attr.<name>="<string|bool>"
//2) _attr.<name>.<value>="<bool>"
//3) _attr.href.(push|replace)=... history.(push|replace)State
//4) _attr.href... data-<_*(push|replace)>="<bool>" history.(push|replace)State <- priority
export class Attr extends Command {
    render(req) {
        return this.myweb.eval2(req, req.$src, true).then(value => {
            this.renderByValue(req, value, this.getName(req), req.$src);
            return null;
        });
    }
    q_render(req, arr, isLast) {
        return this.myweb.q_eval2(req, arr, isLast).then(values => {
            const arrLen = arr.length;
            const n = this.getName(req);
            for (let i = 0; i < arrLen; ++i) {
                if (!isLast.has(i)) {
                    this.renderByValue(req, values[i], n, arr[i].$src);
                }
            }
            return null;
        });
    }
    renderByValue(req, v, n, $src) {
        //console.log(1111, req, $src, n, v);
        const toggleVal = req.commandWithArgs.args[1];
        //const c = getCacheBySrcId($src[p_srcId]);
        const src = this.myweb.context.srcBy$src.get($src); //!!
        const cache = src.cache;
        const isInit = cache.isInits.has(req.str);
        if (!isInit) {
            cache.isInits.add(req.str);
            this.setClick(req, $src, n);
        }
        //todo --
        if (req.sync.renderParam.isLinking) {
            cache.current.set(req.str, $src.getAttribute(n) || "");
            return;
        }
        const curVal = cache.current.has(req.str) ? cache.current.get(req.str) : $src.getAttribute(n);
        const afterAnimationSyncValue = cache.afterAnimationSyncValue.get(n);
        const afterAnimationValue = afterAnimationSyncValue !== undefined && afterAnimationSyncValue.syncId === req.sync.syncId
            ? afterAnimationSyncValue.value
            : curVal; //!!
        if (toggleVal && toggleVal !== config.pushModName && toggleVal !== config.replaceModName) {
            if (afterAnimationValue) {
                //console.log(2, req.str, aCurVal, n, v);
                const i = afterAnimationValue.indexOf(toggleVal);
                const l = toggleVal.length;
                if (i !== -1 &&
                    (afterAnimationValue[i - 1] === " " || i === 0) &&
                    (afterAnimationValue[i + l] === " " || i + l === afterAnimationValue.length)) {
                    v = v ? afterAnimationValue : afterAnimationValue.substring(0, i) + afterAnimationValue.substring(i + l + 1);
                }
                else if (v) {
                    v =
                        afterAnimationValue[afterAnimationValue.length - 1] === " "
                            ? afterAnimationValue + toggleVal
                            : afterAnimationValue + " " + toggleVal;
                }
                else {
                    v = afterAnimationValue;
                }
            }
            else if (v) {
                v = toggleVal;
            }
            else {
                //v = false;
                v = afterAnimationValue;
            }
        }
        if (v === true) {
            v = n;
        }
        if (afterAnimationSyncValue !== undefined) {
            afterAnimationSyncValue.syncId = req.sync.syncId;
            afterAnimationSyncValue.value = v;
        }
        else {
            cache.afterAnimationSyncValue.set(n, new AfterAnimationSyncValue(req.sync.syncId, v));
        }
        const isValueNotExists = !(v || v === "");
        if (n === config.lazyRenderName) {
            req.sync.renderParam.isLazyRender = !isValueNotExists;
        }
        if (isInit && curVal === v) {
            src.setAttributeValue(n, v); //!!
            return;
        }
        req.sync.animations.add(new Task(() => {
            cache.current.set(req.str, v); //!!
            if (isValueNotExists) {
                src.removeAttribute(n);
                return;
            }
            src.setAttribute(n, v, $src); //!!
        }, req.sync.local, src.id));
        /*
        if (f) {
//todo <body _attr.class.home="[``].indexOf(loc.name) !== -1" _attr.class.main="[`myloc`, `mysnt`, `services`].indexOf(loc.name) !== -1"
            req.sync.animations.add(new Task(() => {
                c.current.set(req.str, v);
                this.setAttribute($src, n, v);
            }, req.sync.local, this.my.context.srcBy$src.get($src).id));
            return;
        }
//!!be clone => has attribute => not removing
//		if (aCurVal !== null) {
            req.sync.animations.add(new Task(() => {
                c.current.set(req.str, v);
                this.removeAttribute($src, n);
            }, req.sync.local, this.my.context.srcBy$src.get($src).id));
//		}*/
    }
    setClick(req, $src, n) {
        //todo toLowerCase
        if ($src.tagName !== "A" || n.toLowerCase() !== "href" || $src.target) {
            return;
        }
        $src.addEventListener("click", async (evt) => {
            if (!$src.href || evt.ctrlKey || evt.metaKey) {
                return;
            }
            evt.preventDefault();
            //!!придумать		switch (await getVal($src, null, config.pushModName, false) ? config.pushModName : (await getVal($src, null, config.replaceModName, false) ? config.replaceModName : req.commandWithArgs.args[1])) {
            const mode = req.commandWithArgs.args[1];
            if (mode === config.pushModName) {
                history.pushState(undefined, "", $src.href);
            }
            else if (mode === config.replaceModName) {
                history.replaceState(undefined, "", $src.href);
            }
            else {
                location.href = $src.href;
                return;
            }
            if (document.scrollingElement !== null) {
                document.scrollingElement.scrollTop = 0;
            }
            // setLoc(location.href);
            loc.setState(location.href);
        });
    }
    getName(req) {
        const name = req.commandWithArgs.args[0];
        if (name) {
            return name;
        }
        throw this.myweb.getError(new Error(">>>mw attr:render:01: Need set attribute name"), req.$src, req);
    }
}
