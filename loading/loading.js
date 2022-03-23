//import {type_animation} from "./render/type.js";
import {isFillingName, isFillingDiv} from "../config/config.js";
import {is$hide} from "../dom/dom.js";
import {type_loading} from "./type.js";
//!!instance
export const loadingCount = new Map();

export async function showLoading($e, testFunc, type = "", waitTime) {
//--	req.sync.animations.add(type_animation(async () => {
//		const lKey = getLoadingKey($e),
//			l = loadingCount.get(lKey);
		const src = my.env.srcBy$src.get($e),
			sId = src.id,
			l = loadingCount.get(sId);
		if (await testFunc()) {
			if (l !== undefined) {
				decLoading($e, type, l);
			} else {
				toggleLoading($e, type, false, l);
			}
			return;
		}
//		const ll = l === undefined ? createLoading(lKey) : l;
		const ll = l === undefined ? createLoading(sId) : l;
		toggleLoading($e, "", true, ll);
		if (type === "") {
			return;
		}
		if (waitTime === undefined || waitTime === "") {
			waitTime = -1;
		}
		if (waitTime < 0) {
			toggleLoading($e, type, true, ll);
			return;
		}
		setTimeout(async () => {
			if (is$hide($e)) {//!!так как запуст может быть через таймер - многое могло случится
//console.warn(43243242);
//alert(1);
				return;
			}
			if (!await testFunc()) {// && loadingCount.has(lKey)) {
				toggleLoading($e, type, true, ll);
			}
		}, waitTime);
//	}, req.sync.local, 0));
}
function createLoading(sId) {
	const n = type_loading();
	loadingCount.set(sId, n);
	return n;
}
/*
function createLoading(lKey) {
	const n = type_loading();
	loadingCount.set(lKey, n);
	return n;
}
function getLoadingKey($src) {
	const src = my.env.srcBy$src.get($src);
	if (src === undefined) {
		return $src;
	}
	if (loadingCount.has(src.id)) {
		return src.id;
	}
	const l = loadingCount.get($src);
	if (l === undefined) {
//		return $src;
		return src.id;
	}
	loadingCount.delete($src);
	loadingCount.set(src.id, l);
	return src.id;
}*/
function decLoading($e, type, l) {
	if (type !== "") {
		const amount = l.get(type) - 1
		l.set(type, amount);
//		if (amount <= 0) {
//			toggleLoading($e, type, false, l);
//		}
	}
	const amount = l.get("") - 1;
	l.set("", amount);
	if (amount > 0) {
		return;
	}
//	toggleLoading($e, "", false, l);
//	for (const [key, count] of loadingCount) {
	for (const [iId, iL] of loadingCount) {
		if (iL !== l) {
			continue
		}
		loadingCount.delete(iId);
		const $i = my.env.$srcById.get(iId);
		if ($i === undefined) {
			continue;
		}
		for (const type of l.keys()) {
			toggleLoading($i, type, false, l);
		}
/*
		for (const [type, amount] of l) {
			if (amount > 0) {
				continue;
			}
			toggleLoading($e, type, false, l);
			if (type === "") {
//				loadingCount.delete(key);
				loadingCount.delete(sId);
			}
		}*/
	}
}
function toggleLoading($e, type, f, l) {
/*
	if (is$hide($e)) {//так как запуст может быть через таймер - многое могло случится//!!за это состояние нужно что бы отвечали команды...
console.warn(43243242);
alert(1);
		return;
	}*/
	const lName = type === "" ? isFillingName : isFillingName + isFillingDiv + type;
	if (!f) {
		$e.removeAttribute(lName, "");
//		if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
		if (my.env.srcBy$src.get($e).isHide) {
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
//	if ($e.nodeName === "TEMPLATE" && $e.getAttribute(hideName) !== null) {
	if (my.env.srcBy$src.get($e).isHide) {
		$e.content.firstChild.setAttribute(lName, "");
	}
}
