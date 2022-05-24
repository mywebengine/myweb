export default class Descr {
	constructor(id, sId, attr, varIds) {
		this.id = id;
		this.sId = sId;
		this.attr = attr;
		this.varIds = varIds;
		this.srcIds = new Set([sId]);
		this.isCustomHtml = false;
		this.asOnes = null;
		this.get$elsByStr = null;
	}
};
