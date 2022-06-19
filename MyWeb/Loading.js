import config from "../config/config.js";
//import Animation from "./render/Animation.js";
import Eval2 from "./Eval2.js";

export default class Loading extends Eval2 {
	async showLoading($e, testFunc, type = "", waitTime) {
//--		req.sync.animations.add(new Animation(async () => {
			const src = this.context.srcBy$src.get($e),
				l = this.context.loadingCount.get(src.id);
			if (await testFunc()) {
				if (l !== undefined) {
					this.decLoading($e, type, l);
				} else {
					this.toggleLoading($e, type, false, l);
				}
				return;
			}
			const ll = l === undefined ? this.createLoading(src.id) : l;
			this.toggleLoading($e, "", true, ll);
			if (type === "") {
				return;
			}
//--			if (waitTime === undefined || waitTime === "") {
//				waitTime = -1;
//			}
			if (waitTime === undefined || waitTime === "" || waitTime < 0) {
				this.toggleLoading($e, type, true, ll);
				return;
			}
			setTimeout(async () => {
//не делать этого - не вижу оснований
//				if (src.is$hide()) {//!!так как запуст может быть через таймер - многое могло случится
//console.warn(43243242);
//alert(1);
//					return;
//				}
				if (!await testFunc()) {// && this.context.loadingCount.has(src.id)) {
					this.toggleLoading($e, type, true, ll);
				}
			}, waitTime);
//		}, req.sync.local, 0));
	}
	//private
	createLoading(sId) {
		const n = new Map([["", 0]]);
		this.context.loadingCount.set(sId, n);
		return n;
	}
	//private
	decLoading($e, type, l) {
		if (type !== "") {
			const count = l.get(type) - 1
			l.set(type, count);
//todo не понятно зачем я это убрал
//			if (count <= 0) {
//				this.toggleLoading($e, type, false, l);
//			}
		}
		const count = l.get("") - 1;
		l.set("", count);
		if (count > 0) {
			return;
		}
		for (const [iId, iL] of this.context.loadingCount) {
			if (iL !== l) {
				continue
			}
			this.context.loadingCount.delete(iId);
			const $i = this.context.$srcById.get(iId);
			if ($i === undefined) {
				continue;
			}
			for (const type of l.keys()) {
				this.toggleLoading($i, type, false, l);
			}
/*
			for (const [type, count] of l) {
				if (count > 0) {
					continue;
				}
				this.toggleLoading($e, type, false, l);
				if (type === "") {
					this.context.loadingCount.delete(sId);
				}
			}*/
		}
	}
	//private
	toggleLoading($e, type, f, l) {
		const lName = type === "" ? config.isFillingName : config.isFillingName + config.isFillingDiv + type,
			isHide = this.context.srcBy$src.get($e).isHide;
		if (!f) {
			$e.removeAttribute(lName, "");
//			if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
			if (isHide) {
				$e.content.firstChild.removeAttribute(lName, "");
			}
			return;
		}
		if (type === "") {
			const c = l.get("");
			l.set("", c + 1);
		} else {
			const c = l.get(type);
			if (c === undefined) {
				l.set(type, 1);
			} else {
				l.set(type, c + 1);
			}
		}
		$e.setAttribute(lName, "");
//		if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
		if (isHide) {
			$e.content.firstChild.setAttribute(lName, "");
		}
	}
};
