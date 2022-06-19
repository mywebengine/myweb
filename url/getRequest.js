import config from "../config/config.js";
import getUrl from "./getUrl.js";

export default function getRequest(val, topUrl) {
	if (typeof val === "string") {
		return val !== "" ? new Request(getUrl(val, topUrl), config.defRequestInit) : null;
	}
	return val instanceof Request || val instanceof Response ? val : null;
}
