import {Tpl_$src} from "../config.js";
//import {getAttr} from "../descr.js";
import {type_req} from "../req.js";
import {getScope} from "../scope.js";

export function linkerBy$src($src = Tpl_$src, scope, attr) {
}
//export function linkerTag($src = Tpl_$src, scope = getScope($src), attr = getAttr($src)) {
export function linkerTag($src, scope, attr) {
//!!--
	if ($src.nodeType !== 1) {
console.log("!!!!!!! is not tag", $src);
		return $src;
	}
	for (const [n, v] of attr) {
//console.log("linker" + n, attr[n], $src, $src.parentNode, scope);
		const res = execLinker($src, n, v, scope);
		if (!res) {
			continue;
		}
		if (res.$e) {
			$src = res.$e;
		}
		if (res.isLast) {
			return $src;
		}
	}
	if ($src.nodeType === 1) {
		for (let $i = $src.firstChild; $i; $i = $i.nextSibling) {
			if ($i.nodeType === 1) {
				$i = linkerTag($i, scope);
			}
		}
	}
	return $src;
}
function execLinker($src, str, expr, scope) {
	const req = type_req($src, str, expr, scope, null, false);
	if (req.reqCmd.cmd.linker) {
		return req.reqCmd.cmd.linker(req);
	}
}
