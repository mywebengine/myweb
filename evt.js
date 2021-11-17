import {defEventInit} from "./config.js";

export function dispatchCustomEvent($src, evtName, detail) {
	const p = {
		detail
	};
	for (const i in defEventInit) {
		p[i] = defEventInit[i];
	}
	$src.dispatchEvent(new CustomEvent(evtName, p));
}
