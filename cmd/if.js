import {renderTag, type_req, type_animation, type_renderRes} from "../render/render.js";
import {p_target, ifCmdName, elseifCmdName, elseCmdName, switchCmdName, caseCmdName, defaultCmdName, foreachCmdName, incCmdName, reqCmd} from "../config.js";
import {$srcById, srcBy$src, getAttrAfter, get$els, get$first, getNextStr} from "../descr.js";
import {show, hide, getIdx} from "../dom.js";
import {getErr} from "../err.js";
import {eval2, q_eval2} from "../eval2.js";
import {kebabToCamelCase} from "../str.js";

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
/*
.then(val => {
	const r = await if_render(req, val, ifCmdName, elseifCmdName, elseCmdName);
	console.log("ifres", req.str, req.expr, val, r, req);
	alert(1);
	return r;
});*/
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
					const reqI = type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync);
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
//		return switchGet(req);
		make$first(req, switchCmdName, caseCmdName, defaultCmdName);
		let f = true;
		for (const [n, v] of srcBy$src.get(req.$src).descr.attr) {
			if (f) {
				if (n === req.str) {
					f = false;
				}
				continue;
			}
			const rc = reqCmd.get(n);
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
.then(val => {
	const r = if_render(req, val, switchCmdName, caseCmdName, defaultCmdName, f => f === expression);
	console.log("ifres", expression, req.str, req.expr, val, r, req);
	alert(1);
	return r;
});*/
				});
		}
		throw getErr(new Error(">>>mw switch:01:Invalide structure: case-cmmand not found"), req.$src, req);
	}
};
//1) прдполагается что если первый скрыт то и все такие же скрыты - и наоборот
//2) !!: !$i[p_descrId] - это коммент, текст или когда template  и в нем скрыта тектовая нода
//3) в этом алгоритме нет проверки на эдентичность условий (предполлагается, что если они есть, то дожны быть правильными - так как такого рода ошибка может быть в серверном рендеренге - и это точно ошибка)
async function if_render(req, val, ifCmdName, elseifCmdName, elseCmdName, testFunc = f => f, str) {
	let isTrue = testFunc(val);
	if (isTrue) {
		const valName = req.reqCmd.args[0];
		if (valName) {
			req.scope[p_target][kebabToCamelCase(valName)] = val;
		}
	}
	let [$last, $attr, attr] = makeShow(req, req.$src, req.str, isTrue);
	const beforeAttrCount = isSingle(srcBy$src.get(req.$src), req.str);
//console.log(1, isTrue, $last, $attr, attr, beforeAttrCount, req, ifCmdName, elseifCmdName, elseCmdName);
	if (beforeAttrCount === -1) {
//		return type_renderRes(!isTrue, $attr, $last);
		return type_renderRes(attr === null, $attr, $last, $attr, attr);//если attr === null - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запщен рендер в афтерАнимации
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
			const rc = reqCmd.get(n);
			if (rc.cmdName !== elseifCmdName && rc.cmdName !== elseCmdName) {
				break;
			}
//			if (pos++ !== beforeAttrCount) {
//				throw getErr(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//			}
			//!!*3
			f = false;
			if (isTrue) {//это означает, что ранее был показан блок и текущий нужно скрыть, и далее рендерить по ранее заданному $attr
//				if ($i.nodeName === "TEMPLATE") {
//					$last = $i;
//					break;
//				}
				[$last] = makeShow(req, $i, n, false);
//console.log(2, $last, $attr, attr);
				$i = $last;
				break;
			}
			if (rc.cmdName === elseCmdName) {
				[$last, $attr, attr] = makeShow(req, $i, n, true);
//console.log(3, $last, $attr, attr);
				$i = $last;
				break;
			}
			//это elsif
			const reqI = type_req($i, n, v, req.scope, req.sync);
			val = await eval2(reqI, $i, true);
			if (isTrue = testFunc(val)) {
				const valName = reqI.reqCmd.args[0];
				if (valName) {
					req.scope[p_target][kebabToCamelCase(valName)] = val;
				}
				[$last, $attr, attr] = makeShow(reqI, $i, n, true);
//console.log(4, $last, $attr, attr);
				$i = $last;
				val = true;
				break;
			}
			[$last, $attr, attr] = makeShow(reqI, $i, n, false);
//console.log(5, f, $i, $last, $attr, attr);
			$i = $last;
//			val = false;
			break;
		}
		if (f) {
			break;
		}
	}
	return type_renderRes(attr === null, $attr, $last, $attr, attr);//если attr === null - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запщен рендер в афтерАнимации
}
function make$first(req, ifCmdName, elseifCmdName, elseCmdName) {
	let pos = 0;
	for (const n of srcBy$src.get(req.$src).descr.attr.keys()) {
		if (n === req.str) {
			break;
		}
		pos++;
	}
	const $first = if_get$first(ifCmdName, elseifCmdName, elseCmdName, req.$src, req.str, req.expr, pos);
	if (reqCmd.get(req.str).cmdName === ifCmdName) {
		req.$src = $first;
//		$first;
		return;
	}
	for (const [n, v] of srcBy$src.get($first).descr.attr) {
		const rc = reqCmd.get(n);
		if (rc.cmdName === ifCmdName) {
			req.reqCmd = rc;
			req.str = n;
			req.expr = v;
			req.$src = $first;
			$first;
			return;
		}
	}
}
function if_get$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos, firstStr) {
	const isStrIf = str !== "" && reqCmd.get(str).cmdName === ifCmdName;
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
			const rc = reqCmd.get(n);
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
						rc = reqCmd.get(n);
					if (rc.cmdName === foreachCmdName) {
						forBefore.push([n, getIdx(iSrc, n)]);
					}
				}
				if (i.value !== str) {
					continue;
				}
				for (i = attrIt.next(); !i.done; i = attrIt.next()) {
					const n = i.value,
						rc = reqCmd.get(n);
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
	const firstStr = {
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
		beforeAttrCount = isSingle(iSrc, firstStr.str);
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
			const rc = reqCmd.get(n);
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
function isSingle(src, str) {//проверка на то что этот иф входит в конструккцию типа: <div _elseif="*" _if="эотот иф"
	let beforeAttrCount = 0,
		f = false;
	for (const n of src.descr.attr.keys()) {
		if (n === str) {
			break;
		}
		switch (reqCmd.get(n).cmdName) {
			case ifCmdName:
			case elseifCmdName:
			case elseCmdName:
			case foreachCmdName:
//			case switchCmdName:
			case caseCmdName:
			case defaultCmdName:
				beforeAttrCount++;
				f = true;
//console.log(333333, $src, str, n, descrById.get($src[p_descrId]).attr);
			break;
			case incCmdName:
/*
//todo осмыслить про это
				const $els = get$els($src, descrById.get($src[p_descrId]).get$elsByStr, n);
				let $i = $els[$els.length - 2];
				while (!$i[p_isCmd]) {
					$i = $i.previousSibling;
				}
				if (descrById.get($i[p_descrId]).attr.has(str)) {
console.log(1111111, $src, str);
					return -1;
				}*/
				beforeAttrCount++;
				f = false;
			break;
		}
	}
	return f ? -1 : beforeAttrCount;
}
function makeShow(req, $i, str, isShow) {
	const src = srcBy$src.get($i),
		nStr = if_getNextStr(src, str),
		$els = nStr !== "" ? get$els($i, src.descr.get$elsByStr, nStr) : [$i],
		$elsLen = $els.length,
		$last = $els[$elsLen - 1];
	if (!isShow) {
		for (let i = 0; i < $elsLen; i++) {
			$i = $els[i];
			if ($i.nodeType === 1) {
				hide(req, $i);
			}
		}
		return [$last, null, null];
	}
	let $attr = null,
		attr = null,
		isNotAnimations = true;
	for (let i = 0; i < $elsLen; i++) {
		$i = $els[i];
		if ($i.nodeType === 8) {
			continue;
		}
//		if ($attr === null && $i[p_descrId]) {
		if ($attr === null) {
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined && iSrc.isCmd) {
				$attr = $i;
				attr = getAttrAfter(iSrc.descr.attr, str);
			}
		}
		//todo а что если это просто тег?
		if ($i.nodeName === "TEMPLATE") {
			show(req, $i);
			isNotAnimations = false;
		}
	}
	if (isNotAnimations) {
		return [$last, $attr, attr];
	}
	const sId = srcBy$src.get($attr).id;
	req.sync.afterAnimations.add(type_animation(() => renderTag($srcById.get(sId), req.scope, attr, req.sync), req.sync.local, 0));
	return [$last, null, null];
}
function if_getNextStr(src, str) {
	return str !== switchCmdName ? getNextStr(src, str) : getNextStr(src, getNextStr(src, str));
}
