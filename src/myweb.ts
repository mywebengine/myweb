/*!
 * myweb 0.9.2
 * (c) 2019-2023 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */

import "./addons.js";
import {config} from "./config.js";

import {Attr} from "./command/Attr.js";
import {Exec} from "./command/Exec.js";
// import {__Fetch} from "./command/__Fetch.js";
import {Foreach} from "./command/Foreach.js";
import {Html} from "./command/Html.js";
import {If} from "./command/If.js";
import {Switch} from "./command/Switch.js";
// import {Import} from "./command/Import.js";
import {On} from "./command/On.js";
//import {Scope} from "../command/scope/Scope.js";
//import {__Filling} from "./command/filling/__Filling.js";
//import {__Watch} from "./command/watch/__Watch.js";
// import {getUrl} from "./lib/getUrl.js";
import {Render} from "./MyWeb/Render.js";
import {LocParams} from "./LocParams.js";
import {ViewParams} from "./ViewParams.js";
import {IMyWeb} from "./MyWeb/IMyWeb.js";

export const myweb = new Render();
export const loc = myweb.getReact(new LocParams(location.href));
export const view = myweb.getReact(new ViewParams(document.scrollingElement));

export const my: {
	myweb: IMyWeb;
	// [config.locVarName]: LocParams,
	// [config.viewVarName]: ViewParams,
	loc: LocParams;
	view: ViewParams;
	createLineNo?(url: string, html: string, $src: Node): void;
	getLineNo?($e: HTMLElement): string | null;
	debugLevel: number;
} = {
	myweb,
	loc,
	view,
	// [config.locVarName]: loc,
	// [config.viewVarName]: view,
	debugLevel: 0,
};

// @ts-ignore
self.my = my;
// @ts-ignore
self.myweb = myweb;
// @ts-ignore
self[config.locVarName] = loc;
// @ts-ignore
self[config.viewVarName] = view;

// //todo --
// my.context = myweb.context;
//
// my.getReact = myweb.getReact.bind(myweb);
// my.render = myweb.render.bind(myweb);
// my.getCurRender = myweb.getCurRender.bind(myweb);
// my.setDelay = myweb.setDelay.bind(myweb);
// // my.cancelSync = myweb.cancelSync.bind(myweb);
//
// my.prepare$src = myweb.prepare$src.bind(myweb);
// my.removeChild = myweb.removeChild.bind(myweb);

//todo close
//my.loadingCount = myweb.context.loadingCount;
//my.showLoading = myweb.showLoading.bind(myweb);
// my.getUrl = getUrl;
// my.setLoc = setLoc;

//my.importCache = myweb.commands.get(config.importCmdName).importCache;

myweb.addCommand(config.attrCmdName, Attr);
myweb.addCommand(config.execCmdName, Exec);
// myweb.addCommand(config.fetchCmdName, __Fetch);
myweb.addCommand(config.foreachCmdName, Foreach);
myweb.addCommand(config.htmlCmdName, Html);

myweb.addCommand(config.ifCmdName, If);
myweb.addCommand(config.elseifCmdName, If);
myweb.addCommand(config.elseCmdName, If);

myweb.addCommand(config.switchCmdName, Switch);
myweb.addCommand(config.caseCmdName, Switch);
myweb.addCommand(config.defaultCmdName, Switch);

// myweb.addCommand(config.importCmdName, Import);
myweb.addCommand(config.onCmdName, On);
//myweb.addCommand(config.scopeCmdName, Scope);
//myweb.addCommand(config.fillingCmdName, __Filling);
//myweb.addCommand(config.watchCmdName, __Watch);
