export class PrepareMerge {
	len: number;
	descrId: Set<number> = new Set();
	firstAsOneIdx?: number;

	constructor(len: number, firstAsOneIdx?: number) {
		this.len = len;
		this.firstAsOneIdx = firstAsOneIdx;
		//this.asOneIdx = new Set()
	}
}
