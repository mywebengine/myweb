import {config} from "../config.js";
import {getUrl} from "./getUrl.js";

export function getRequest(val: string | Request, topUrl: string) {
	return typeof val === "string" ? (val !== "" ? new Request(getUrl(val, topUrl), config.defRequestInit) : null) : val;
}
