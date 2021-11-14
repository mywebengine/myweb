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

//import {mw_cmd, reqCmd} from "./render/render.js";
export const mw_cmd = new Map();//self.mw_cmd || {};
export const reqCmd = self.mw_reqCmd || new Map();

export const mw_doc = document;
export const mw_$src = mw_doc.documentElement;

export const p_target = Symbol();
export const p_topUrl = Symbol();

export const visibleScreenSize = 3;
export const renderPackSize = 100;
export const defIdleCallbackOpt = {
	timeout: 1000
};

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

export const lazyRenderName = "lazyrender";

export const cmdPref = "";
export const cmdArgsDiv = ".";
export const cmdArgsDivLen = cmdArgsDiv.length;
export const descrIdName = "_did" + cmdArgsDiv;
export const asOneIdxName = "_aidx" + cmdArgsDiv;
export const idxName = "_idx" + cmdArgsDiv;
export const isFillingName = "is_filling";
export const isFillingDiv = "-";

export const attrCmdName = cmdPref + "attr";
	export const pushModName = "push";//.toLowerCase();
	export const replaceModName = "replace";//.toLowerCase();

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
	export const preventDefaultModName = "prevent";//.toLowerCase();
	export const stopModName = "stop";//.toLowerCase();
	export const selfModName = "self";//.toLowerCase();
	export const exactModName = "exact";//.toLowerCase();
	export const eventScopeName = "evt";

export const scopeCmdName = cmdPref + "scope";
export const watchCmdName = cmdPref + "watch";

export function addCommand(cmdName, cmd) {
	mw_cmd.set(cmdName, cmd);
}
function begin() {
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
	for (const [str, r] of reqCmd) {
		r.cmd = mw_cmd.get(str.substr(0, str.indexOf(cmdArgsDiv)));
	}
}
if (import.meta.__imports__ === undefined) {
	begin();
} else {
	import.meta.__imports__
		.then(begin);
}
//if (FormData.prototype[p_target] !== null) {
	FormData.prototype[p_target] = null;
	Document.prototype[p_target] = null;
	DocumentFragment.prototype[p_target] = null;
	HTMLElement.prototype[p_target] = null;
	Text.prototype[p_target] = null;
	Promise.prototype[p_target] = null;
//}
//API
self.mw_p_target = p_target;
self.mw_p_topUrl = p_topUrl;
