import attrCmd from "./cmd/attr.js";
import execCmd from "./cmd/exec.js";
import fetchCmd from "./cmd/fetch.js";
import forCmd from "./cmd/for.js";
import htmlCmd from "./cmd/html.js";
import {ifCmd, switchCmd} from "./cmd/if.js";
import incCmd from "./cmd/inc.js";
import onCmd from "./cmd/on.js";
import scopeCmd from "./cmd/scope.js";

export const Tpl_doc = document;
export const Tpl_$src = Tpl_doc.documentElement;

export const srcId = Symbol();
export const descrId = Symbol();
export const isCmd = Symbol();
export const _target = Symbol();

export let Tpl_delay = 0;
export function setDelay(t, cb) {
	if (!cb) {
		Tpl_delay = t;
		return;
	}
	const old = Tpl_delay;
	Tpl_delay = t;
	cb();
	Tpl_delay = old;
}

self.srcId = srcId;
self.descrId = descrId;
self.isCmd = isCmd;
self._target = _target;
self.setDelay = setDelay;

//to perfomance tests
export const isAsyncTask = true;
export const isAsyncAnimation = !true;//isAsyncTask;
export const defTaskOpt = {
	timeout: 10
};

export const dataVarName = "data";
export const cmdVarName = "cmd";

export const cmdPref = "_";
export const cmdArgsBegin = ".";
export const cmdArgsDiv = ".";
export const orderName = cmdPref + "order";
export const idxName = cmdPref + "idx";
export const saveName = cmdPref + "save";
export const localIdName = cmdPref + "lid";

export const startEventName = "start";
export const renderEventName = "render";
export const onRenderName = "on" + renderEventName;

export const attrCmdName = cmdPref + "attr";
	export const pushModName = "push";
	export const replaceModName = "replace";

export const execCmdName = cmdPref + "exec";

export const forCmdName = cmdPref + "for";
export const fetchCmdName = cmdPref + "fetch";
	export const defFetchReq = {
		headers: {
			"x-requested-with": "XMLHttpRequest"
		}
	};
	export const watchName = "watch";
	export const ifWatchName = "ifwatch";
	export const paramName = "param";
	export const ifParamName = "ifparam";

export const htmlCmdName = cmdPref + "html";
	export const textCmdName = htmlCmdName + cmdArgsBegin + "t";

export const ifCmdName = cmdPref + "if";
export const elseifCmdName = cmdPref + "elseif";
export const elseCmdName = cmdPref + "else";
	export const switchCmdName = cmdPref + "switch";
	export const caseCmdName = cmdPref + "case";
	export const defaultCmdName = cmdPref + "default";

export const incCmdName = cmdPref + "inc";

export const onCmdName = cmdPref + "on";
	export const preventDefaultModName = "prevent";

export const scopeCmdName = cmdPref + "scope";

export const Tpl_cmd = {};
export function addCommand(cmdName, cmd) {
	Tpl_cmd[cmdName] = cmd;
}

addCommand(attrCmdName, attrCmd);
addCommand(fetchCmdName, fetchCmd);
addCommand(forCmdName, forCmd);
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
addCommand(execCmdName, execCmd);

//if (!FormData.prototype[_target]) {
	FormData.prototype[_target] = null;
	Document.prototype[_target] = null;
	DocumentFragment.prototype[_target] = null;
	HTMLElement.prototype[_target] = null;
	Text.prototype[_target] = null;
	Promise.prototype[_target] = null;
//}
