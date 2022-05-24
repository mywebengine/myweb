import {Config} from "../config/Config.js";

export default function dispatchCustomEvent($src, evtName, detail) {
	const p = {
		detail
	};
	for (const i in Config.defEventInit) {
		p[i] = defEventInit[i];
	}
	$src.dispatchEvent(new CustomEvent(evtName, p));
}
