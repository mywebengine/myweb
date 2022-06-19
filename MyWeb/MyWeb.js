import config from "../config/config.js";
import Attr from "./command/attr/Attr.js";
import Exec from "./command/exec/Exec.js";
import Fetch from "./command/fetch/Fetch.js";
import Foreach from "./command/foreach/Foreach.js";
import Html from "./command/html/Html.js";
import If from "./command/if/If.js";
import Switch from "./command/if/Switch.js";
import Inc from "./command/inc/Inc.js";
import On from "./command/on/On.js";
import Scope from "./command/scope/Scope.js";
import Filling from "./command/filling/Filling.js";
import Watch from "./command/watch/Watch.js";
import CommandWithArgs from "./command/CommandWithArgs.js";
import MyWebProxyController from "./proxy/MyWebProxyController.js";
import Context from "./Context.js";

//MyWeb <- (CreateDom <- RemoveChild <- ShowHide) <- Eval2 <- Loading <- (RenderTag <- QRenderTag <- Render) <- Api
export default class MyWeb {
	commands = new Map();
	context = new Context();
	constructor() {
		this.proxyController = new MyWebProxyController(this, config.p_target);
		this.addAllCommands();
	}
	reset(context = new Context()) {
		this.context = context;
		this.proxyController.reset();
		for (const i of this.commands.values()) {
			i.reset();
		}
	}
	getReact(val) {
		return this.proxyController.createProxy(val);
	}
	//private
	addAllCommands() {
		this.addCommand(config.attrCmdName, Attr);
		this.addCommand(config.execCmdName, Exec);
		this.addCommand(config.fetchCmdName, Fetch);
		this.addCommand(config.foreachCmdName, Foreach);
		this.addCommand(config.htmlCmdName, Html);

		this.addCommand(config.ifCmdName, If);
		this.addCommand(config.elseifCmdName, If);
		this.addCommand(config.elseCmdName, If);

		this.addCommand(config.switchCmdName, Switch);
		this.addCommand(config.caseCmdName, Switch);
		this.addCommand(config.defaultCmdName, Switch);

		this.addCommand(config.incCmdName, Inc);
		this.addCommand(config.onCmdName, On);
		this.addCommand(config.scopeCmdName, Scope);
		this.addCommand(config.fillingCmdName, Filling);
		this.addCommand(config.watchCmdName, Watch);
	}
	addCommand(commandName, command) {
		this.commands.set(commandName, new command(this));
	}
	addStrToCommandWithArgsIfThatCommend(str) {
		const already = this.context.commandWithArgsByStr.get(str);
//		if (already) {
		if (already !== undefined && already !== null) {
			return true;
		}
		const i = str.indexOf(config.commandArgsDiv),
			commandName = i === -1 ? str : str.substr(0, i),
			command = this.commands.get(commandName);
		if (command === undefined) {
			this.context.commandWithArgsByStr.set(str, null);
			return false;
		}
		this.context.commandWithArgsByStr.set(str, new CommandWithArgs(commandName, command, i !== -1 ? str.substr(i + config.commandArgsDivLen).split(config.commandArgsDiv) : []));
		return true;
	}
	getNewId() {
		return ++this.context.currentIdValue;
	}
	getSrcId(local, sId) {
		if (this.context.srcById.has(sId)) {
			return sId;
		}
		for (let l = local.get(sId); l !== undefined && l.newSrcId !== 0; l = local.get(sId)) {
			sId = l.newSrcId;
		}
		return sId;
	}
	getError(err, $src, req, scope, fileName, lineNum, colNum) {
        	let errMsg = ">>>mw error";
	        if (my.getLineNo !== undefined) {
        		const pos = my.getLineNo($src);// || my.getLineNo($src.parentNode);//todo зачем смотреть родителя?
	        	if (pos) {
	        		errMsg += ` in ${pos}`;
	        	}
        	}
		errMsg += "\n" + err.toString();
		const params = [];
		params.push("\n$src =>", $src, "\nsId =>", this.context.srcBy$src.get($src)?.id);
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
		return fileName ? new Error(err, fileName, lineNum, colNum) : err;
	}
};
