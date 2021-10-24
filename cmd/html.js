import {type_animation} from "../render/render.js";
import {srcBy$src} from "../descr.js";
import {eval2, q_eval2} from "../eval2.js";

export default {
	isCustomHtml: true,
	render(req) {
//console.log(111, req.$src);
		return eval2(req, req.$src, true)
			.then(val => setValue(req, req.$src, val));
	},
	q_render(req, arr, isLast) {
//console.log(222, req.$src, arr);
		const arrLen = arr.length;
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const pArr = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
						pArr[i] = vals[i];
					}
				}
				return Promise.all(pArr);
			})
			.then(vals => {
//				const scope = req.scope;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
///						req.scope = arr[i].scope;
						setValue(req, arr[i].$src, vals[i]);
					}
				}
//!!! todo подумать: надо ли
//				req.scope = scope;
				return null;
			});
	}
};
function setValue(req, $src, val) {
//	descrById.get($src[p_descrId]).isCustomHtml = true;
//	const c = getCacheBySrcId($src[p_srcId]),
	const c = srcBy$src.get($src).cache;
	if (req.sync.p.renderParam.isLinking) {
		c.current[req.str] = val;
		return null;
	}
	if (val === c.current[req.str]) {
		return null;
	}
//console.error("html", $src[p_srcId], $src, val, c.current[req.str], val === c.current[req.str], req);
	if (req.reqCmd.args[0]) {
		req.sync.animation.add(type_animation(() => {
			c.current[req.str] = $src.textContent = val;
		}, req.local, srcBy$src.get($src).id));
		return null;
	}
	req.sync.animation.add(type_animation(() => {
		c.current[req.str] = $src.innerHTML = val;
	}, req.local, srcBy$src.get($src).id));
	return null;
}
