class Config {
	p_target = Symbol();
	p_topUrl = Symbol();

	visibleScreenSize = 3;
	renderBatchSize = 100;
	defIdleCallbackOpt = {
		timeout: 1000
	};

	globVarName = "glob";
	locVarName = "loc";
	viewVarName = "view";

//	renderStartEventName = "renderstart";
	mountEventName = "mount";
	renderEventName = "render";
	removeEventName = "remove";

	loadEventName = "load";
	okEventName = "ok";
	errorEventName = "error";
		defEventInit = {
			bubbles: true,
			cancelable: true,
			composed: false
		};

	lazyRenderName  = "lazyrender";

	commandPref = "";
	commandArgsDiv = ".";

	hideName = "_hide";
	isFillingName = "is_filling";
	isFillingDiv = "-";
	constructor() {
		this.commandArgsDivLen = this.commandArgsDiv.length;
		this.descrIdName = "_did" + this.commandArgsDiv;
		this.asOneIdxName = "_aidx" + this.commandArgsDiv;
		this.idxName = "_idx" + this.commandArgsDiv;

		this.attrCmdName = this.commandPref + "attr";
			this.pushModName = "push";//.toLowerCase();
			this.replaceModName = "replace";//.toLowerCase();

		this.execCmdName = this.commandPref + "exec";
		this.fillingCmdName = this.commandPref + "filling";

		this.foreachCmdName = this.commandPref + "foreach";
		this.fetchCmdName = this.commandPref + "fetch";
			this.defRequestInit = {
				headers: {
					"x-requested-with": "XMLHttpRequest"
				}
			};
			this.resultDetailName = "res";
			this.errorDetailName = "err";

		this.htmlCmdName = this.commandPref + "html";
			this.textCmdName = this.htmlCmdName + this.commandArgsDiv + "t";

		this.ifCmdName = this.commandPref + "if";
			this.elseifCmdName = this.commandPref + "elseif";
			this.elseCmdName = this.commandPref + "else";
		this.switchCmdName = this.commandPref + "switch";
			this.caseCmdName = this.commandPref + "case";
			this.defaultCmdName = this.commandPref + "default";

		this.incCmdName = this.commandPref + "inc";

		this.onCmdName = this.commandPref + "on";
			this.preventDefaultModName = "prevent";//.toLowerCase();
			this.stopModName = "stop";//.toLowerCase();
			this.selfModName = "self";//.toLowerCase();
			this.exactModName = "exact";//.toLowerCase();
			this.eventScopeName = "evt";

		this.scopeCmdName = this.commandPref + "scope";
		this.watchCmdName = this.commandPref + "watch";
	}
};
const config = new Config(),
	p_target = config.p_target;
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
export default config;
