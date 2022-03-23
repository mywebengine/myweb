import {cmdArgsDivLen, cmdArgsDiv} from "../config/config.js";
import {type_reqCmd} from "./type.js";

export function addCommand(cmdName, cmd) {
	my.env.cmd.set(cmdName, cmd);
}
export function setReqCmd(str) {
	const already = my.env.reqCmd.get(str);
//	if (already) {
	if (already !== undefined && already !== null) {
		return true;
	}
	const i = str.indexOf(cmdArgsDiv),
		cmdName = i === -1 ? str : str.substr(0, i),
		cmd = my.env.cmd.get(cmdName);
	if (cmd === undefined) {
		my.env.reqCmd.set(str, null);
		return false;
	}
	my.env.reqCmd.set(str, type_reqCmd(cmdName, cmd, i !== -1 ? str.substr(i + cmdArgsDivLen).split(cmdArgsDiv) : []));
	return true;
}
