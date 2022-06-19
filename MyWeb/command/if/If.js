import config from "../../../config/config.js";
import kebabToCamelCase from "../../../str/kebabToCamelCase.js";
import Animation from "../../render/Animation.js";
import RenderRes from "../../render/RenderRes.js";
import Command from "../Command.js";

export default class If extends Command {
	constructor(my) {
		super(my);
		this.ifCmdName = config.ifCmdName;
		this.elseifCmdName = config.elseifCmdName;
		this.elseCmdName = config.elseCmdName;
	}
	render(req) {
//console.log("if", req);
//alert(1);
		this.make$first(req);
		return this.my.eval2(req, req.$src, true)
			.then(val => this.renderByVal(req, val));
/*
			.then(async val => {
				const r = await this.renderByVal(req, val);
				console.log("ifres", req.str, req.expr, val, r, req);
				alert(1);
				return r;
			});*/
	}
	q_render(req, arr, isLast) {
		let i = 0;
		while (isLast.has(i)) {
			i++;
		}
		const arrLen = arr.length;
		if (i === arrLen) {
			return null;
		}
		//так как иф при ку-рендере может быть только сингл, то можно не задумываться про то что в req
		return this.my.q_eval2(req, arr, isLast)
			.then(val => {
				const res = new Array(arrLen);
				do {
					const reqI = this.my.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync);
					this.make$first(reqI);
					res[i] = this.renderByVal(reqI, val[i]);
					while (isLast.has(++i));
					if (i === arrLen) {
						break;
					}
				} while (true);
				return res;
			});
	}
	get$first($src, str, expr, pos) {
		return this.if_get$first($src, str, expr, pos, null);
	}
	get$els($src, str, expr, pos) {
//console.error(ifCmdName, elseifCmdName, elseCmdName, $src, str, expr, pos);
//todo type
		const srcBy$src = this.my.context.srcBy$src,
			firstStr = {
				str: ""
			};
		let $i = this.if_get$first($src, str, expr, pos, firstStr);
		for (let iSrc = srcBy$src.get($i); iSrc !== undefined && !iSrc.isCmd && $i !== null; $i = $i.nextSibling, iSrc = srcBy$src.get($i)) {
			$i = $i.nextSibling;
		}
//		if (!$i) {
//			!!такого не должно быть
//		}
		const iSrc = srcBy$src.get($i),
			nStr = this.getNextStr(iSrc, firstStr.str),
			$els = nStr !== "" ? iSrc.get$els(nStr) : [$i],
			beforeAttrCount = this.isSingle($i, iSrc, firstStr.str);
		if (beforeAttrCount === -1) {
			return $els;
		}
		if (nStr !== "") {
			$i = $els[$els.length - 1];
		}
		let $maybe = [];
		for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
//			if ($i.nodeType !== 1) {
//--			if (!$i[p_descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
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
//			const iDescr = iSrc.descr;
			for (const n of iSrc.descr.attr.keys()) {
				if (pos++ < beforeAttrCount) {
					continue;
				}
				const rc = this.my.context.commandWithArgsByStr.get(n);
				if (rc.commandName !== this.elseifCmdName && rc.commandName !== this.elseCmdName) {
					break;
				}
//				if (pos++ !== beforeAttrCount) {
//					throw this.my.getError(new Error(">>>mw if:ifGet$els:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//				}
				//!!*3
				f = false;
//todo--if ($els.length > 20) {
//debugger
//}
				const nStr = this.getNextStr(iSrc, n),
//					$iEls = nStr !== "" ? get$els($i, iDescr.get$elsByStr, nStr) : [$i];
					$iEls = nStr !== "" ? iSrc.get$els(nStr) : [$i];
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
//				while (!$i[p_descrId]) {
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
//1) прдполагается что если первый скрыт то и все такие же скрыты - и наоборот
//2) !!: !$i[p_descrId] - это коммент, текст или когда template  и в нем скрыта тектовая нода
//3) в этом алгоритме нет проверки на эдентичность условий (предполлагается, что если они есть, то дожны быть правильными - так как такого рода ошибка может быть в серверном рендеренге - и это точно ошибка)
	//private
	async renderByVal(req, val, testFunc = f => f) {
		const srcBy$src = this.my.context.srcBy$src,
			pSrc = srcBy$src.get(req.$src.parentNode),
			pScope = pSrc !== undefined ? pSrc.scopeCache : {},
			//todo разобраться с парентом
//			pScope = pSrc !== undefined ? pSrc.scopeCache : null,
			reqI = this.my.createReq(req.$src, req.str, req.expr, srcBy$src.get(req.$src).setScope(pScope), req.sync);
		let isTrue = testFunc(val);
		if (isTrue) {
			const valName = reqI.commandWithArgs.args[0];
			if (valName !== undefined && valName !== "") {
				reqI.scope[config.p_target][kebabToCamelCase(valName)] = this.my.getReact(val);
			}
		}
		let [$last, $attr, attrStr] = this.makeShow(reqI, reqI.$src, reqI.str, isTrue);
		const beforeAttrCount = this.isSingle(reqI.$src, srcBy$src.get(reqI.$src), reqI.str);
//console.log(1, isTrue, $last, $attr, str, beforeAttrCount, req, ifCmdName, elseifCmdName, elseCmdName);
		if (beforeAttrCount === -1) {
//			return new RenderRes(!isTrue, $attr, $last);
			return new RenderRes(attrStr === "", $attr, $last, $attr, attrStr);//если attrStr === "" - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запщен рендер в афтерАнимации
		}
		for (let $i = $last.nextSibling; $i !== null; $i = $i.nextSibling) {
//			if ($i.nodeType !== 1) {
//			if (!$i[p_descrId]) {//это коммент, текст или когда template и в нем скрыта тектовая нода
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
				const rc = this.my.context.commandWithArgsByStr.get(n);
//console.log(req.str, iSrc, $i, n, rc.commandName, elseifCmdName, elseCmdName)
				if (rc.commandName !== this.elseifCmdName && rc.commandName !== this.elseCmdName) {
					break;
				}
//				if (pos++ !== beforeAttrCount) {
//					throw this.my.getError(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
//				}
				const reqI = this.my.createReq($i, n, v, iSrc.setScope(pScope), req.sync);
				//!!*3
				f = false;
				if (isTrue) {//это означает, что ранее был показан блок и текущий нужно скрыть, и далее рендерить по ранее заданному $attr
//					if ($i.nodeName === "TEMPLATE") {
//						$last = $i;
//						break;
//					}
					[$last] = this.makeShow(reqI, $i, n, false);
//console.log(2, $last, $attr, attrStr);
					$i = $last;
					break;
				}
				if (rc.commandName === this.elseCmdName) {
					[$last, $attr, attrStr] = this.makeShow(reqI, $i, n, true);
//console.log(3, $last, $attr, attrStr);
					$i = $last;
					break;
				}
				//это elsif
				val = await this.my.eval2(reqI, $i, true);
				if (isTrue = testFunc(val)) {
					const valName = reqI.commandWithArgs.args[0];
					if (valName !== undefined && valName !== "") {
						reqI.scope[config.p_target][kebabToCamelCase(valName)] = this.my.getReact(val);
					}
					[$last, $attr, attrStr] = this.makeShow(reqI, $i, n, true);
//console.log(4, $last, $attr, attrStr);
					$i = $last;
					val = true;
					break;
				}
				[$last, $attr, attrStr] = this.makeShow(reqI, $i, n, false);
//console.log(5, f, $i, $last, $attr, attrStr);
				$i = $last;
//				val = false;
				break;
			}
			if (f) {
				break;
			}
		}
		return new RenderRes(attrStr === "", $attr, $last, $attr, attrStr);//если attrStr === "" - это значит, что что-то не показывается, а если нужно рендереить вглубь, то был запщен рендер в афтерАнимации
	}
	//private
	make$first(req) {
		let pos = 0;
		for (const n of this.my.context.srcBy$src.get(req.$src).descr.attr.keys()) {
			if (n === req.str) {
				break;
			}
			pos++;
		}
		const $first = this.if_get$first(req.$src, req.str, req.expr, pos, null);
		if (this.my.context.commandWithArgsByStr.get(req.str).commandName === this.ifCmdName) {
			req.$src = $first;
			return;
		}
		for (const [n, v] of this.my.context.srcBy$src.get($first).descr.attr) {
			const rc = this.my.context.commandWithArgsByStr.get(n);
			if (rc.commandName === this.ifCmdName) {
				req.commandWithArgs = rc;
				req.str = n;
				req.expr = v;
				req.$src = $first;
				return;
			}
		}
	}
	//private
	if_get$first($src, str, expr, pos, firstStr) {
		const isStrIf = str !== "" && this.my.context.commandWithArgsByStr.get(str).commandName === this.ifCmdName,
			srcBy$src = this.my.context.srcBy$src;
		for (let $i = $src; $i !== null; $i = $i.previousSibling) {
//			if ($i.nodeType !== 1) {
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
				const rc = this.my.context.commandWithArgsByStr.get(n);
				if (rc.commandName === config.incCmdName) {
					l = 0;
					continue;
				}
				l++;
				if (isStrIf) {
					if (n !== str) {
						continue;
					}
				} else if (rc.commandName === this.elseifCmdName || rc.commandName === this.elseCmdName) {
					if (l !== 1) {
						throw this.my.getError(new Error(">>>mw if:make$first:01 Invalid structure: elseif and else command can be first in this attributes"), $i);
					}
					f = false;
					break;
				} else if (rc.commandName !== this.ifCmdName) {// || (isStrIf && n !== str)) {
					continue;
				}
				if (firstStr !== null) {
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
							rc = this.my.context.commandWithArgsByStr.get(n);
						if (rc.commandName === config.foreachCmdName) {
							forBefore.push([n, iSrc.getIdx(n)]);
						}
					}
					if (i.value !== str) {
						continue;
					}
					for (i = attrIt.next(); !i.done; i = attrIt.next()) {
						const n = i.value,
							rc = this.my.context.commandWithArgsByStr.get(n);
						if (forStr === "" && rc.commandName === config.incCmdName) {
							if (iSrc.getIdx(n) !== undefined) {
								incCount++;
							}
						} else if (incCount === 0 && forStr === "" && rc.commandName === config.foreachCmdName) {
							forIdx = iSrc.getIdx(n);
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
					throw this.my.getError(new Error(">>>mw if:make$first:02 Invalid structure: inc_begin not found"), $src);
				}
				if (forStr !== "") {
					const forBeforeLen = forBefore.length;
					for (let $j = $i.previousSibling; $j !== null; $j = $j.previousSibling) {
						const jSrc = srcBy$src.get($j);
						if (jSrc === undefined || !jSrc.isCmd) {
							continue;
						}
						const jdx = jSrc.getIdx(forStr);
						if (jdx === undefined || forIdx < jdx) {
							return $i;
						}
						if (forBeforeLen > 0) {
							for (let i = 0; i < forBeforeLen; i++) {
								const b = forBefore[i];
								if (jSrc.getIdx(b[0]) !== b[1]) {
									return $i;
								}
							}
						}
						$i = $j;
						forIdx = jdx;
//--						if (jdx === "0") {
//							$i = $j;
//						}
					}
					return $i;
				}
				return $i;
			}
			if (f) {
				break;
			}
		}
		throw this.my.getError(new Error(`>>>mw if:ifGet$first:02 Invalid structure: if-command not found - str => "${str}"`), $src);
	}
	//private
	isSingle($src, src, str) {//проверка на то что этот иф входит в конструккцию типа: <div _elseif="*" _if="эотот иф"
		let beforeAttrCount = 0,
			f = false;
		for (const n of src.descr.attr.keys()) {
			if (n === str) {
				break;
			}
			const nn = this.my.context.commandWithArgsByStr.get(n).commandName;
			if (this.ifCmdName === config.switchCmdName && nn === config.switchCmdName) {
				continue;
			}
			beforeAttrCount++;
			switch (nn) {
				case this.ifCmdName:
				case config.elseifCmdName:
				case config.elseCmdName:
				case config.foreachCmdName:
//				case config.switchCmdName:
				case config.caseCmdName:
				case config.defaultCmdName:
//					beforeAttrCount++;
					f = true;
//console.log(333333, $src, str, n, this.my.context.descrById.get($src[p_descrId]).attr);
				break;
				case config.incCmdName:
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
//					beforeAttrCount++;
					f = false;
				break;
			}
		}
		return f ? -1 : beforeAttrCount;
	}
	//private
	makeShow(req, $i, str, isShow) {
		const srcBy$src = this.my.context.srcBy$src,
			src = srcBy$src.get($i),
			nStr = this.getNextStr(src, str),
			$els = nStr !== "" ? src.get$els(nStr) : [$i],
			$elsLen = $els.length,
			$last = $els[$elsLen - 1];
		if (!isShow) {
			for (let i = 0; i < $elsLen; i++) {
//				$i = $els[i];
//				if ($i.nodeType === 1) {
//					this.my.hide(req, $i);
//				}
				this.my.hide(req, $els[i]);
			}
			return [$last, null, ""];
		}
		let $attr = null,
			attrStr = "",
			isNotAnimations = true;
		for (let i = 0; i < $elsLen; i++) {
			$i = $els[i];
			const iSrc = srcBy$src.get($i);
//			if ($i.nodeType !== 1) {
			if (iSrc === undefined) {
				if ($i.nodeType === 1) {
					this.my.show(req, $i);
					isNotAnimations = false;
				}
				continue;
			}
			if ($attr === null) {
				$attr = $i;
				attrStr = str;
			}
//			if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
			if (iSrc.isHide) {
				this.my.show(req, $i);
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
				this.my.show(req, $i);
				isNotAnimations = false;
			}
		}*/
		if (isNotAnimations) {
			return [$last, $attr, attrStr];
		}
		const sId = srcBy$src.get($attr).id;
		req.sync.afterAnimations.add(new Animation(() => this.my.renderTag(this.my.context.$srcById.get(sId), req.scope, str, req.sync), req.sync.local, 0));
		return [$last, null, ""];
	}
	//private
	getNextStr(src, str) {
		return str !== config.switchCmdName ? src.getNextStr(str) : src.getNextStr(src.getNextStr(str));
	}
};
