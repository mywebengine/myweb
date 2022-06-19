import Animation from "../../render/Animation.js";
import Command from "../Command.js";

export default class Html extends Command {
	isCustomHtml = false;
	render(req) {
		return this.my.eval2(req, req.$src, true)
			.then(val => {
				this.renderByValue(req, val, req.$src);
				return null;
			});
	}
	q_render(req, arr, isLast) {
		return this.my.q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length;
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						this.renderByValue(req, vals[i], arr[i].$src);
					}
				}
				return null;
			});
	}
	//private
	renderByValue(req, val, $src) {
//		const c = getCacheBySrcId($src[p_srcId]),
		const c = this.my.context.srcBy$src.get($src).cache;
		if (req.sync.renderParam.isLinking) {
			c.current.set(req.str, val);
			return;
		}
		if (val === c.current.get(req.str)) {
			return;
		}
		req.sync.animations.add(new Animation(() => {
			c.current.set(req.str, val);
			const m = req.commandWithArgs.args[0];
			if (m !== undefined && m !== "") {
				$src.textContent = val;
				return;
			}
			$src.innerHTML = val;
		}, req.sync.local, this.my.context.srcBy$src.get($src).id));
	}
};
