import {textCmdName} from "../const.js";

export default {
	render: function(req) {
		const str = this.eval(req);
		if (str !== req.$src.html_oldVal) {
			if (req.str == textCmdName) {
				req.$src.textContent = req.$src.html_oldVal = str;
			} else {
				req.$src.innerHTML = req.$src.html_oldVal = str;
			}
		}
		return html_get.call(this, req, this.renderTag);
	},
	linker(req) {
		req.$src.html_oldVal = this.eval(req);
		return html_get.call(this, req, this.linker);
	}
};
function html_get(req, renderFunc) {
	req.$src.isCustomHTML = true;
	const res = {
		isLast: true
	};
	const attrsAfter = this.getAttrsAfter(this.getAttrs(req.$src), req.str);
	if (attrsAfter.size) {
		res.$e = renderFunc.call(this, req.$src, req.scope, attrsAfter);
	}
	return res;
}
