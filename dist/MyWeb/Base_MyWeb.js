import { config } from "../config.js";
import { my } from "../myweb.js";
import { Context } from "./Context.js";
import { CommandWithArgs } from "./CommandWithArgs.js";
import { MyWebProxyController } from "./MyWebProxyController.js";
//Base_MyWeb <- (CreateDom <- RemoveChild <- ShowHide) <- Eval2 <- Loading <- (RenderLoop <- RenderTag <- Q_renderTag <- Render) <- this
export class Base_MyWeb {
    context = new Context();
    //todo rename to command
    commands = new Map();
    //todo
    customElementByKey = new Map();
    proxyController;
    constructor() {
        this.proxyController = new MyWebProxyController(this, config.p_target);
    }
    //Base_MyWeb - this
    reset(context = new Context()) {
        //нужен для ssr
        this.context = context;
        this.proxyController.reset();
        this.customElementByKey.clear();
        this.proxyController = new MyWebProxyController(this, config.p_target);
        for (const i of this.commands.values()) {
            i.reset();
        }
    }
    getReact(value) {
        return this.proxyController.createProxy(value);
    }
    getScopeReact(value) {
        return this.proxyController.createScopeProxy(value);
    }
    addCommand(name, command) {
        this.commands.set(name, new command(this));
    }
    addStrToCommandWithArgsIfThatCommend(str) {
        const already = this.context.commandWithArgsByStr.get(str);
        if (already === null) {
            return false;
        }
        if (already !== undefined) {
            return true;
        }
        const i = str.indexOf(config.commandArgsDiv);
        const commandName = i === -1 ? str : str.substring(0, i);
        const command = this.commands.get(commandName);
        if (command === undefined) {
            this.context.commandWithArgsByStr.set(str, null);
            return false;
        }
        this.context.commandWithArgsByStr.set(str, new CommandWithArgs(commandName, command, i !== -1 ? str.substring(i + config.commandArgsDivLen).split(config.commandArgsDiv) : []));
        return true;
    }
    getNewId() {
        return ++this.context.currentIdValue;
    }
    //todo rename local
    getSrcId(local, srcId) {
        if (this.context.srcById.has(srcId)) {
            return srcId;
        }
        for (let l = local.get(srcId); l !== undefined && l.newSrcId !== 0; l = local.get(srcId)) {
            srcId = l.newSrcId;
        }
        return srcId;
    }
    getError(err, $src, req, scope, fileName, lineNum, colNum) {
        let errMsg = ">>>mw error";
        if (my.getLineNo !== undefined) {
            const pos = my.getLineNo($src); // || my.getLineNo($src.parentNode);//todo зачем смотреть родителя?
            if (pos) {
                errMsg += ` in ${pos}`;
            }
        }
        errMsg += "\n" + err.toString();
        const params = [];
        params.push("\n$src =>", $src, "\nsrcId =>", this.context.srcBy$src.get($src)?.id);
        if (req) {
            params.push("\nreq =>", req);
            params.push("\n" + req.str + " =>", req.expr);
        }
        if (scope) {
            params.push("\nscope =>", scope);
        }
        if (my.debugLevel !== 0) {
            console.info(errMsg, ...params);
        }
        //todo
        // return fileName ? new Error(err, fileName, lineNum, colNum) : err;
        return err;
    }
}
