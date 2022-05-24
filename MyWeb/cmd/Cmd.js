import Config from "../../config/Config.js";
import MyWeb from "../MyWeb.js";
import ReqCmd from "./ReqCmd.js";

import attrCmd from "./attr/attr.js";
import execCmd from "./exec/exec.js";
import fetchCmd from "./fetch/fetch.js";
import foreachCmd from "./foreach/foreach.js";
import htmlCmd from "./html/html.js";
import {ifCmd, switchCmd} from "./if/if.js";
import incCmd from "./inc/inc.js";
import onCmd from "./on/on.js";
import scopeCmd from "./scope/scope.js";
import fillingCmd from "./filling/filling.js";
import watchCmd from "./watch/watch.js";

export default class Cmd extends MyWeb {
	initCommands() {
		this.addCommand(Config.attrCmdName, attrCmd);
		this.addCommand(Config.execCmdName, execCmd);
		this.addCommand(Config.fetchCmdName, fetchCmd);
		this.addCommand(Config.foreachCmdName, foreachCmd);
		this.addCommand(Config.htmlCmdName, htmlCmd);

		this.addCommand(Config.ifCmdName, ifCmd);
		this.addCommand(Config.elseifCmdName, ifCmd);
		this.addCommand(Config.elseCmdName, ifCmd);

		this.addCommand(Config.switchCmdName, switchCmd);
		this.addCommand(Config.caseCmdName, switchCmd);
		this.addCommand(Config.defaultCmdName, switchCmd);

		this.addCommand(Config.incCmdName, incCmd);
		this.addCommand(Config.onCmdName, onCmd);
		this.addCommand(Config.scopeCmdName, scopeCmd);
		this.addCommand(Config.fillingCmdName, fillingCmd);
		this.addCommand(Config.watchCmdName, watchCmd);
	}
	addCommand(cmdName, cmd) {
		this.cmd.set(cmdName, new cmd());
	}
	setReqCmd(str) {
		const already = this.ctx.reqCmd.get(str);
//		if (already) {
		if (already !== undefined && already !== null) {
			return true;
		}
		const i = str.indexOf(Config.cmdArgsDiv),
			cmdName = i === -1 ? str : str.substr(0, i),
			cmd = this.cmd.get(cmdName);
		if (cmd === undefined) {
			this.ctx.reqCmd.set(str, null);
			return false;
		}
		this.ctx.reqCmd.set(str, new ReqCmd(cmdName, cmd, i !== -1 ? str.substr(i + Config.cmdArgsDivLen).split(Config.cmdArgsDiv) : []));
		return true;
	}
};
