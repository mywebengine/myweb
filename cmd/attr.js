import {type_animation} from "../render/render.js";
import {type_cacheAttrSyncCurI/*, getCacheBySrcId*/} from "../cache.js";
import {pushModName, replaceModName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {setAttribute, setAttributeValue, removeAttribute} from "../dom.js";
import {eval2, q_eval2} from "../eval2.js";
import {setLoc} from "../loc.js";
import {check} from "../util.js";

//1) _attr.<name>="<string|bool>"
//2) _attr.<name>.<value>="<bool>"
//3) _attr.href.(push|replace)=... history.(push|replace)State
//4) _attr.href... data-<_*(push|replace)>="<bool>" history.(push|replace)State <- priority

export default {
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => setValue(req, req.$src, getName(req), val));
	},
	q_render(req, arr, isLast) {
		const arrLen = arr.length;
		return q_eval2(req, arr, isLast)
			.then(vals => {
				const pArr = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
						pArr[i] = vals[i];
					}
				}
				return Promise.all(pArr);
			})
			.then(vals => {
				const n = getName(req);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
						setValue(req, arr[i].$src, n, vals[i]);
					}
				}
				return null;
			});
	}
};
function getName(req) {
	const n = req.reqCmd.args[0];
	if (n) {
		return n;
	}
	throw check(new Error(">>>Tpl attr:render:01: Need set attribute name"), req.$src, req);
}
function setValue(req, $src, n, v) {
	const toggleVal = req.reqCmd.args[1],
//		c = getCacheBySrcId($src[p_srcId]),
		c = srcBy$src.get($src).cache,
		isInit = c.isInit[req.str];
	if (!isInit) {
		c.isInit[req.str] = true;
		setClick(req, $src, n);
	}
	if (req.sync.p.renderParam.isLinking) {
		c.current[req.str] = $src.getAttribute(n);
		return null;
	}
	const aCache = c.attrSyncCur[n],
		curVal = aCache && aCache.syncId === req.sync.syncId ? aCache.value : (req.str in c.current ? c.current[req.str] : $src.getAttribute(n));
	if (toggleVal && toggleVal !== pushModName && toggleVal !== replaceModName) {
		if (curVal) {
//console.log(2, req.str, curVal, n, v);
			const i = curVal.indexOf(toggleVal),
				l = toggleVal.length;
			if (i !== -1 && (curVal[i - 1] === " " || i === 0) && (curVal[i + l] === " " || i + l === curVal.length)) {
				v = v ? curVal : curVal.substr(0, i) + curVal.substr(i + l + 1);
			} else if (v) {
				v = curVal[curVal.length - 1] === " " ? curVal + toggleVal : curVal + " " + toggleVal;
//				v = curVal + " " + toggleVal;
			} else {
				v = curVal;
			}
		} else if (v){
			v = toggleVal;
		} else {
//			v = false;
			v = curVal;
		}
	}
	if (v === true) {
		v = n;
	}
	if (aCache) {
		aCache.syncId = req.sync.syncId;
		aCache.value = v;
	} else {
		c.attrSyncCur[n] = type_cacheAttrSyncCurI(req.sync.syncId, v);
	}
	if (isInit && c.current[req.str] === v) {
		setAttributeValue($src, n, v);
		return null;
	}
	if (v || v === "") {
//todo <body _attr.class.home="[``].indexOf(loc.name) !== -1" _attr.class.main="[`myloc`, `mysnt`, `services`].indexOf(loc.name) !== -1"
		req.sync.animation.add(type_animation(() => {
			c.current[req.str] = v;
			setAttribute($src, n, v);
		}, req.local, srcBy$src.get($src).id));
		return null;
	}
//!!be clone => has attribute => not removing
//	if (curVal !== null) {
		req.sync.animation.add(type_animation(() => {
			c.current[req.str] = v;
			removeAttribute($src, n);
		}, req.local, srcBy$src.get($src).id));
//	}
	return null;
}
function setClick(req, $src, n) {
	if ($src.tagName !== "A" || n.toLowerCase() !== "href" || $src.target) {
		return;
	}
	$src.addEventListener("click", async (evt) => {
		if (!$src.href) {
			return;
		}
//todo isCtrl, mouse2, touch
		evt.preventDefault();
//!!придумать		switch (await getVal($src, null, pushModName, false) ? pushModName : (await getVal($src, null, replaceModName, false) ? replaceModName : req.reqCmd.args[1])) {
		switch (req.reqCmd.args[1]) {
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
