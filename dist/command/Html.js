import { Task } from "../MyWeb/Task.js";
import { Command } from "./Command.js";
export class Html extends Command {
    isCustomHtml = false;
    render(req) {
        return this.myweb.eval2(req, req.$src, true).then(value => {
            this.renderByValue(req, value, req.$src);
            return null;
        });
    }
    q_render(req, arr, isLast) {
        return this.myweb.q_eval2(req, arr, isLast).then(values => {
            const arrLen = arr.length;
            for (let i = 0; i < arrLen; ++i) {
                if (!isLast.has(i)) {
                    this.renderByValue(req, values[i], arr[i].$src);
                }
            }
            return null;
        });
    }
    renderByValue(req, value, $src) {
        //const c = getCacheBySrcId($src[p_srcId]),
        const cache = this.myweb.context.srcBy$src.get($src).cache;
        //todo --
        if (req.sync.renderParam.isLinking) {
            cache.current.set(req.str, value);
            return;
        }
        //todo -- в таком случаи мы сюда не попадаем
        if (value === cache.current.get(req.str)) {
            return;
        }
        req.sync.animations.add(new Task(() => {
            cache.current.set(req.str, value);
            const m = req.commandWithArgs.args[0];
            if (m !== undefined && m !== "") {
                $src.textContent = value;
                return;
            }
            $src.innerHTML = value;
        }, req.sync.local, this.myweb.context.srcBy$src.get($src).id));
    }
}
