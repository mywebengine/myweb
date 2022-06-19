import Cache from "../../cache/Cache.js";
import config from "../../config/config.js";
import Command from "../command/Command.js";
import MyWeb from "../MyWeb.js";
import Descr from "./Descr.js";
import Get$elsByStr from "./Get$elsByStr.js";
import Src from "./Src.js";

const null_get$els = Command.prototype.get$els;

export default class CreateDom extends MyWeb {
	createSrc($e, descr, asOneIdx, idx) {//вызов этой функции должен быть неприменнол на есть документ слева направо, если это фрагмент, то нужно обработать края
		const sId = this.getNewId(),
			isHide = $e.getAttribute(config.hideName) !== null;
//!!!
		if (descr === undefined) {
//		if (1) {
			descr = this.createDescr($e, sId);
			const src = descr.attr !== null ? new Src(this, sId, descr, true, isHide, null, null, new Cache()) : new Src(this, sId, descr, false, isHide, null, null, null);
//if (descr.asOnes !== null && asOneIdx !== undefined) {src.asOneIdx = asOneIdx;}
			this.context.$srcById.set(sId, $e);
			this.context.srcById.set(sId, src);
			this.context.srcBy$src.set($e, src);
//!!если мы сделаем это, то в Инке в препаре будет вызыватьс яэто место и мы потеряем старые асОне
//			if (descr.asOnes !== null) {
//				src.asOneIdx = new Map();
//				src.idx = new Map();
//				for (const str of descr.asOnes) {
//					src.setAsOneIdx(str, this.getNewId());
//					src.setIdx(str, 0);
//				}
//			}
			return src;
		}
		descr.srcIds.add(sId);//пока используется для получения .sId при удалении and prepareParam
		const src = descr.attr !== null ? new Src(this, sId, descr, true, isHide, asOneIdx, idx, new Cache()) : new Src(this, sId, descr, false, isHide, null, null, null);
		this.context.$srcById.set(sId, $e);
		this.context.srcById.set(sId, src);
		this.context.srcBy$src.set($e, src);
		if (!src.isCmd) {
			return src;
		}
/*
		for (const [n, v] of descr.attr) {
			if (n !== incCmdName) {
				continue;
			}
			const incKey = src.getIdx(n);
			if (incKey !== undefined) {
				incCache.get(src.getIdx(n)).counter++;
			}
		}*/
//		moveLoading($e, sId);
		return src;
	}
	createDescr($e, sId) {
		const id = this.getNewId(),
			attr = this.createAttr($e);
		if (attr.size === 0) {
			const descr = new Descr(id, sId, null, null);
			this.context.descrById.set(id, descr);
			return descr;
		}
		const descr = new Descr(id, sId, attr, new Set());
		let pos = 0;
		for (const [str, expr] of attr) {
			const rc = this.context.commandWithArgsByStr.get(str);
			if (rc.command.get$els !== null_get$els) {
				if (descr.get$elsByStr === null) {
					descr.get$elsByStr = new Map([[str, new Get$elsByStr(/*rc.command, str, */expr, pos)]]);
				} else {
					descr.get$elsByStr.set(str, new Get$elsByStr(/*rc.command, str, */expr, pos));
				}
			}
			pos++;
			if (rc.command.isCustomHtml === true && descr.isCustomHtml === false) {
				descr.isCustomHtml = true;
			}
			if (rc.command.isAsOne === true) {
				if (descr.asOnes === null) {
					descr.asOnes = new Set();
				}
				descr.asOnes.add(str);
			}
		}
		this.context.descrById.set(id, descr);
		return descr;
	}
/*
	moveLoading($e, sId) {
		const l = this.context.loadingCount.get($e);
		if (l === undefined) {
			return;
		}
		this.context.loadingCount.set(sId, l);
		this.context.loadingCount.delete($e);
}*/
	//private
	createAttr($e) {
		const attr = new Map(),
			attrs = $e.attributes,
			attrsLen = attrs.length;
		for (let i = 0; i < attrsLen; i++) {
////			const a = attrs.item(i);
			const a = attrs[i];
//todo	for (const a of $e.attributes) {
			if (this.addStrToCommandWithArgsIfThatCommend(a.name)) {
				attr.set(a.name, a.value);
			}
		}
		return attr;
	}
	preRender($i, isLinking) {// = this.context.rootElement) {//todo это не будет работать если после фора идет вставка на много тегов
		const $parent = $i.parentNode,
			$p = [],
			idAlias = new Map();//todo разнотипный мап!?
		do {
//////////////////////
			if ($i.nodeType === 1) {
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
				if ($i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {
					$p.push($i);
					$i = $i.content.firstChild;
					continue;
				}
				$i = this.preRenderCreate($i, idAlias, isLinking);
			} else if ($i.nodeType === 3) {
				$i = this.replaceTextBlocks($i);
			}
			if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				continue;
			}
			do {
				$i = $i.parentNode;
				if ($i.nodeType === 11) {
					$i = $p.pop();
				}
				$i = this.preRenderCreate($i, idAlias, isLinking);
				if ($i.parentNode === $parent) {
					$i = null;
					break;
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					break;
				}
			} while (true);
		} while ($i !== null);
	}
	//private
	preRenderCreate($e, idAlias, isLinking) {
		/*--if ($e.nodeType !== 1) {
			return $e.nodeType === 3 ? this.replaceTextBlocks($e) : $e;
		}*/
		if (!isLinking) {
			this.createSrc($e);
			return $e;
		}
		const src = this.preRenderGetSrc($e, idAlias);
		if (!src.isCmd) {
			return $e;
		}
		for (const str of src.descr.attr.keys()) {
			const asOneIdx = $e.getAttribute(config.asOneIdxName + str),
				idx = $e.getAttribute(config.idxName + str);
			if (asOneIdx !== null) {
				const aIdx = idAlias.get(asOneIdx);
				if (aIdx === undefined) {
					const nIdx = this.getNewId();
					idAlias.set(asOneIdx, nIdx);
					if (src.asOneIdx === null) {
						src.asOneIdx = new Map([[str, nIdx]]);
					} else {
						src.asOneIdx.set(str, nIdx);
					}
				} else if (src.asOneIdx === null) {
					src.asOneIdx = new Map([[str, aIdx]]);
				} else {
					src.asOneIdx.set(str, aIdx);
				}
			}
			if (idx !== null) {
				if (src.idx === null) {
					src.idx = new Map([[!isNaN(idx) ? Number(idx) : idx]]);
					continue;
				}
				src.idx.set(str, !isNaN(idx) ? Number(idx) : idx);
			}
/*!!!!!!
			if (this.context.commandWithArgsByStr.get(str).command.isAsOne === false) {
				continue;
			}
			const $from = $i;
			for (let $j = $i.nextSibling; $j !== null; $j = $j.nextSibling) {
				if ($j.nodeType !== 1) {
					continue;
				}
				if (get$asOneIdx($j, str) !== asOneIdx && !(get$Idx($j, str) > 0)) {
					break;
				}
				this._preRenderCopy($from, iDescr, $i = $j);
			}
			break;*/
		}
		return $e;
	}
	//private
	preRenderGetSrc($e, idAlias) {
		const dId = $e.getAttribute(config.descrIdName);
		if (dId === null) {
			return this.createSrc($e);
		}
		const descr = idAlias.get(dId);
		if (descr !== undefined) {
			return this.createSrc($e, descr, null, null);
		}
		const src = this.createSrc($e, this.createDescr($e, 0), null, null);
		src.descr.sId = src.id;
		idAlias.set(dId, src.descr);
		return src;
	}
/*
	//private
	preRenderCopy($f, fDescr, $i) {
		const $parent = $f.parentNode,
			$p = [],
			$fP = [];
		do {
			if ($i.nodeType === 1) {
//console.log($f, $i);
				this.createSrc($i, fDescr);
			}
//////////////////////
			//todo команда или нет?
			if ($i.nodeName === "TEMPLATE" && $i.content.firstChild.firstChild !== null) {
				$p.push($i);
				$i = $i.content.firstChild;
			}
			if ($f.nodeName === "TEMPLATE" && $f.content.firstChild.firstChild !== null) {
				$fP.push($f);
				$f = $f.content.firstChild;
			}
			if ($i.firstChild !== null) {
				$i = $i.firstChild;
				$f = $f.firstChild;
				continue;
			}
			if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				while ($f.nextSibling !== null) {
					$f = $f.nextSibling;
				}
				continue;
			}
			do {
				$i = $i.parentNode;
				if ($i.parentNode === $parent) {
//					$i = null;
					$f = null;
					break;
				}
				if ($i.parentNode.nodeType === 11) {
					$i = $p.pop();
					if ($i.parentNode === $parent) {
//						$i = null;
						$f = null;
						break;
					}
				}
				$f = $f.parentNode;
				if ($f.parentNode.nodeType === 11) {
					$f = $fP.pop();
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					while ($f.nextSibling !== null) {
						$f = $f.nextSibling;
					}
					break;
				}
			} while (true);
		} while ($f);
	}*/
	//private
	replaceTextBlocks($src) {
		const text = $src.textContent;
		if (text.indexOf("${") === -1 || $src.parentNode.nodeName === "SCRIPT") {
			return $src;
		}
		if ($src.nextSibling === null && $src.previousSibling === null) {
			$src.parentNode.setAttribute(config.textCmdName, "`" + text + "`");
			return $src;
		}
		const $t = this.context.document.createElement("span");
		$t.setAttribute(config.textCmdName, "`" + text + "`");
		$src.parentNode.replaceChild($t, $src);
		this.createSrc($t);
		return $t;
	}
	joinText($i) {
		$i = $i.firstChild;
		for (let $next; $i !== null; $i = $i.nextSibling) {
			while ($i.nodeType === 3 && ($next = $i.nextSibling) !== null && $next.nodeType === 3) {
				$i.textContent += $e.removeChild($next).textContent;
			}
		}
	}
/*--
	//private
	replaceTextBlocks($src) {//, scope) {//когда рендерится - то он делает это в фрагменте и родители выше фрагмента не доступны
//		if ($src.isTextRendered) {
//			return $src;
//		}
		const text = $src.textContent,
			blocks = this.getMustacheBlocks(text),
			blocksLen = blocks.length;
		if (!blocksLen || (blocksLen === 1 && !blocks[0].expr)) {
//			$src.isTextRendered = true;
			return $src;
		}
		const $fr = this.context.document.createDocumentFragment();
		for (let i = 0; i < blocksLen; i++) {
			const b = blocks[i];
			if (b.expr) {
				const $i = $fr.appendChild(this.context.document.createElement("span"));
				setAttribute($i, config.textCmdName, text.substring(b.begin, b.end));
				continue;
			}
			$fr.appendChild(this.context.document.createTextNode(text.substring(b.begin, b.end)));
//				.isTextRendered = true;
		}
		const $last = $fr.lastChild;
		$src.parentNode.replaceChild($fr, $src);
		return $last;
	}
	//private
	getMustacheBlocks(text) {
		const textLen = text.length,
			blocks = [];
		for (let begin = 0, i = 0; i < textLen;) {
			i = text.indexOf("{{", i);
			if (i === -1) {
				blocks.push(type_mustacheBlock(begin, textLen, false));
				break;
			}
			let j = text.indexOf("}}", i);
			if (j === -1) {
				blocks.push(type_mustacheBlock(begin, textLen, false));
				break;
			}
			while (text.indexOf("}}", j + 1) === j + 1) {
				j++;
			}
			if (i !== begin) {
				blocks.push(type_mustacheBlock(begin, i, false));
			}
			blocks.push(type_mustacheBlock(i + 2, j, true));
			i = begin = j + 2;
		}
		return blocks;
	}
	type_mustacheBlock(begin, end, expr) {
		return {
			begin,
			end,
			expr
		};
	}*/
};
