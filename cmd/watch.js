import {type_renderRes} from "../render/render.js";
import {p_target} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2, q_eval2} from "../eval2.js";
import {kebabToCamelStyle} from "../util.js";

export default {
	render,
	q_render(req, arr, isLast) {
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
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
						setValue(req, arr[i].scope, vals[i]);
					}
				}
				return null;
			});
	}
};
function render(req) {
	return eval2(req, req.$src, true)
		.then(val => setValue(req, req.scope, val));
}
function setValue(req, scope, val) {
//	const c = getCacheBySrcId(req.$src[p_srcId]),
	const c = srcBy$src.get(req.$src).cache,
		cur = c.current[req.str] || (c.current[req.str] = type_watchCur());
	if (req.sync.p.renderParam.isLinking) {
		c.isInit[req.str] = true;
		cur.watch = val;
		return type_renderRes(true);
	}
	if (c.isInit[req.str]) {
		if (val === cur.watch) {
			return type_renderRes(true);
		}
		req.sync.onready.add(() => {
			cur.watch = val;
		});
	} else {
		req.sync.onready.add(() => {
			c.isInit[req.str] = true;
			cur.watch = val;
		});
	}
	const n = req.reqCmd.args[0];
	if (n) {
		scope[p_target][kebabToCamelStyle(n)] = val;
	}
	return null;
}
function type_watchCur() {
	return {
		watch: undefined
	};
}
