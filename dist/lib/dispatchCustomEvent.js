import { config } from "../config.js";
export function dispatchCustomEvent($src, evtName, detail) {
    const eventInit = {
        detail,
    };
    for (const i in config.defEventInit) {
        if (!(i in eventInit)) {
            eventInit.detail[i] = config.defEventInit[i];
        }
    }
    $src.dispatchEvent(new CustomEvent(evtName, eventInit));
}
