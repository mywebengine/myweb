import attrCmd from "./cmd/attr.js";
import execCmd from "./cmd/exec.js";
import fetchCmd from "./cmd/fetch.js";
import foreachCmd from "./cmd/foreach.js";
import htmlCmd from "./cmd/html.js";
import {ifCmd, switchCmd} from "./cmd/if.js";
import incCmd from "./cmd/inc.js";
import onCmd from "./cmd/on.js";
import scopeCmd from "./cmd/scope.js";
import fillingCmd from "./cmd/filling.js";
import watchCmd from "./cmd/watch.js";

//import {Tpl_cmd, reqCmd} from "./render/render.js";
export const Tpl_cmd = {};//self.Tpl_cmd || {};
export const reqCmd = self.Tpl_reqCmd || {};

export const Tpl_doc = document;
export const Tpl_$src = Tpl_doc.documentElement;

export const p_target = Symbol();
export const p_topUrl = Symbol();

self.p_target = p_target;
self.p_topUrl = p_topUrl;

export const defTaskOpt = {
	timeout: 160
};
export const visibleScreenSize = 1;
export const qPackLength = 100;

export const globVarName = "glob";
export const locVarName = "loc";

//export const renderStartEventName = "renderstart";
export const mountEventName = "mount";
export const renderEventName = "render";
export const removeEventName = "remove";

export const loadEventName = "load";
export const okEventName = "ok";
export const errorEventName = "error";
	export const defEventInit = {
		bubbles: true,
		cancelable: true,
		composed: false
	};

//dataset attributes
export const isWhenVisibleName = "whenvisible";

export const cmdPref = "";
export const cmdArgsDiv = ".";
export const cmdArgsDivLen = cmdArgsDiv.length;
export const descrIdName = "_did" + cmdArgsDiv;
export const asOneIdxName = "_aidx" + cmdArgsDiv;
export const idxName = "_idx" + cmdArgsDiv;
export const isFillingName = "is_filling";
export const isFillingDiv = "-";

export const attrCmdName = cmdPref + "attr";
	export const pushModName = "push";
	export const replaceModName = "replace";

export const execCmdName = cmdPref + "exec";
export const fillingCmdName = cmdPref + "filling";

export const foreachCmdName = cmdPref + "foreach";
export const fetchCmdName = cmdPref + "fetch";
	export const defRequestInit = {
		headers: {
			"x-requested-with": "XMLHttpRequest"
		}
	};
	export const resultDetailName = "res";
	export const errorDetailName = "err";

export const htmlCmdName = cmdPref + "html";
	export const textCmdName = htmlCmdName + cmdArgsDiv + "t";

export const ifCmdName = cmdPref + "if";
export const elseifCmdName = cmdPref + "elseif";
export const elseCmdName = cmdPref + "else";
	export const switchCmdName = cmdPref + "switch";
	export const caseCmdName = cmdPref + "case";
	export const defaultCmdName = cmdPref + "default";

export const incCmdName = cmdPref + "inc";

export const onCmdName = cmdPref + "on";
	export const preventDefaultModName = "prevent";
	export const stopModName = "stop";
	export const selfModName = "self";
	export const eventScopeName = "evt";

export const scopeCmdName = cmdPref + "scope";
export const watchCmdName = cmdPref + "watch";

export function addCommand(cmdName, cmd) {
	Tpl_cmd[cmdName] = cmd;
}

addCommand(attrCmdName, attrCmd);
addCommand(execCmdName, execCmd);
addCommand(fetchCmdName, fetchCmd);
addCommand(foreachCmdName, foreachCmd);
addCommand(htmlCmdName, htmlCmd);

addCommand(ifCmdName, ifCmd);
addCommand(elseifCmdName, ifCmd);
addCommand(elseCmdName, ifCmd);

addCommand(switchCmdName, switchCmd);
addCommand(caseCmdName, switchCmd);
addCommand(defaultCmdName, switchCmd);

addCommand(incCmdName, incCmd);
addCommand(onCmdName, onCmd);
addCommand(scopeCmdName, scopeCmd);
addCommand(fillingCmdName, fillingCmd);
addCommand(watchCmdName, watchCmd);
//ssr
for (const str in reqCmd) {
	reqCmd[str].cmd = Tpl_cmd[str.substr(0, str.indexOf(cmdArgsDiv))];
}
//if (FormData.prototype[p_target] !== null) {
	FormData.prototype[p_target] = null;
	Document.prototype[p_target] = null;
	DocumentFragment.prototype[p_target] = null;
	HTMLElement.prototype[p_target] = null;
	Text.prototype[p_target] = null;
	Promise.prototype[p_target] = null;
//}
