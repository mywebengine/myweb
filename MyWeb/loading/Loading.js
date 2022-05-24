import Config from "../../config/Config.js";
import Eval2 from "../eval2/Eval2.js";

//import {Animation} from "./render/Animation.js";
//import {is$hide} from "../dom/dom.js";
//import {type_loading} from "./type.js";
//!!instance
//export const loadingCount = new Map();

class Loading extends Eval2 {
	async showLoading($e, testFunc, type = "", waitTime) {
//--		req.sync.animations.add(new Animation(async () => {
//			const lKey = getLoadingKey($e),
//				l = this.ctx.loadingCount.get(lKey);
			const src = this.ctx.srcBy$src.get($e),
				sId = src.id,
				l = this.ctx.loadingCount.get(sId);
			if (await testFunc()) {
				if (l !== undefined) {
					this.decLoading($e, type, l);
				} else {
					this.toggleLoading($e, type, false, l);
				}
				return;
			}
//			const ll = l === undefined ? this.createLoading(lKey) : l;
			const ll = l === undefined ? this.createLoading(sId) : l;
			this.toggleLoading($e, "", true, ll);
			if (type === "") {
				return;
			}
			if (waitTime === undefined || waitTime === "") {
				waitTime = -1;
			}
			if (waitTime < 0) {
				this.toggleLoading($e, type, true, ll);
				return;
			}
			setTimeout(async () => {
				if (this.is$hide($e)) {//!!так как запуст может быть через таймер - многое могло случится
//console.warn(43243242);
//alert(1);
					return;
				}
				if (!await testFunc()) {// && this.ctx.loadingCount.has(lKey)) {
					this.toggleLoading($e, type, true, ll);
				}
			}, waitTime);
//		}, req.sync.local, 0));
	}
	//private
	createLoading(sId) {
		const n = new Map([["", 0]]);
		this.ctx.loadingCount.set(sId, n);
		return n;
	}
	//private
	decLoading($e, type, l) {
		if (type !== "") {
			const amount = l.get(type) - 1
			l.set(type, amount);
//			if (amount <= 0) {
//				this.toggleLoading($e, type, false, l);
//			}
		}
		const amount = l.get("") - 1;
		l.set("", amount);
		if (amount > 0) {
			return;
		}
//		this.toggleLoading($e, "", false, l);
//		for (const [key, count] of this.ctx.loadingCount) {
		for (const [iId, iL] of this.ctx.loadingCount) {
			if (iL !== l) {
				continue
			}
			this.ctx.loadingCount.delete(iId);
			const $i = this.ctx.$srcById.get(iId);
			if ($i === undefined) {
				continue;
			}
			for (const type of l.keys()) {
				this.toggleLoading($i, type, false, l);
			}
/*
			for (const [type, amount] of l) {
				if (amount > 0) {
					continue;
				}
				this.toggleLoading($e, type, false, l);
				if (type === "") {
//					this.ctx.loadingCount.delete(key);
					this.ctx.loadingCount.delete(sId);
				}
			}*/
		}
	}
	//private
	toggleLoading($e, type, f, l) {
/*
		if (this.is$hide($e)) {//так как запуст может быть через таймер - многое могло случится//!!за это состояние нужно что бы отвечали команды...
console.warn(43243242);
alert(1);
			return;
		}*/
		const lName = type === "" ? Config.isFillingName : Config.isFillingName + Config.isFillingDiv + type;
		if (!f) {
			$e.removeAttribute(lName, "");
//			if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
			if (this.ctx.srcBy$src.get($e).isHide) {
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
		if (this.ctx.srcBy$src.get($e).isHide) {
			$e.content.firstChild.setAttribute(lName, "");
		}
	}
};
