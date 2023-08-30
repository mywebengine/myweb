export class DelayParam {
	srcId: number;
	resolve: Function;
	reject: Function;

	constructor(srcId: number, resolve: Function, reject: Function) {
		this.srcId = srcId;
		this.resolve = resolve;
		this.reject = reject;
	}
}
