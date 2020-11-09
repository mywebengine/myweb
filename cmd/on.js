import {cache, type_cacheValue} from "../cache.js";
import {srcId, preventDefaultModName} from "../config.js";
import {eval2} from "../eval2.js";
import {type_req} from "../req.js";
import {getScope} from "../scope.js";

export default {
	render,
	q_render(req, arr, isLast) {
		const len = arr.length;
		for (let i = 0; i < len; i++) {
			if (!isLast[i]) {
				render(req, arr[i].$src);
			}
		}
		return null;
	},
	linker: render
};
function render(req, $src = req.$src) {
	const n = req.reqCmd.args[0];
	if (!n) {
		throw check(new Error(">>>Tpl on:render:01: Need set action name"), req);
	}
	const sId = $src[srcId],
		c = cache[sId];
	if (c.isInit[req.str]) {
		return null;
	}
	c.isInit[req.str] = true;
	$src.addEventListener(n, async (evt) => {
		if (req.reqCmd.args[1] === preventDefaultModName) {
			evt.preventDefault();
		}
		cache[sId].value = type_cacheValue();
		eval2(type_req($src, req.str, req.expr, await getScope($src, req.str), null, false), $src, false);
	});
}
