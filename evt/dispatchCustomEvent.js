import config from "../config/config.js";

export default function dispatchCustomEvent($src, evtName, detail) {
	const p = {
		detail
	};
	for (const i in config.defEventInit) {
		if (!(i in p)) {
			p[i] = config.defEventInit[i];
		}
	}
	$src.dispatchEvent(new CustomEvent(evtName, p));
}
