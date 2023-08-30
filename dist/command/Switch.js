import { config } from "../config.js";
import { If } from "./If.js";
export class Switch extends If {
    ifCmdName = config.switchCmdName;
    elseifCmdName = config.caseCmdName;
    elseCmdName = config.defaultCmdName;
    render(req) {
        //console.log("switch", req);
        this.make$first(req);
        let f = true;
        for (const [n, v] of this.myweb.context.srcBy$src.get(req.$src).descr.attr) {
            if (f) {
                if (n === req.str) {
                    f = false;
                }
                continue;
            }
            const rc = this.myweb.context.commandWithArgsByStr.get(n);
            if (rc.commandName !== config.caseCmdName) {
                continue;
            }
            return this.myweb.eval2(req, req.$src, true).then(expression => {
                req.commandWithArgs = rc;
                req.str = n;
                req.expr = v;
                return this.myweb.eval2(req, req.$src, true).then(val => this.renderByVal(req, val, f => f === expression));
                /*
                    .then(async val => {
                        const r = await renderByVal(req, val, f => f === expression);
                        console.log("witch-res", expression, req.str, req.expr, val, r, req);
                        alert(1);
                        return r;
                    });*/
            });
        }
        throw this.myweb.getError(new Error(">>>mw switch:01:Invalid structure: case-command not found"), req.$src, req);
    }
}
