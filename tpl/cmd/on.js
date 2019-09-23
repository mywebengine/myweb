export default {
	render: f,
	linker: f
};
function f(req) {
	const $src = req.$src;
	const expr = req.expr;
//	Reflect.set($src, "on" + req.args[0], () => {
	$src["on" + req.args[0]] = () => {
		return this.eval({
			$src,
			scope: this.getScope($src),
			expr
		}, true);
	}//);
}
