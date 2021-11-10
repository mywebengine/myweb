import {eval2} from "../eval2.js";
import {showLoading} from "../loading.js";

export default {
	render(req) {
		return showLoading(req.$src, () => eval2(req, req.$src, true), req.reqCmd.args[0], req.reqCmd.args[1])
			.then(() => null);
	}
};
