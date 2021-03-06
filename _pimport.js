﻿import {getURL} from "./loc.js";

export let isDynamicImport;
try {
	new Function("import('')");
	isDynamicImport = true;
} catch (err) {
}
let sync = 0;
export default function pimport(url) {
	if (isDynamicImport) {
		return new Function(`return import("${url.qq()}")`)();
	}
//	if (url instanceof String) {
	if (typeof url === "string") {
		url = getURL(url);
	}
	return new Promise((resolve, reject) => {
		const $script = document.createElement("script");
		$script.type = "module";
		const key = "importKey" + (++sync);
		$script.src = URL.createObjectURL(new Blob([`import * as m from "${url.qq()}"; self.${key} = m;`], {
			type: "text/javascript"
		}));
		$script.onload = () => {
			const m = self[key];
			clear($script, key);
			if (m) {
				resolve(self[key]);
			} else {
				reject(new Error(`Failed to import: ${url}`));
			}

		}
//!!for Edge
		$script.onerror = () => {
			clear($script, key);
			reject(new Error(`Failed to import: ${url}`));
		}
		document.head.append($script);
	});
}
function clear($script, key) {
	self[key] = undefined;
//	$script.onload = undefined;
//	script.onerror = undefined;
	$script.remove();
	URL.revokeObjectURL($script.src);
}
//self.pimport = pimport;
