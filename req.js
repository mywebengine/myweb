import {cmdArgsBegin, cmdArgsDiv, Tpl_cmd} from "./config.js";

export const reqCmd = {};

export function type_req($src, str, expr, scope, sync, inFragment) {
	return {
		reqCmd: reqCmd[str],// || null,//<- in createAttr
		$src,
		str,
		expr,
		scope,
		sync,
		inFragment
	};
}
export function getReqCmd(str) {
	const already = reqCmd[str];
	if (already !== undefined) {
		return already;
	}
	const i = str.indexOf(cmdArgsBegin),
		cmdName = i === -1 && str || str.substr(0, i),
		cmd = Tpl_cmd[cmdName];
	if (!cmd) {
		return reqCmd[str] = null;
	}
	return reqCmd[str] = type_reqCmd(cmdName, cmd, i === -1 && [] || str.substr(i + 1).split(cmdArgsDiv));
}
function type_reqCmd(cmdName, cmd, args) {
	return {
		cmdName,
		cmd,
		args
	};
}
