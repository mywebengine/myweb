import {type_animation} from "../render/render.js";
import {srcBy$src} from "../descr.js";
import {eval2, q_eval2} from "../eval2.js";

export default {
	isCustomHtml: true,
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => setValue(req, req.$src, val));
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						setValue(req, arr[i].$src, vals[i]);
					}
				}
				return null;
			});
	}
};
function setValue(req, $src, val) {
//	descrById.get($src[p_descrId]).isCustomHtml = true;
//	const c = getCacheBySrcId($src[p_srcId]),
	const c = srcBy$src.get($src).cache;
	if (req.sync.p.renderParam.isLinking) {
		c.current.set(req.str, val);
		return null;
	}
	if (val === c.current.get(req.str)) {
		return null;
	}
	if (req.reqCmd.args[0]) {
		req.sync.animation.add(type_animation(() => {
			c.current.set(req.str, $src.textContent = val);
		}, req.local, srcBy$src.get($src).id));
		return null;
	}
	req.sync.animation.add(type_animation(() => {
		c.current.set(req.str, $src.innerHTML = val);
	}, req.local, srcBy$src.get($src).id));
	return null;
}
