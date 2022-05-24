import {renderTag} from "../../render/render.js";

import {Req} from "../../render/type.js";
import {Animation} from "../../render/Animation.js";
import {type_renderRes} from "../../render/RenderRes.js";

import {p_target, ifCmdName, elseifCmdName, elseCmdName, switchCmdName, caseCmdName, defaultCmdName, foreachCmdName, incCmdName} from "../../config/config.js";
import {getAttrAfter, get$els, get$first, getNextStr} from "../../description/descr.js";
import {show, hide, getIdx} from "../../dom/dom.js";
import {getErr} from "../../err/err.js";
import {eval2, q_eval2} from "../../eval2/eval2.js";
import {ocopy, srcSetScope} from "../../oset/oset.js";
import {getProxy} from "../../proxy/proxy.js";
import {kebabToCamelCase} from "../../str/str.js";
import {type_cmd} from "../type.js";

export const ifCmd = type_cmd(ifCmd_render, ifCmd_q_render, ifCmd_get$first, ifCmd_get$els, false, false);
export const switchCmd = type_cmd(switchCmd_render, null, switchCmd_get$first, switchCmd_get$els, false, false);

function ifCmd_render(req) {
//console.log("if", req);
//alert(1);
	make$first(req, ifCmdName, elseifCmdName, elseCmdName);
	return eval2(req, req.$src, true)
		.then(val => if_render(req, val, ifCmdName, elseifCmdName, elseCmdName));
/*
.then(async val => {
	const r = await if_render(req, val, ifCmdName, elseifCmdName, elseCmdName);
	console.log("ifres", req.str, req.expr, val, r, req);
	alert(1);
	return r;
});*/
}
function ifCmd_q_render(req, arr, isLast) {
	let i = 0;
	while (isLast.has(i)) {
		i++;
	}
	const arrLen = arr.length;
	if (i === arrLen) {
		return null;
	}
	//так как иф при ку-рендере может быть только сингл, то можно не задумываться про то что в req
	return q_eval2(req, arr, isLast)
		.then(val => {
			const res = new Array(arrLen);
			do {
				const reqI = my.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync);
				make$first(reqI, ifCmdName, elseifCmdName, elseCmdName);
				res[i] = if_render(reqI, val[i], ifCmdName, elseifCmdName, elseCmdName);
				while (isLast.has(++i));
				if (i === arrLen) {
					break;
				}
			} while (true);
			return res;
		});
}
function ifCmd_get$first($src, str, expr, pos) {
	return if_get$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
}
function ifCmd_get$els($src, str, expr, pos) {
	return if_get$els(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
}

function switchCmd_render(req) {
//console.log("switch", req);
	make$first(req, switchCmdName, caseCmdName, defaultCmdName);
	let f = true;
	for (const [n, v] of my.ctx.srcBy$src.get(req.$src).descr.attr) {
		if (f) {
			if (n === req.str) {
				f = false;
			}
			continue;
		}
		const rc = my.ctx.reqCmd.get(n);
		if (rc.cmdName !== caseCmdName) {
			continue;
		}
		return eval2(req, req.$src, true)
			.then(expression => {
				req.reqCmd = rc;
				req.str = n;
				req.expr = v;
				return eval2(req, req.$src, true)
					.then(val => if_render(req, val, switchCmdName, caseCmdName, defaultCmdName, f => f === expression));
/*
.then(async val => {
	const r = await if_render(req, val, switchCmdName, caseCmdName, defaultCmdName, f => f === expression);
	console.log("witch-res", expression, req.str, req.expr, val, r, req);
	alert(1);
	return r;
});*/
			});
	}
	throw getErr(new Error(">>>mw switch:01:Invalide structure: case-cmmand not found"), req.$src, req);
}
//q_render для swicha не нужен - ку-рендер нжен для циклов
function switchCmd_get$first($src, str, expr, pos) {
	return if_get$first(switchCmdName, caseCmdName, defaultCmdName, $src, str, expr, pos);
}
function switchCmd_get$els($src, str, expr, pos) {
	return if_get$els(switchCmdName, caseCmdName, defaultCmdName, $src, str, expr, pos);
}



/*
export const ifCmd = {
	get$els($src, str, expr, pos) {
		return if_get$els(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
	},
	get$first($src, str, expr, pos) {
		return if_get$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
	},
	render(req) {
//console.log("if", req);
//alert(1);
		make$first(req, ifCmdName, elseifCmdName, elseCmdName);
		return eval2(req, req.$src, true)
			.then(val => if_render(req, val, ifCmdName, elseifCmdName, elseCmdName));
//.then(async val => {
//	const r = await if_render(req, val, ifCmdName, elseifCmdName, elseCmdName);
//	console.log("ifres", req.str, req.expr, val, r, req);
//	alert(1);
//	return r;
//});
	},
	q_render(req, arr, isLast) {
		let i = 0;
		while (isLast.has(i)) {
			i++;
		}
		const arrLen = arr.length;
		if (i === arrLen) {
			return null;
		}
		return q_eval2(req, arr, isLast)
			.then(val => {
				const res = new Array(arrLen);
				do {
					const reqI = my.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync);
					make$first(reqI, ifCmdName, elseifCmdName, elseCmdName);
					res[i] = if_render(reqI, val[i], ifCmdName, elseifCmdName, elseCmdName);
					while (isLast.has(++i));
					if (i === arrLen) {
						break;
					}
				} while (true);
				return res;
			});
	}
};
export const switchCmd = {
	get$els($src, str, expr, pos) {
		return if_get$els(switchCmdName, caseCmdName, defaultCmdName, $src, str, expr, pos);
	},
	get$first($src, str, expr, pos) {
		return if_get$first(switchCmdName, caseCmdName, defaultCmdName, $src, str, expr, pos);
	},
	render(req) {
//console.log("switch", req);
		make$first(req, switchCmdName, caseCmdName, defaultCmdName);
		let f = true;
		for (const [n, v] of my.ctx.srcBy$src.get(req.$src).descr.attr) {
			if (f) {
				if (n === req.str) {
					f = false;
				}
				continue;
			}
			const rc = my.ctx.reqCmd.get(n);
			if (rc.cmdName !== caseCmdName) {
				continue;
			}
			return eval2(req, req.$src, true)
				.then(expression => {
					req.reqCmd = rc;
					req.str = n;
					req.expr = v;
					return eval2(req, req.$src, true)
						.then(val => if_render(req, val, switchCmdName, caseCmdName, defaultCmdName, f => f === expression));
//.then(async val => {
//	const r = await if_render(req, val, switchCmdName, caseCmdName, defaultCmdName, f => f === expression);
//	console.log("witch-res", expression, req.str, req.expr, val, r, req);
//	alert(1);
//	return r;
//});
				});
		}
		throw getErr(new Error(">>>mw switch:01:Invalide structure: case-cmmand not found"), req.$src, req);
	}//,
//todo	q_render(req, arr, isLast) {}
};*/


//1) прдполагается что если первый скрыт то и все такие же скрыты - и наоборот
//2) !!: !$i[p_descrId] - это коммент, текст или когда template  и в нем скрыта тектовая нода
//3) в этом алгоритме нет проверки на эдентичность условий (предполлагается, что если они есть, то дожны быть правильными - так как такого рода ошибка может быть в серверном рендеренге - и это точно ошибка)
async function if_render(req, val, ifCmdName, elseifCmdName, elseCmdName, testFunc = f => f) {//, str) {
	const srcBy$src = my.ctx.srcBy$src,
		pSrc = srcBy$src.get(req.$src.parentNode),
		pScope = pSrc !== undefined ? pSrc.scopeCache : {},
		reqI = my.createReq(req.$src, req.str, req.expr, srcSetScope(srcBy$src.get(req.$src), pScope), req.sync);
	let isTrue = testFunc(val);
	if (isTrue) {
		const valName = reqI.reqCmd.args[0];
		if (valName !== undefined && valName !== "") {
			reqI.scope[p_target][kebabToCamelCase(valName)] = getProxy(val);
		}
	}
	let [$last, $attr, attrStr] = makeShow(reqI, reqI.$src, reqI.str, isTrue);
	const beforeAttrCount = isSingle(reqI.$src, srcBy$src.get(reqI.$src), reqI.str, ifCmdName);
//console.log(1, isTrue, $last, $attr, str, beforeAttrCount, req, ifCmdName, elseifCmdName, elseCmdName);
	if (beforeAttrCount === -1) {
//		return type_renderRes(!isTrue, $attr, $last);
		return type_renderRes(attrStr === "", $attr, $last, $attr, attrStr);//если attrStr === "" - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запщен рендер в афтерАнимации
	}
	for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
//		if ($i.nodeType !== 1) {
//		if (!$i[p_descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {//это коммент, текст или когда template и в нем скрыта тектовая нода
			continue;
		}
		if (!iSrc.isCmd) {
			break;
		}
		let f = true,
			pos = 0;
		for (const [n, v] of iSrc.descr.attr) {
			if (pos++ < beforeAttrCount) {
				continue;
			}
			const rc = my.ctx.reqCmd.get(n);
//console.log(req.str, iSrc, $i, n, rc.cmdName, elseifCmdName, elseCmdName)
			if (rc.cmdName !== elseifCmdName && rc.cmdName !== elseCmdName) {
				break;
			}
//			if (pos++ !== beforeAttrCount) {
//				throw getErr(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//			}
			const reqI = my.createReq($i, n, v, srcSetScope(iSrc, pScope), req.sync);
			//!!*3
			f = false;
			if (isTrue) {//это означает, что ранее был показан блок и текущий нужно скрыть, и далее рендерить по ранее заданному $attr
//				if ($i.nodeName === "TEMPLATE") {
//					$last = $i;
//					break;
//				}
				[$last] = makeShow(reqI, $i, n, false);
//console.log(2, $last, $attr, attrStr);
				$i = $last;
				break;
			}
			if (rc.cmdName === elseCmdName) {
				[$last, $attr, attrStr] = makeShow(reqI, $i, n, true);
//console.log(3, $last, $attr, attrStr);
				$i = $last;
				break;
			}
			//это elsif
			val = await eval2(reqI, $i, true);
			if (isTrue = testFunc(val)) {
				const valName = reqI.reqCmd.args[0];
				if (valName !== undefined && valName !== "") {
					reqI.scope[p_target][kebabToCamelCase(valName)] = getProxy(val);
				}
				[$last, $attr, attrStr] = makeShow(reqI, $i, n, true);
//console.log(4, $last, $attr, attrStr);
				$i = $last;
				val = true;
				break;
			}
			[$last, $attr, attrStr] = makeShow(reqI, $i, n, false);
//console.log(5, f, $i, $last, $attr, attrStr);
			$i = $last;
//			val = false;
			break;
		}
		if (f) {
			break;
		}
	}
	return type_renderRes(attrStr === "", $attr, $last, $attr, attrStr);//если attrStr === "" - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запщен рендер в афтерАнимации
}
function make$first(req, ifCmdName, elseifCmdName, elseCmdName) {
	let pos = 0;
	for (const n of my.ctx.srcBy$src.get(req.$src).descr.attr.keys()) {
		if (n === req.str) {
			break;
		}
		pos++;
	}
	const $first = if_get$first(ifCmdName, elseifCmdName, elseCmdName, req.$src, req.str, req.expr, pos);
	if (my.ctx.reqCmd.get(req.str).cmdName === ifCmdName) {
		req.$src = $first;
		return;
	}
	for (const [n, v] of my.ctx.srcBy$src.get($first).descr.attr) {
		const rc = my.ctx.reqCmd.get(n);
		if (rc.cmdName === ifCmdName) {
			req.reqCmd = rc;
			req.str = n;
			req.expr = v;
			req.$src = $first;
			return;
		}
	}
}
function if_get$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos, firstStr) {
	const isStrIf = str !== "" && my.ctx.reqCmd.get(str).cmdName === ifCmdName,
		srcBy$src = my.ctx.srcBy$src;
	for (let $i = $src; $i !== null; $i = $i.previousSibling) {
//		if ($i.nodeType !== 1) {
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {//это коммент, текст или когда template и в нем скрыта тектовая нода
			continue;
		}
		if (!iSrc.isCmd) {
			break;
		}
		let f = true,
			l = 0;
		for (const n of iSrc.descr.attr.keys()) {
			const rc = my.ctx.reqCmd.get(n);
			if (rc.cmdName === incCmdName) {
				l = 0;
				continue;
			}
			l++;
			if (isStrIf) {
				if (n !== str) {
					continue;
				}
			} else if (rc.cmdName === elseifCmdName || rc.cmdName === elseCmdName) {
				if (l !== 1) {
					throw getErr(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
				}
				f = false;
				break;
			} else if (rc.cmdName !== ifCmdName) {// || (isStrIf && n !== str)) {
				continue;
			}
			if (firstStr) {
				firstStr.str = n;
			}
			let incCount = 0,
				forBefore = [],
				forStr = "",
				forIdx;
			const attrIt = iSrc.descr.attr.keys();
			for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
				if (incCount === 0) {
					const n = i.value,
						rc = my.ctx.reqCmd.get(n);
					if (rc.cmdName === foreachCmdName) {
						forBefore.push([n, getIdx(iSrc, n)]);
					}
				}
				if (i.value !== str) {
					continue;
				}
				for (i = attrIt.next(); !i.done; i = attrIt.next()) {
					const n = i.value,
						rc = my.ctx.reqCmd.get(n);
					if (forStr === "" && rc.cmdName === incCmdName) {
						if (getIdx(iSrc, n) !== undefined) {
							incCount++;
						}
					} else if (incCount === 0 && forStr === "" && rc.cmdName === foreachCmdName) {
						forIdx = getIdx(iSrc, n);
						if (forIdx !== undefined) {
							forStr = n;
						}
					}
				}
				break;
			}
			if (incCount !== 0) {
				for ($i = $i.previousSibling; $i !== null; $i = $i.previousSibling) {
					if ($i.nodeType === 8 && $i.textContent === "inc_begin") {
						if (--incCount) {
							continue;
						}
						for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
							const iSrc = srcBy$src.get($i);
							if (iSrc !== undefined && iSrc.isCmd) {
								return $i;
							}
						}
					}
				}
				throw getErr(new Error(">>>mw if:make$first:02 Invalid structure: inc_begin not found"), $src);
			}
			if (forStr !== "") {
				const forBeforeLen = forBefore.length;
				for (let $j = $i.previousSibling; $j !== null; $j = $j.previousSibling) {
					const jSrc = srcBy$src.get($j);
					if (jSrc === undefined || !jSrc.isCmd) {
						continue;
					}
					const jdx = getIdx(jSrc, forStr);
					if (jdx === undefined || forIdx < jdx) {
						return $i;
					}
					if (forBeforeLen > 0) {
						for (let i = 0; i < forBeforeLen; i++) {
							const b = forBefore[i];
							if (getIdx(jSrc, b[0]) !== b[1]) {
								return $i;
							}
						}
					}
					$i = $j;
					forIdx = jdx;
//--					if (jdx === "0") {
//						$i = $j;
//					}
				}
				return $i;
			}
			return $i;
		}
		if (f) {
			break;
		}
	}
	throw getErr(new Error(`>>>mw if:ifGet$first:02 Invalid structure: if-command not found - str => "${str}"`), $src);
}
function if_get$els(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos) {
//console.error(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
//todo type
	const srcBy$src = my.ctx.srcBy$src,
		firstStr = {
			str: ""
		};
	let $i = if_get$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos, firstStr);
	for (let iSrc = srcBy$src.get($i); iSrc !== undefined && !iSrc.isCmd && $i !== null; $i = $i.nextSibling, iSrc = srcBy$src.get($i)) {
		$i = $i.nextSibling;
	}
//	if (!$i) {
//		!!такого не должно быть
//	}
	const iSrc = srcBy$src.get($i),
		nStr = if_getNextStr(iSrc, firstStr.str),
		$els = nStr !== "" ? get$els($i, iSrc.descr.get$elsByStr, nStr) : [$i],
		beforeAttrCount = isSingle($i, iSrc, firstStr.str, ifCmdName);
	if (beforeAttrCount === -1) {
		return $els;
	}
	if (nStr !== "") {
		$i = $els[$els.length - 1];
	}
	let $maybe = [];
	for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
//		if ($i.nodeType !== 1) {
//--		if (!$i[p_descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
		const iSrc = srcBy$src.get($i);
		if (iSrc === undefined) {//это коммент, текст или когда template и в нем скрыта тектовая нода
			$maybe.push($i);
			continue;
		}
		if (!iSrc.isCmd) {
			return $els;
		}
		let f = true,
			pos = 0;
		const iDescr = iSrc.descr;
		for (const n of iDescr.attr.keys()) {
			if (pos++ < beforeAttrCount) {
				continue;
			}
			const rc = my.ctx.reqCmd.get(n);
			if (rc.cmdName !== elseifCmdName && rc.cmdName !== elseCmdName) {
				break;
			}
//			if (pos++ !== beforeAttrCount) {
//				throw getErr(new Error(">>>mw if:ifGet$els:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//			}
			//!!*3
			f = false;
//todo--if ($els.length > 20) {
//	debugger
//}
			const nStr = if_getNextStr(iSrc, n),
				$iEls = nStr !== "" ? get$els($i, iDescr.get$elsByStr, nStr) : [$i];
			if ($iEls.length === 1) {
				if ($maybe.length !== 0) {
					$els.push(...$maybe);
					$maybe = [];
				}
				$els.push($i);
				break;
			}
//todo тут вроде всё работает - проверить доказательство
			$i = $iEls[0].previousSibling;
			$maybe = [];
//			while (!$i[p_descrId]) {
			while (true) {
				const iSrc = srcBy$src.get($i);
				if (iSrc === undefined) {
					break;
				}
				$maybe.push($i);
				$i = $i.previousSibling;
			}
			const $maybeLen = $maybe.length;
			if ($maybeLen !== 0) {
				for (let i = $maybeLen - 1; i > -1; i--) {
					$els.push($maybe[i]);
				}
				$maybe = [];
			}
			$i = $els[$els.push(...$iEls) - 1];
//console.error($i, $i.nextSibling, $i.nextSibling.nextSibling);
			break;
		}
		if (f) {
			return $els;
		}
	}
	return $els;
}
function isSingle($src, src, str, ifCmdName) {//проверка на то что этот иф входит в конструккцию типа: <div _elseif="*" _if="эотот иф"
	let beforeAttrCount = 0,
		f = false;
	for (const n of src.descr.attr.keys()) {
		if (n === str) {
			break;
		}
		const nn = my.ctx.reqCmd.get(n).cmdName;
		if (ifCmdName === switchCmdName && nn === switchCmdName) {
			continue;
		}
		beforeAttrCount++;
		switch (nn) {
			case ifCmdName:
			case elseifCmdName:
			case elseCmdName:
			case foreachCmdName:
//			case switchCmdName:
			case caseCmdName:
			case defaultCmdName:
//				beforeAttrCount++;
				f = true;
//console.log(333333, $src, str, n, my.ctx.descrById.get($src[p_descrId]).attr);
			break;
			case incCmdName:
/*
				const $els = get$els($src, src.descr.get$elsByStr, n);
				for (let $i = $els[$els.length - 2];; $i = $i.previousSibling) {
					const iSrc = srcBy$src.get($i);
					if (!iSrc.isCmd) {
						continue;
					}
					if (iSrc.descr.attr.has(str)) {
						return -1;
					}
					break;
				}*/
//				beforeAttrCount++;
				f = false;
			break;
		}
	}
	return f ? -1 : beforeAttrCount;
}
function makeShow(req, $i, str, isShow) {
	const srcBy$src = my.ctx.srcBy$src,
		src = srcBy$src.get($i),
		nStr = if_getNextStr(src, str),
		$els = nStr !== "" ? get$els($i, src.descr.get$elsByStr, nStr) : [$i],
		$elsLen = $els.length,
		$last = $els[$elsLen - 1];
	if (!isShow) {
		for (let i = 0; i < $elsLen; i++) {
//			$i = $els[i];
//			if ($i.nodeType === 1) {
//				hide(req, $i);
//			}
			hide(req, $els[i]);
		}
		return [$last, null, ""];
	}
	let $attr = null,
		attrStr = "",
		isNotAnimations = true;
	for (let i = 0; i < $elsLen; i++) {
		$i = $els[i];
		const iSrc = srcBy$src.get($i);
//		if ($i.nodeType !== 1) {
		if (iSrc === undefined) {
			if ($i.nodeType === 1) {
				show(req, $i);
				isNotAnimations = false;
			}
			continue;
		}
		if ($attr === null) {
			$attr = $i;
			attrStr = str;
		}
//		if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
		if (iSrc.isHide) {
			show(req, $i);
			isNotAnimations = false;
		}
	}
/*<==
	for (let i = 0; i < $elsLen; i++) {
		$i = $els[i];
		if ($i.nodeType === 8) {
			continue;
		}
		if ($attr === null) {
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined && iSrc.isCmd) {
				$attr = $i;
				attrStr = str;
			}
		}
		if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
			show(req, $i);
			isNotAnimations = false;
		}
	}*/
	if (isNotAnimations) {
		return [$last, $attr, attrStr];
	}
	const sId = srcBy$src.get($attr).id;
	req.sync.afterAnimations.add(new Animation(() => renderTag(my.ctx.$srcById.get(sId), req.scope, str, req.sync), req.sync.local, 0));
	return [$last, null, ""];
}
function if_getNextStr(src, str) {
	return str !== switchCmdName ? getNextStr(src, str) : getNextStr(src, getNextStr(src, str));
}
