import {config} from "../config.js";

export function dispatchCustomEvent($src: HTMLElement, evtName: string, detail: Record<string, unknown>) {
	const eventInit = {
		detail,
	};
	for (const i in config.defEventInit) {
		if (!(i in eventInit)) {
			eventInit.detail[i] = (config.defEventInit as Record<string, unknown>)[i];
		}
	}
	$src.dispatchEvent(new CustomEvent(evtName, eventInit));
}
