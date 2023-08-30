import { config } from "../config.js";
import { Eval2 } from "./Eval2.js";
export class Loading extends Eval2 {
    async showLoading($e, testFunc, type = "", waitTime) {
        //--req.sync.animations.add(new Task(async () => {
        const src = this.context.srcBy$src.get($e); //!!
        const l = this.context.loadingCount.get(src.id);
        if (await testFunc()) {
            if (l !== undefined) {
                this.decLoading(type, l);
            }
            else {
                this.toggleLoading($e, type, false, l);
            }
            return;
        }
        const ll = l === undefined ? this.createLoading(src.id) : l;
        this.toggleLoading($e, "", true, ll);
        if (type === "") {
            return;
        }
        //--if (waitTime === undefined || waitTime === "") {
        //	waitTime = -1;
        //}
        //todo
        if (waitTime === undefined || waitTime === "" || Number(waitTime) < 0) {
            this.toggleLoading($e, type, true, ll);
            return;
        }
        setTimeout(() => {
            //не делать этого - не вижу оснований
            //				if (src.is$hide()) {//!!так как может быть запущен через таймер - многое могло случиться
            //console.warn(43243242);
            //alert(1);
            //					return;
            //				}
            testFunc().then((f) => {
                if (!f) {
                    this.toggleLoading($e, type, true, ll);
                }
            });
            //				if (!await testFunc()) {// && this.context.loadingCount.has(src.id)) {
            //					this.toggleLoading($e, type, true, ll);
            //				}
        }, Number(waitTime));
        //}, req.sync.local, 0));
    }
    createLoading(srcId) {
        const n = new Map([["", 0]]);
        this.context.loadingCount.set(srcId, n);
        return n;
    }
    // private decLoading($e: HTMLElement, type: string, l: Map<string, number>) {
    decLoading(type, l) {
        if (type !== "") {
            const count = l.get(type) - 1; //!!
            l.set(type, count);
            //todo не понятно зачем я это убрал
            //if (count <= 0) {
            //	this.toggleLoading($e, type, false, l);
            //}
        }
        const count = l.get("") - 1; //!!
        l.set("", count);
        if (count > 0) {
            return;
        }
        for (const [iId, iL] of this.context.loadingCount) {
            if (iL !== l) {
                continue;
            }
            this.context.loadingCount.delete(iId);
            const $i = this.context.$srcById.get(iId);
            if ($i === undefined) {
                continue;
            }
            for (const type of l.keys()) {
                this.toggleLoading($i, type, false, l);
            }
            /*
                        for (const [type, count] of l) {
                            if (count > 0) {
                                continue;
                            }
                            this.toggleLoading($e, type, false, l);
                            if (type === "") {
                                this.context.loadingCount.delete(srcId);
                            }
                        }*/
        }
    }
    toggleLoading($e, type, f, l) {
        const lName = type === "" ? config.isFillingName : config.isFillingName + config.isFillingDiv + type;
        const isHide = this.context.srcBy$src.get($e).isHide;
        if (!f) {
            $e.removeAttribute(lName);
            //			if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
            if (isHide) {
                $e.content.firstChild.removeAttribute(lName);
            }
            return;
        }
        //todo
        if (l === undefined) {
            throw new Error("l === undefined");
        }
        if (type === "") {
            const c = l.get("");
            l.set("", c + 1); //!!
        }
        else {
            const c = l.get(type);
            if (c === undefined) {
                l.set(type, 1);
            }
            else {
                l.set(type, c + 1);
            }
        }
        $e.setAttribute(lName, "");
        //if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
        if (isHide) {
            $e.content.firstChild.setAttribute(lName, "");
        }
    }
}
