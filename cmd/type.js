export function type_cmd(render, q_render, get$first, get$els, isCustomHtml, isAsOne) {
	return {
		render,
		q_render,
		get$first,
		get$els,
		isCustomHtml,
		isAsOne
	};
}
export function type_reqCmd(cmdName, cmd, args) {
	return {
		cmdName,
		cmd,
		args
	};
}
