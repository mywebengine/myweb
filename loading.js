//import {type_animation} from "./render/render.js";
import {isFillingName, isFillingDiv} from "./config.js";
import {srcBy$src} from "./descr.js";
import {is$hide} from "./dom.js";

export const loadingCount = new Map();

export async function showLoading($e, testFunc, type = "", waitTime) {
//--	req.sync.animations.add(type_animation(async () => {
		const lKey = getLoadingKey($e),
			l = loadingCount.get(lKey);
		if (await testFunc()) {
			if (l !== undefined) {
				decLoading($e, type, l);
			}
			return;
		}
		const ll = l === undefined ? createLoading(lKey) : l;
		if (waitTime === undefined || waitTime === "") {
			waitTime = -1;
		}
		if (waitTime < 0) {
			toggleLoading($e, "", true, ll);
			if (type !== "") {
				toggleLoading($e, type, true, ll);
			}
			return;
		}
		toggleLoading($e, "", true, ll);
		if (type === "") {
			return;
		}
		setTimeout(async () => {
			if (!await testFunc()) {// && loadingCount.has(lKey)) {
				toggleLoading($e, type, true, ll);
			}
		}, waitTime);
//	}, req.sync.local, 0));
}
function createLoading(lKey) {
	const n = type_loading();
	loadingCount.set(lKey, n);
	return n;
}
function getLoadingKey($src) {
	const src = srcBy$src.get($src);
	if (src === undefined) {
		return $src;
	}
	if (loadingCount.has(src.id)) {
		return src.id;
	}
	const l = loadingCount.get($src);
	if (l === undefined) {
		return $src;
	}
	loadingCount.delete($src);
	loadingCount.set(src.id, l);
	return src.id;
}
function decLoading($e, type, l) {
	if (type !== "") {
		const v = l.get(type) - 1
		l.set(type, v);
		if (v <= 0) {
			toggleLoading($e, type, false, l);
		}
	}
	const v = l.get("") - 1;
	l.set("", v);
	if (v > 0) {
		return;
	}
	toggleLoading($e, "", false, l);
	for (const [key, count] of loadingCount) {
		for (const [tp, v] of count) {
			if (v > 0) {
				continue;
			}
			if (tp === "") {
				loadingCount.delete(key);
			}
		}
	}
}
function toggleLoading($e, type, f, l) {
//todo
	if (is$hide($e)) {
console.warn(43243242);
alert(1);
		return;
	}
	const lName = type === "" ? isFillingName : isFillingName + isFillingDiv + type;
	if (!f) {
		$e.removeAttribute(lName, "");
		if ($e.nodeName === "TEMPLATE") {
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
	if ($e.nodeName === "TEMPLATE") {
		$e.content.firstChild.setAttribute(lName, "");
	}
}
function type_loading() {
	return new Map([["", 0]]);
}
