export default class RenderParam {
	constructor(sId, scope, str, isLinking) {
		this.sId = sId;
		this.scope = scope;
		this.str = str;
		this.isLinking = isLinking;
		this.isLazyRender = false;
		this.srcIds = new Set();
		this.$els = null;
	}
};
