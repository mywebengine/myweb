import {eval2} from "../../eval2/eval2.js";
import {showLoading} from "../../loading/loading.js";
import {type_cmd} from "../type.js";

export default type_cmd(cmd_render, null, null, null, false, false);

function cmd_render(req) {
	return showLoading(req.$src, () => eval2(req, req.$src, true), req.reqCmd.args[0], req.reqCmd.args[1])
		.then(() => null);
}
/*
export default {
	render(req) {
		return showLoading(req.$src, () => eval2(req, req.$src, true), req.reqCmd.args[0], req.reqCmd.args[1])
			.then(() => null);
	}
};*/
