import {cmdArgsBegin, cmdArgsDiv, Tpl_cmd} from "./config.js";

export const Tpl_reqCmd = {};

export function type_req($src, str, expr, scope, sync, local) {
	return {
		reqCmd: Tpl_reqCmd[str],// || null,//<- in createAttr
		$src,
		str,
		expr,
		scope,
		sync,
		local
	};
}
export function getReqCmd(str) {
	const already = Tpl_reqCmd[str];
	if (already !== undefined) {
		return already;
	}
	const i = str.indexOf(cmdArgsBegin),
		cmdName = i === -1 && str || str.substr(0, i),
		cmd = Tpl_cmd[cmdName];
	if (!cmd) {
		return Tpl_reqCmd[str] = null;
	}
	return Tpl_reqCmd[str] = type_reqCmd(cmdName, cmd, i === -1 && [] || str.substr(i + 1).split(cmdArgsDiv));
}
function type_reqCmd(cmdName, cmd, args) {
	return {
		cmdName,
		cmd,
		args
	};
}
