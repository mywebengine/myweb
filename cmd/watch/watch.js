import {type_renderRes} from "../../render/type.js";
import {p_target} from "../../config/config.js";
import {get$els} from "../../descr/descr.js";
import {eval2, q_eval2} from "../../eval2/eval2.js";
import {getProxy} from "../../proxy/proxy.js";
import {kebabToCamelCase} from "../../str/str.js";
import {type_cmd} from "../type.js";

export default type_cmd(cmd_render, cmd_q_render, null, null, false, false);

function cmd_render(req) {
	return eval2(req, req.$src, true)
		.then(val => watch_render(req, req.scope, getName(req), val));
}
function cmd_q_render(req, arr, isLast) {
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
/*
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
};*/
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n !== undefined && n !== "") {
		return kebabToCamelCase(n);
	}
}
function watch_render(req, scope, n, val) {
//	const c = getCacheBySrcId(req.$src[p_srcId]),
	const src = my.env.srcBy$src.get(req.$src),
		c = src.cache;
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
			const get$elsByStr = src.descr.get$elsByStr;
			if (get$elsByStr === null) {
				return type_renderRes(true);
			}
			const $els = get$els(req.$src, src.descr.get$elsByStr, req.str);
			return type_renderRes(true, $els[$els.length - 1]);
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
