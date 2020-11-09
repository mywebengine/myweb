import {cache} from "../cache.js";
import {srcId, pushModName, replaceModName} from "../config.js";
import {setAttribute, removeAttribute} from "../dom.js";
import {eval2, q_eval2, getVal} from "../eval2.js";
import {setLoc} from "../loc.js";
import {type_req} from "../req.js";
import {getScope} from "../scope.js";
import {addAnimation, check} from "../util.js";

//1) _attr.<name>="<string|bool>"
//2) _attr.<name>.<value>="<bool>"
//3) _attr.href.(push|replace)=... history.(push|replace)State
//4) _attr.href... data-<_*(push|replace)>="<bool>" history.(push|replace)State <- priority

export default {
	async render(req) {
		const f = setValue(req, req.$src, getName(req), await eval2(req, req.$src, true));
		return f && addAnimation(f) || null;//, req.sync);
	},
	async q_render(req, arr, isLast) {
		const val = await q_eval2(req, arr, isLast),
			n = getName(req),
			l = arr.length,
			fSet = new Set(),
			scope = req.scope;
		for (let i = 0; i < l; i++) {
			if (!isLast[i]) {
				req.scope = arr[i].scope;
				const f = setValue(req, arr[i].$src, n, val[i]);
				if (f) {
					fSet.add(f);
				}
			}
		}
//!!! todo подумать: надо ли
		req.scope = scope;
		if (fSet.size) {
			return addAnimation(() => {
				for (const f of fSet) {
					f();
				}
			});//, req.sync);
		}
		return null;
	},
	linker(req) {
/*
		const n = getName(req),
			v = eval2(req, req.$src, true),
			cur = getCurentValue(req, req.$src[srcId]);
		cur[0] = v;
		setClick(req, req.$src, n, cur);
		return null;*/
	}
};
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n) {
		return n;
	}
	throw check(new Error(">>>Tpl attr:render:01: Need set attribute name"), req);
}
function setValue(req, $src, n, v) {
	const sId = $src[srcId],
		toggleVal = req.reqCmd.args[1],
		curVal = $src.getAttribute(n),
		isInit = cache[sId].isInit[req.str];
	if (!isInit) {
		cache[sId].isInit[req.str] = true;
		setClick(req, $src, n);
	}
	if (toggleVal && toggleVal !== pushModName && toggleVal !== replaceModName) {
		if (curVal) {
			const i = curVal.indexOf(toggleVal),
				l = toggleVal.length;
			if (i !== -1 && (i === 0 || curVal[i - 1] === " ") && (curVal[i + l] === " " || i + l === curVal.length)) {
				v = v && curVal || curVal.substr(0, i) + curVal.substr(i + l + 1);
			} else if (v) {
				v = curVal + " " + toggleVal;
			} else {
				v = curVal;
			}
		} else if (v){
			v = toggleVal;
		} else {
			v = false;
//			v = curVal;
		}
	}
	if (v === true) {
		v = n;
	}
	if (isInit && cache[sId].current[req.str] === v) {
		return null;
	}
	cache[sId].current[req.str] = v;
	if (v || v === "") {
//		if ((n !== "class" && n !== "style") || req.inFragment) {
		if (req.inFragment) {
			setAttribute($src, n, v);
			return null;
		}
		return () => {
			setAttribute($src, n, v);
		};
	}
//console.log(2, req.expr, n, v, $src.getAttribute(n), $src);
//be clone => has attribute => not rem
//	if (!curVal && curVal !== "") {
//console.log($src, n);
//		return;
//	}
//	cur[0] = v;//undefined;
	if (curVal === null) {
		return null;
	}
//	if ((n !== "class" && n !== "style") || req.inFragment) {
	if (req.inFragment) {
		removeAttribute($src, n);
		return null;
	}
	return () => {
		removeAttribute($src, n);
	};
}
function setClick(req, $src, n) {
	if ($src.tagName !== "A" || n.toLowerCase() !== "href") {
		return;
	}
	$src.addEventListener("click", async (evt) => {
		if (!$src.href) {
			return;
		}
//todo isCtrl, mouse2, touch
		evt.preventDefault();
		const rreq = type_req($src, req.str, req.expr, await getScope($src, req.str), null, false);
		switch (await getVal(rreq, pushModName, $src, true) && pushModName || await getVal(rreq, replaceModName, $src, true) && replaceModName || req.reqCmd.args[1]) {
			case pushModName:
				history.pushState(undefined, undefined, $src.href);
			break;
			case replaceModName:
				history.replaceState(undefined, undefined, $src.href);
			break;
			default:
				location.href = $src.href;
				return;
			break;
		}
		setLoc(location.href);
	});
}
