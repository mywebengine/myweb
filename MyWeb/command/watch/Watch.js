import config from "../../../config/config.js";
import kebabToCamelCase from "../../../str/kebabToCamelCase.js";
import RenderRes from "../../render/RenderRes.js";
import Command from "../Command.js";
import WatchCur from "./WatchCur.js";

export default class Watch extends Command {
	render(req) {
		return this.my.eval2(req, req.$src, true)
			.then(val => this.watch_render(req, req.scope, this.getName(req), val));
	}
	q_render(req, arr, isLast) {
		return this.my.q_eval2(req, arr, isLast)
			.then(vals => {
				const n = this.getName(req),
					arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = this.watch_render(req, arr[i].scope, n, vals[i]);
					}
				}
				return res;
			});
	}
	//private
	watch_render(req, scope, n, val) {
//		const c = getCacheBySrcId(req.$src[p_srcId]),
		const src = this.my.context.srcBy$src.get(req.$src),
			c = src.cache;
		if (!c.current.has(req.str)) {
			c.current.set(req.str, new WatchCur());
		}
		const cur = c.current.get(req.str);
		if (req.sync.renderParam.isLinking) {
			c.isInits.add(req.str);
			cur.watch = val;
			return new RenderRes(true);
		}
		if (c.isInits.has(req.str)) {
			if (val === cur.watch) {
				const get$elsByStr = src.descr.get$elsByStr;
				if (get$elsByStr === null) {
					return new RenderRes(true);
				}
				const $els = src.get$els(req.str);
				return new RenderRes(true, $els[$els.length - 1]);
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
			scope[config.p_target][n] = this.my.getReact(val);
		}
		return null;
	}
	//private
	getName(req) {
		const n = req.commandWithArgs.args[0];
		if (n !== undefined && n !== "") {
			return kebabToCamelCase(n);
		}
	}
};
