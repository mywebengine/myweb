/*
import {addCommand} from "../cmd/cmd.js";
import attrCmd from "../cmd/attr/attr.js";
import execCmd from "../cmd/exec/exec.js";
import fetchCmd from "../cmd/fetch/fetch.js";
import foreachCmd from "../cmd/foreach/foreach.js";
import htmlCmd from "../cmd/html/html.js";
import {ifCmd, switchCmd} from "../cmd/if/if.js";
import incCmd from "../cmd/inc/inc.js";
import onCmd from "../cmd/on/on.js";
import scopeCmd from "../cmd/scope/scope.js";
import fillingCmd from "./cmd/filling/filling.js";
import watchCmd from "./cmd/watch/watch.js";*/
/*
//!!instance
export const mw_doc = document;
export const mw_$src = mw_doc.documentElement;

export const mw_cmd = new Map();//self.mw_cmd || {};
export const reqCmd = my.reqCmd || new Map();*/

export default const Config = {
	p_target: Symbol(),
	p_topUrl: Symbol(),

	visibleScreenSize: 3,
	renderBatchSize: 100,
	defIdleCallbackOpt: {
		timeout: 1000
	},

	globVarName: "glob",
	locVarName: "loc",
	viewVarName: "view",

//	renderStartEventName: "renderstart",
	mountEventName: "mount",
	renderEventName: "render",
	removeEventName: "remove",

	loadEventName: "load",
	okEventName: "ok",
	errorEventName: "error",
		defEventInit: {
			bubbles: true,
			cancelable: true,
			composed: false
		},

	lazyRenderName: "lazyrender";

	cmdPref: "",
	cmdArgsDiv: ".",
	cmdArgsDivLen: cmdArgsDiv.length,
	descrIdName: "_did" + cmdArgsDiv,
	hideName: "_hide",
	asOneIdxName: "_aidx" + cmdArgsDiv,
	idxName: "_idx" + cmdArgsDiv,
	isFillingName: "is_filling",
	isFillingDiv: "-",

	attrCmdName: cmdPref + "attr",
		pushModName: "push",//.toLowerCase();
		replaceModName: "replace",//.toLowerCase();

	execCmdName: cmdPref + "exec",
	fillingCmdName: cmdPref + "filling",

	foreachCmdName: cmdPref + "foreach",
	fetchCmdName: cmdPref + "fetch",
		defRequestInit: {
			headers: {
				"x-requested-with": "XMLHttpRequest"
			}
		},
		resultDetailName: "res",
		errorDetailName: "err",

	htmlCmdName: cmdPref + "html",
		textCmdName: htmlCmdName + cmdArgsDiv + "t",

	ifCmdName: cmdPref + "if",
		elseifCmdName: cmdPref + "elseif",
		elseCmdName: cmdPref + "else",
	switchCmdName: cmdPref + "switch",
		caseCmdName: cmdPref + "case",
		defaultCmdName: cmdPref + "default",

	incCmdName: cmdPref + "inc",

	onCmdName: cmdPref + "on",
		preventDefaultModName: "prevent",//.toLowerCase(),
		stopModName: "stop",//.toLowerCase(),
		selfModName: "self",//.toLowerCase(),
		exactModName: "exact",//.toLowerCase(),
		eventScopeName: "evt",

	scopeCmdName: cmdPref + "scope",
	watchCmdName: cmdPref + "watch"
};
//if (FormData.prototype[p_target] !== null) {
	FormData.prototype[p_target] = null;
	Document.prototype[p_target] = null;
	DocumentFragment.prototype[p_target] = null;
	HTMLElement.prototype[p_target] = null;
	Text.prototype[p_target] = null;
	Promise.prototype[p_target] = null;
	Date.prototype[p_target] = null;
	Request.prototype[p_target] = null;
	Response.prototype[p_target] = null;
//}
