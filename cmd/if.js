import {descrId, isCmd, ifCmdName, elseifCmdName, elseCmdName, switchCmdName, caseCmdName, defaultCmdName, forCmdName, incCmdName} from "../config.js";
import {show, hide, getIdx} from "../dom.js";
import {descrById, getAttrAfter, get$els, get$first, getNextStr} from "../descr.js";
import {eval2, q_eval2} from "../eval2.js";
import {type_renderRes} from "../render/algo.js";
import {reqCmd, type_req} from "../req.js";
import {check, /*ocopy, */kebabToCamelStyle} from "../util.js";

export const ifCmd = {
	get$els($src, str, expr, pos) {
		return ifGet$els(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
	},
	get$first($src, str, expr, pos) {
		return ifGet$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
	},
	async render(req) {
//console.log("if", req);
		make$first(req, ifCmdName, elseifCmdName, elseCmdName);
		return ifGet(req, await eval2(req, req.$src, true), ifCmdName, elseifCmdName, elseCmdName);
//		const val = await eval2(req, req.$src, true), r = await ifGet(req, val, ifCmdName, elseifCmdName, elseCmdName);
//console.log("ifres", val, r, req);
//alert(1);
//		return r;
	},
	async q_render(req, arr, isLast) {
		let i = 0;
		while (isLast[i]) {
			i++;
		}
		const len = arr.length;
		if (i === len) {
			return null;
		}
		const val = await q_eval2(req, arr, isLast),
			res = new Array(len);
		while (true) {
			const reqI = type_req(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync, req.inFragment);
			make$first(reqI, ifCmdName, elseifCmdName, elseCmdName);
			res[i] = ifGet(reqI, val[i], ifCmdName, elseifCmdName, elseCmdName);
			while (isLast[++i]);
			if (i === len) {
				break;
			}
		}
		return res;
	},
	linker(req) {
//		return ifGet(req, ifCmdName, elseifCmdName, elseCmdName, $e => $e, $e => $e);
	},
	setScope
};
export const switchCmd = {
	get$els($src, str, expr, pos) {
		return ifGet$els(switchCmdName, caseCmdName, defaultCmdName, $src, str, expr, pos);
	},
	get$first($src, str, expr, pos) {
		return ifGet$first(switchCmdName, caseCmdName, defaultCmdName, $src, str, expr, pos);
	},
	render(req) {
		return switchGet(req);
	},
	linker(req) {
		return switchGet(req, $e => $e, $e => $e);
	},
	setScope
};
async function setScope(req) {
	if (req.reqCmd.cmdName === elseCmdName) {
		return true;
	}
	const val = await eval2(req, req.$src, true, true),
		varName = kebabToCamelStyle(req.reqCmd.args[0]);
	if (varName) {
		req.scope[varName] = val;
	}
	return !!val;
}
//1) прдполагается что если первый скрыт то и все такие же скрыты - и наоборот
//2) !!: !$i[descrId] - это коммент, текст или когда template  и в нем скрыта тектовая нода
//3) в этом алгоритме нет проверки на эдентичность условий (предполлагается, что если они есть, то дожны быть правильными - так как такого рода ошибка может быть в серверном рендеренге - и это точно ошибка)
async function ifGet(req, val, ifCmdName, elseifCmdName, elseCmdName, testFunc = f => f, str) {
	const isTrue = testFunc(val);
	if (isTrue) {
		const varName = kebabToCamelStyle(req.reqCmd.args[0]);
		if (varName) {
			req.scope[varName] = val;
		}
	}
	let [$last, $attr] = await makeShow(req, req.$src, req.str, isTrue),
		attr = isTrue && getAttrAfter(descrById.get($attr[descrId]).attr, req.str) || null;
	const beforeAttrCount = isSingle($attr, req.str);
	if (beforeAttrCount === -1) {
		return type_renderRes(!isTrue, $attr, $last);
	}
	for (let $i = $last.nextSibling; $i; $i = $i.nextSibling) {
//console.log(0, req.str, $i);
//		if ($i.nodeType !== 1) {
		if (!$i[descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
			continue;
		}
		if (!$i[isCmd]) {
			break;
		}
		let f = true,
			pos = 0;
		for (const [n, v] of descrById.get($i[descrId]).attr) {
			if (pos++ < beforeAttrCount) {
				continue;
			}
			const rc = reqCmd[n];
			if (rc.cmdName !== elseifCmdName && rc.cmdName !== elseCmdName) {
				break;
			}
//			if (pos++ !== beforeAttrCount) {
//				throw check(new Error(">>>Tpl if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//			}
			//!!*3
			f = false;
			if (val) {//это означает, что ранее был показан блок и текущий нужно скрыть, и далее рендерить по ранее заданному $attr
				if ($i.content) {
					$last = $i;
					break;
				}
				[$last] = await makeShow(req, $i, n, false);
				$i = $last;
//console.log(1, $last, val);
				break;
			}
			if (rc.cmdName === elseCmdName) {
				if ($i.content) {
					[$last, $attr] = await makeShow(req, $i, n, true);
					attr = getAttrAfter(descrById.get($attr[descrId]).attr, n);
					$i = $last;
					break;
				}
				$last = $attr = $i;//вот тут не очень оптимально с $attr - в следующем рендере его придётся возвращать вверх
				attr = getAttrAfter(descrById.get($attr[descrId]).attr, n);
//console.log(2, $last);
				break;
			}
			//это elsif
			const reqI = type_req($i, n, v, req.scope, req.sync, req.inFragment);
			val = await eval2(reqI, reqI.$src, true);
			if (testFunc(val)) {
				const varName = kebabToCamelStyle(reqI.reqCmd.args[0]);
				if (varName) {
					req.scope[varName] = val;
				}
				[$last, $attr] = await makeShow(reqI, $i, n, true);
				attr = getAttrAfter(descrById.get($attr[descrId]).attr, reqI.str);
//console.log(3, req.str, n, v, val, $i, $attr, attr, $last, descrById.get($i[descrId]).attr);
				$i = $last;
				val = true;
				break;
			}
			[$last] = await makeShow(reqI, $i, n, false);
			$attr = attr = null;
			$i = $last;
			val = false;
//console.log(4, req.str, $last);
			break;
		}
		if (f) {
			break;
		}
	}
//console.log(777, req.str, attr === null, null, $last, $attr, attr);
//alert(1);
	return type_renderRes(attr === null, $attr, $last, $attr, attr);//если attr === null - это значит, что ничего не показывается
}
function make$first(req, ifCmdName, elseifCmdName, elseCmdName) {
	let pos = 0;
	for (const n of descrById.get(req.$src[descrId]).attr.keys()) {
		if (n === req.str) {
			break;
		}
		pos++;
	}
	const $first = ifGet$first(ifCmdName, elseifCmdName, elseCmdName, req.$src, req.str, req.expr, pos);
	if (reqCmd[req.str].cmdName === ifCmdName) {
		return $first;
	}
	for (const [n, v] of descrById.get($first[descrId]).attr) {
		const rc = reqCmd[n];
		if (rc.cmdName === ifCmdName) {
			req.reqCmd = rc;
			req.str = n;
			req.expr = v;
			req.$src = $first;
			return $first;
		}
	}
}
function ifGet$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos, firstStr) {
	const isStrIf = str && reqCmd[str].cmdName === ifCmdName;
	for (let $i = $src; $i; $i = $i.previousSibling) {
//		if ($i.nodeType !== 1) {
		if (!$i[descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
			continue;
		}
		if (!$i[isCmd]) {
			break;
		}
		let f = true,
			l = 0;
//todo сделать контроль по позиции
		const beforeIdx = {},
			isBeforeAttr = {};
		for (const n of descrById.get($i[descrId]).attr.keys()) {
			const idx = getIdx($i, n);
			if (idx) {
				beforeIdx[n] = idx;
			} else {
				isBeforeAttr[n] = true;
			}
			const rc = reqCmd[n];
			if (rc.cmdName === incCmdName) {
				continue;
			}
			l++;
			if (isStrIf) {
				if (n !== str) {
					continue;
				}
			} else if (rc.cmdName === elseifCmdName || rc.cmdName === elseCmdName) {
				if (l !== 1) {
					throw check(new Error(">>>Tpl if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
				}
				f = false;
				break;
			} else if (rc.cmdName !== ifCmdName) {// || (isStrIf && n !== str)) {
				continue;
			}
			if (firstStr) {
				firstStr.str = n;
			}
			let $first = $i;
			while ($i = $i.previousSibling) {
//				if ($i.nodeType !== 1) {
				if (!$i[descrId]) {
					continue;
				}
				if (!$i[isCmd]) {
					return $first;
				}
				let ff = true,
					jPos = 0;
				for (const [n2, v2] of descrById.get($i[descrId]).attr) {
					if (n === n2) {
						if (pos !== jPos++ || expr !== v2) {
							return $first;
						}
//todo нужно гарантировать порядок и значение
						$first = $i;
						ff = false;
//console.log(999, str, $i, n, n2, pos, jPos);
						break;
					}
					jPos++;
					if (beforeIdx[n2]) {// !== undefined
						if (beforeIdx[n2] !== getIdx($i, n2)) {
//console.log(4, str, $first);
							return $first;
						}
					} else if (!isBeforeAttr[n2]) {
//console.error(5, str, $first);
						return $first;
					}
				}
				if (ff) {
//console.log(6, str, $first);
					return $first;
				}
			}
//console.log(7, str, $first);
			return $first;
		}
		if (f) {
			break;
		}
	}
	throw check(new Error(`>>>Tpl if:ifGet$first:02 Invalid structure: if-command not found - str => "${str}"`), $src);
}
function ifGet$els(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos) {
	const firstStr = {};
	let $i = ifGet$first(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos, firstStr),
		$maybe = [];
	do {//так как функция для общего интерфейса, то в неё может придти коммент со вставки
		if ($i[isCmd]) {
			break;
		}
	} while ($i = $i.nextSibling);
//	if (!$i) {
//		!!такого не должно быть
//	}
	const nStr = getNextStr($i, firstStr.str),
		$els = nStr && get$els($i, descrById.get($i[descrId]).get$elsByStr, nStr) || [$i],
		beforeAttrCount = isSingle($i, firstStr.str);
	if (beforeAttrCount === -1) {
		return $els;
	}
	if (nStr) {
		$i = $els[$els.length - 1];
	}
	for ($i = $i.nextSibling; $i; $i = $i.nextSibling) {
//		if ($i.nodeType !== 1) {
		if (!$i[descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
			$maybe.push($i);
			continue;
		}
		if (!$i[isCmd]) {
			return $els;
		}
		let f = true,
			pos = 0;
		for (const n of descrById.get($i[descrId]).attr.keys()) {
			if (pos++ < beforeAttrCount) {
				continue;
			}
			const rc = reqCmd[n];
			if (rc.cmdName !== elseifCmdName && rc.cmdName !== elseCmdName) {
				break;
			}
//			if (pos++ !== beforeAttrCount) {
//				throw check(new Error(">>>Tpl if:ifGet$els:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//			}
			//!!*3
			f = false;
			const nStr = getNextStr($i, n),
				$iEls = nStr && get$els($i, descrById.get($i[descrId]).get$elsByStr, nStr) || [$i];
			if ($iEls.length === 1) {
				if ($maybe.length) {
					$els.push(...$maybe);
					$maybe = [];
				}
				$els.push($i);
				break;
			}
//todo тут вроде всё работает - проверить доказательство
			$i = $iEls[0].previousSibling;
			$maybe = [];
			while (!$i[descrId]) {
				$maybe.push($i);
				$i = $i.previousSibling;
			}
			if ($maybe.length) {
				$els.push(...$maybe);
				$maybe = [];
			}
			$i = $els[$els.push(...$iEls) - 1];
			break;
		}
		if (f) {
			return $els;
		}
	}
	return $els;
}
function isSingle($src, str) {//проверка на то что этот иф входит в конструккцию типа: <div _elseif="*" _if="эотот иф"
	let beforeAttrCount = 0,
		f = false;
	for (const n of descrById.get($src[descrId]).attr.keys()) {
		if (n === str) {
			return f && -1 || beforeAttrCount;
		}
		beforeAttrCount++;
		const cmdName = reqCmd[n].cmdName;
		if (cmdName === ifCmdName || cmdName === elseifCmdName || cmdName === elseCmdName || cmdName === forCmdName) {
			f = true;
		} else if (cmdName === incCmdName) {
//todo осмыслить про это
			const $els = get$els($src, descrById.get($src[descrId]).get$elsByStr, n);
			let $i = $els[$els.length - 2];
			while (!$i[isCmd]) {
				$i = $i.previousSibling;
			}
			f = descrById.get($i[descrId]).attr.has(str) || false;
		}
	}
	return f && -1 || beforeAttrCount;
}
async function makeShow(req, $i, str, isShow) {
	const nStr = getNextStr($i, str),
		$els = nStr && get$els($i, descrById.get($i[descrId]).get$elsByStr, nStr) || [$i],
		$elsLen = $els.length;
	if (isShow ? !$i.content : $i.content) {
		for (let i = 0; i < $elsLen; i++) {
			if ($els[i][descrId]) {
				return type_makeShow($els, i, $elsLen - 1);
			}
		}
	}
	const showFunc = isShow && show || hide;
	let firstTagIdx = -1;
	for (let i = 0; i < $elsLen; i++) {
		if ($els[i].nodeType === 8) {
			continue;
		}
		if (firstTagIdx === -1 && $els[i][descrId]) {
			firstTagIdx = i;
		}
		$els[i] = showFunc(req, $els[i]);
//todo
//if ($els[i].nodeType) {
//	alert(111);
//}
	}
	return type_makeShow(await Promise.all($els), firstTagIdx, $elsLen - 1);
}
function type_makeShow($els, firstTagIdx, lastIdx) {
	return [$els[lastIdx], $els[firstTagIdx]];
}
async function switchGet(req) {
	make$first(req, switchCmdName, caseCmdName, defaultCmdName);
	let f = true;
	for (const [n, v] of descrById.get(req.$src[descrId]).attr) {
		if (f) {
			if (n === req.str) {
				f = false;
			}
			continue;
		}
		const rc = reqCmd[n];
		if (rc.cmdName === caseCmdName) {
			const expression = await eval2(req, req.$src, true);
			req.reqCmd = rc;
//			req.reqCmd = {
//				cmdName: rc.cmdName,
//				cmd: req.reqCmd.cmd,
//				args: rc.args
//			};
////			req.reqCmd.cmdName = cmdName;
////			req.reqCmd.args = args;

//			req.$src = $first;
			req.str = n;
			req.expr = v;
			return ifGet(req, await eval2(req, req.$src, true), switchCmdName, caseCmdName, defaultCmdName, f => f === expression);
		}
	}
	throw check(new Error(">>>Tpl switch:01:Invalide structure: case-cmmand not found"), req);
}
