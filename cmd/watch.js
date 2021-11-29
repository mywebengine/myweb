import {type_renderRes} from "../render/render.js";
import {p_target} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2, q_eval2} from "../eval2.js";
import {getProxy} from "../proxy.js";
import {kebabToCamelCase} from "../str.js";

export default {
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => watch_render(req, req.scope, getName(req), val));
	},
	q_render(req, arr, isLast) {
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const n = getName(req),
					arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = watch_render(req, arr[i].scope, n, vals[i]);
					}
				}
				return res;
			});
	}
};
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		return kebabToCamelCase(n);
	}
}
function watch_render(req, scope, n, val) {
//	const c = getCacheBySrcId(req.$src[p_srcId]),
	const c = srcBy$src.get(req.$src).cache;
	if (!c.current.has(req.str)) {
		c.current.set(req.str, type_watchCur());
	}
	const cur = c.current.get(req.str);
	if (req.sync.renderParam.isLinking) {
		c.isInits.add(req.str);
		cur.watch = val;
		return type_renderRes(true);
	}
	if (c.isInits.has(req.str)) {
		if (val === cur.watch) {
			return type_renderRes(true);
		}
		req.sync.onreadies.add(() => {
			cur.watch = val;
		});
	} else {
		req.sync.onreadies.add(() => {
			c.isInits.add(req.str);
			cur.watch = val;
		});
	}
	if (n !== undefined) {
		scope[p_target][n] = getProxy(val);
	}
	return null;
}
function type_watchCur() {
	return {
		watch: undefined
	};
}
