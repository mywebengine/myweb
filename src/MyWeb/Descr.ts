import {Get$elsByStr} from "./Get$elsByStr.js";

export class Descr {
	id: number;
	srcId: number;
	attr: Map<string, string> | null;
	varIds: Set<number> | null;
	srcIds: Set<number>;

	isHasScope = false;
	isCustomHtml = false;
	asOnes: Set<string> | null = null;
	get$elsByStr: Map<string, Get$elsByStr> | null = null;

	constructor(id: number, srcId: number, attr: Map<string, string> | null, varIds: Set<number> | null) {
		this.id = id;
		this.srcId = srcId;
		this.attr = attr;
		this.varIds = varIds;
		this.srcIds = new Set([srcId]);
	}
}
