import { kebabToCamelCase } from "../lib/kebabToCamelCase.js";
import { config } from "../config.js";
import { Command } from "./Command.js";
export class Exec extends Command {
    isHasScope = true;
    render(req) {
        return this.myweb.eval2(req, req.$src, true).then(value => {
            const name = kebabToCamelCase(req.commandWithArgs.args[0]);
            if (name !== "") {
                req.scope[config.p_target][name] = value;
            }
            return null;
        });
    }
    q_render(req, arr, isLast) {
        return this.myweb.q_eval2(req, arr, isLast).then(values => {
            const name = kebabToCamelCase(req.commandWithArgs.args[0]);
            if (name !== "") {
                const arrLen = arr.length;
                for (let i = 0; i < arrLen; ++i) {
                    if (!isLast.has(i)) {
                        arr[i].scope[config.p_target][name] = values[i];
                    }
                }
            }
            return null;
        });
    }
}
