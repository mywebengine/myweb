import {getCacheBySrcId} from "../cache.js";
import {p_srcId, p_descrId/*, textCmdName*/} from "../config.js";
import {descrById} from "../descr.js";
import {eval2, q_eval2} from "../eval2.js";
import {addAnimation} from "../util.js";

export default {
	async render(req) {
		const f = setValue(req, req.$src, await eval2(req, req.$src, true));
		return f && addAnimation(f, req.sync) || null;
	},
	async q_render(req, arr, isLast) {
		const val = await q_eval2(req, arr, isLast),
			len = arr.length,
			fSet = new Set(),
			scope = req.scope;
		for (let i = 0; i < len; i++) {
			if (!isLast[i]) {
				req.scope = arr[i].scope;
				const f = setValue(req, arr[i].$src, val[i]);
				if (f) {
					fSet.add(f);
				}
			}
		}
//!!! todo подумать: надо ли
		req.scope = scope;
		if (fSet.size) {
			return addAnimation(() => {
				for (const f of fSet) {
					f();
				}
			}, req.sync);
		}
		return null;
	},
	linker(req) {
/*
		descrById.get(req.$src[p_descrId]).isCustomHTML = true;
		const cur = getCurentValue(req, req.$src[p_srcId]);
		cur[0] = eval2(req, req.$src, true);
		return null;*/
	}
};
function setValue(req, $src, val) {
	descrById.get($src[p_descrId]).isCustomHTML = true;
	const c = getCacheBySrcId($src[p_srcId]),
		cur = c.current[req.str];
//console.error("html", $src[p_srcId], $src, val, cur, val === cur);
	if (val === cur) {
		return null;
	}
	c.current[req.str] = val;
	if (req.reqCmd.args[0]) {
		if (req.inFragment) {
			$src.textContent = val;
			return null;
		}
		return () => {
			$src.textContent = val;
		};
	}
	if (req.inFragment) {
		$src.innerHTML = val;
		return null;
	}
	return () => {
		$src.innerHTML = val;
	};
}
