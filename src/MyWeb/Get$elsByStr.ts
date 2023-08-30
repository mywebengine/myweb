export class Get$elsByStr {
	expr: string;
	pos: number;

	constructor(/*command, str, */ expr: string, pos: number) {
		//command,
		//str,
		this.expr = expr;
		this.pos = pos;
	}
}
