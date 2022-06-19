export default class Command {
	my  = null;
	isCustomHtml = false;
	isAsOne = false;
	constructor(my) {
		this.my = my;
	}
	render(req) {
		throw new Error("Not implemented");
	}
	q_render() {
	}
	get$first($first, str, expr, pos) {
		throw new Error("Not implemented");
	}
	get$els($src, str, expr, pos) {
		throw new Error("Not implemented");
	}
	reset() {
	}
};
