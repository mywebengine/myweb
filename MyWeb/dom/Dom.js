//import {incCache, incClearByKey} from "./cmd/inc.js";

import Config from "../../config/Config.js";
import Description from "../description/Description.js";
import Req from "../render/Req.js";
import Animation from "../render/Animation.js";
import Idx from "../description/Idx.js";
/*
import {createSrc, createDescr} from "../description/create.js";
import {getNewId, getSrcId, get$els, getNextStr} from "../description/descr.js";
import {getErr} from "../err/err.js";
import {loadingCount} from "../loading/loading.js";
*/
import {Q$i} from "./Q$i.js";
import {CloneNodeOn} from "./CloneNodeOn.js";

const $scroll = document.scrollingElement;

export default class Dom extends Description {
	preRender($i, isLinking) {// = my.rootElement) {//todo это не будет работать если после фора идет вставка на много тегов
		const $parent = $i.parentNode,
			$p = [],
			idAlias = new Map();//todo разнотипный мап!?
		do {
//////////////////////
			if ($i.firstChild !== null) {
				$i = $i.firstChild;
				continue;
			}
			if ($i.nodeName === "TEMPLATE" && $i.getAttribute(Config.hideName) !== null) {
				$p.push($i);
				$i = $i.content.firstChild;
				continue;
			}
			$i = this._preRenderCreate($i, idAlias, isLinking);
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
				$i = this._preRenderCreate($i, idAlias, isLinking);
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
	_preRenderCreate($e, idAlias, isLinking) {
		if ($e.nodeType !== 1) {
			return $e.nodeType === 3 ? this.replaceTextBlocks($e) : $e;
		}
		if (!isLinking) {
			this.createSrc($e);
			return $e;
		}
		const src = this._preRenderGetSrc($e, idAlias);
		if (!src.isCmd) {
			return $e;
		}
		for (const str of src.descr.attr.keys()) {
			const asOneIdx = $e.getAttribute(Config.asOneIdxName + str),
				idx = $e.getAttribute(Config.idxName + str);
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
					src.idx = new Idx([[!isNaN(idx) ? Number(idx) : idx]]);
					continue;
				}
				src.idx.set(str, !isNaN(idx) ? Number(idx) : idx);
			}
/*!!!!!!
			if (my.ctx.reqCmd.get(str).cmd.isAsOne === false) {
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
	_preRenderGetSrc($e, idAlias) {
		const dId = $e.getAttribute(Config.descrIdName);
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
	_preRenderCopy($f, fDescr, $i) {
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
			$src.parentNode.setAttribute(Config.textCmdName, "`" + text + "`");
			return $src;
		}
		const $t = my.document.createElement("span");
		$t.setAttribute(Config.textCmdName, "`" + text + "`");
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
		const $fr = my.document.createDocumentFragment();
		for (let i = 0; i < blocksLen; i++) {
			const b = blocks[i];
			if (b.expr) {
				const $i = $fr.appendChild(my.document.createElement("span"));
				setAttribute($i, Config.textCmdName, text.substring(b.begin, b.end));
				continue;
			}
			$fr.appendChild(my.document.createTextNode(text.substring(b.begin, b.end)));
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
	removeChild($e, req) {
//console.error("remC", my.ctx.srcBy$src.get($e), $e);
/*
//todo
if (!$e.parentNode) {
	console.error(req.sync, $e);
	alert(11)
}*/
		$e.parentNode.removeChild($e);
		$e.dispatchEvent(new CustomEvent(Config.removeEventName, Config.defEventInit));
		const rem = new Map(),
			srcBy$src = this.ctx.srcBy$src;
		let $i = $e;
		const $parent = null,
			$p = [];
		do {
//////////////////////
			const iSrc = srcBy$src.get($i);
//			if (iSrc !== undefined && !iSrc.descr.isCustomHtml) {
			if (iSrc !== undefined) {
				this.clearTag($i, iSrc, rem);
				if (iSrc.descr.isCustomHtml) {
					continue;
				}
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
//				if (iSrc.isCmd && $i.nodeName === "TEMPLATE" && $i.getAttribute(Config.hideName) !== null) {
				if (iSrc.isHide && iSrc.isCmd && $i.content.firstChild.firstChild !== null) {
					$p.push($i);
					$i = $i.content.firstChild.firstChild;
					continue;
				}
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
				if ($i.parentNode === $parent) {
					$i = null;
					break;
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					break;
				}
			} while(true);
		} while ($i !== null);
		if (rem.size === 0) {
			return;
		}
		requestIdleCallback(() => {
//console.time("rem");
			this.clearVars(rem);
//console.timeEnd("rem");
		}, Config.defIdleCallbackOpt);
	}
	//private
	clearTag($e, src, rem) {
//console.log($e, src.id, rem);
		const sId = src.id,
			descr = src.descr,
			dId = descr.id;
		this.ctx.$srcById.delete(sId);
		this.ctx.srcById.delete(sId);
		this.ctx.srcBy$src.delete($e);
//console.error("DEL", src.id, $e, src.isCmd, descr);
		if (!src.isCmd) {
//простые теги тоже могут быть с одним описанием
			descr.srcIds.delete(sId);
			if (descr.srcIds.size === 0) {
				this.ctx.descrById.delete(dId);
			}
			return;
		}
/*
		for (const [n, v] of descr.attr) {
			if (n !== Config.incCmdName) {
				continue;
			}
			const incKey = getIdx(src, n);
			if (incKey !== undefined && incCache.has(incKey)) {
				incClearByKey(incKey);
			}
		}
*/
		this.ctx.loadingCount.delete(sId);
		descr.srcIds.delete(sId);
		if (descr.sId === sId) {
			descr.sId = descr.srcIds.values().next().value;//todo REM! тут может быть undef - это при условии что все элемены цикла пошли на удаление (это при замене через inc) - и раз undef то в rem есть все элементы и первый изних очистит всё, а остальные нужно пропустить
		}
		const r = rem.get(dId);
		if (r) {
			r.add(sId);
			return;
		}
		rem.set(dId, new Set([sId]));
	}
	//private
	clearVars(rem) {
		const varIdByVar = this.ctx.varIdByVar,
			varById = this.ctx.varById,
			varIdByVarIdByProp = this.ctx.varIdByVarIdByProp,
			srcIdsByVarId = this.ctx.srcIdsByVarId,
			descrById = this.ctx.descrById,

			vIds = new Set(),
			sIds = new Set(),
			deletedVarId = new Set();//,
//			skipDelBySrcId = {};
		for (const [dId, s] of rem) {
			const d = descrById.get(dId);
			if (d === undefined) {//todo REM!
				continue;
			}
			for (const vId of d.varIds) {
				vIds.add(vId);
			}
//}
			for (const sId of s) {
				sIds.add(sId);
//				if (d.isAsOne && sId != d.sId) {
//todo
//console.error(123);
//alert(123);
//					skipDelBySrcId[sId] = true;
//				}
			}
		}
		for (const vId of vIds) {
			const s = srcIdsByVarId.get(vId);
			if (!s) {
				continue;
			}
			const vIdByProp = varIdByVarIdByProp.get(vId);
//			let f = false;
			for (const sId of sIds) {
//				if (skipDelBySrcId[sId]) {
//					f = true;
//				}
				if (s.has(sId)) {
//console.log(1, vId, sId, s.has(sId), s);
//alert(1);
					s.delete(sId);
				}
				if (vIdByProp === undefined) {
					continue;
				}
				for (const [pName, pId] of vIdByProp) {
					const propS = srcIdsByVarId.get(pId);
					if (propS !== undefined && propS.has(sId)) {
//console.log(vIdByProp, sId, pId);
						s.delete(sId);
						propS.delete(sId);
						if (propS.size === 0) {
							deletedVarId.add(pId);
							srcIdsByVarId.delete(pId);
							vIdByProp.delete(pName);
						}
					}
				}
			}
//			if (f) {
//				continue;
//			}
//console.log(2, vId, s);
			if (s.size === 0) {
				deletedVarId.add(vId);
				srcIdsByVarId.delete(vId);
				varIdByVar.delete(varById.get(vId));
				varById.delete(vId);
				if (vIdByProp !== undefined) {
					varIdByVarIdByProp.delete(vId);
//todo
					if (vIdByProp.size !== 0) {
						console.warn("должно быть пусто", vId, vIdByProp);
					}
//--					for (const pId of vIdByProp.values()) {
//						srcIdsByVarId.delete(pId);
//					}
				}
			} else if (vIdByProp !== undefined && vIdByProp.size === 0) {
				varIdByVarIdByProp.delete(vId);
			}
		}
		for (const [dId, s] of rem) {
			const d = descrById.get(dId);
			if (d === undefined) {//todo REM!
				continue;
			}
			for (const vId of deletedVarId) {
				d.varIds.delete(vId);
			}
			for (const sId of s) {
				d.srcIds.delete(sId);
//todo--
				if (d.sId === sId) {
					console.warn(22222222);
				}
			}
			if (d.srcIds.size === 0) {
				descrById.delete(dId);
			}
		}
	}
/*
	cloneNode(req, $e) {//во время клонирования описания не будут созданы - предназначен для клогнирования новго элемента (который ранее не рендерился)
		if ($e.nodeType === 11) {
			const $fr = my.document.createDocumentFragment();
			for ($e = $e.firstChild; $e !== null; $e = $e.nextSibling) {
				$fr.appendChild(cloneNode(req, $e));
			}
			return $fr;
		}
		if ($e.nodeType !== 1) {
			return $e.cloneNode();
		}
		const $n = $e.cloneNode(true),
			$on = $n.nodeName !== "TEMPLATE" || $n.getAttribute(Config.hideName) === null ? $n : $n.content.firstChild,
			src = this.ctx.srcBy$src.get(req.$src);
		for (const [n, v] of src.descr.attr) {
			if (n === req.str) {
				break;
			}
			const rc = this.ctx.reqCmd.get(n);
			if (rc.cmdName === Config.onCmdName) {
//console.log(111111, n, v, $on);
				rc.cmd.render(new Req($on, n, v, req.scope, req.sync));
			}
		}
		const l = this.ctx.loadingCount.get(src.id);
		if (l !== undefined) {
			this.ctx.loadingCount.set($n, l);
		}
		return $n;
	}*/
	q_cloneNode(req, sId, beginIdx, len) {//во время клонирования будут созданы описания
		sId = this.getSrcId(req.sync.local, sId);
		const srcBy$src = this.ctx.srcBy$src,
			$src = this.ctx.$srcById.get(sId),
			src = this.ctx.srcById.get(sId),
			nStr = this.getNextStr(src, req.str),
			$els = nStr !== "" ? this.get$els($src, src.descr.get$elsByStr, nStr) : [$src],
			$elsLen = $els.length,
			arr = new Array(len),
			on = [];
		let fSrc;
		for (let i = 0, f; i < $elsLen; i++) {
			const $i = $els[i];
			fSrc = srcBy$src.get($i);
			if (fSrc === undefined || !fSrc.isCmd) {
//todo--
//console.warn($i)
				continue;
			}
			break;
		}
		if (fSrc === undefined) {
			console.warn(">>>mw dom:q_cloneNode:", req, $els, beginIdx, len);
			throw this.getErr(new Error(`>>>mw dom:q_cloneNode: среди элементов для клонирования нет элемента с командой, такого не должно быть`), req.$src, req);
		}
		const fDescr = fSrc.descr;
		for (const [n, v] of fDescr.attr) {
			if (n === req.str) {
				break;
			}
			const rc = my.ctx.reqCmd.get(n);
			if (rc.cmdName === Config.onCmdName) {
				on.push(new CloneNodeOn(rc.cmd, n, v));
			}
		}
		const onLen = on.length,
			l = this.ctx.loadingCount.get(fSrc.id),
			baseAsOne = new Set(),
			asOneVal = new Array(len),
			aIt = fDescr.asOnes.keys();
		for (let i = aIt.next(); !i.done; i = aIt.next()) {
			if (i.value !== req.str) {
				continue;
			}
			for (i = aIt.next(); !i.done; i = aIt.next()) {
				baseAsOne.add(i.value);
			}
		}
		for (let i = 0; i < len; i++) {
			arr[i] = new Q$i(new Array($elsLen), i + beginIdx);
			asOneVal[i] = new Map();
		}
		for (let i, idx, j = 0; j < $elsLen; j++) {
			const $jArr = new Array(len),
				$j = $els[j];
			this.q_cloneNodeCreate($j, $j.nodeName !== "TEMPLATE" || $j.getAttribute(Config.hideName) === null, $jArr, len, asOneVal, 0, baseAsOne);
			this.q_cloneNodeCreateChildren($j, $jArr, len, asOneVal);
			for (i = 0; i < len; i++) {
				const arrI = arr[i],
					$i = arrI.$els[j] = $jArr[i],
					iSrc = srcBy$src.get($i);
				if (iSrc === undefined) {
					continue;
				}
				this.setIdx(iSrc, req.str, arrI.idx);
				if (onLen !== 0) {
					for (k = 0; k < onLen; k++) {
						const o = on[k];
						//todo не совсем уместно тут рундлерить - мы еще не подключили рендер
						//o.cmd.render(new Req($i, o.str, o.expr, req.scope, req.sync));
						o.cmd.render(this.createReq($i, o.str, o.expr, req.scope, req.sync));
					}
				}
				if (l !== undefined) {
//todo заменить $i на iSrc.id
//					this.ctx.loadingCount.set($i, l);
//todo не понятно как убирать филилинг с новых элементов
					this.ctx.loadingCount.set(iSrc.id, l);
				}
			}
		}
		return arr;
	}
	//private
	q_cloneNodeCreateChildren($i, $arr, $arrLen, asOneVal) {
		const $tP = new Array($arrLen),
			$parent = $i.parentNode,
			$p = [];
		for (let i = 0; i < $arrLen; i++) {
			$tP[i] = [];
		}
		do {
//////////////////////
			if ($i.firstChild !== null) {
				this.q_cloneNodeCreate($i = $i.firstChild, true, $arr, $arrLen, asOneVal, 1, null);
				continue;
			}
//			const iSrc = srcBy$src.get($i);
//			if (iSrc !== undefined && iSrc.isHide) {
			if ($i.nodeName === "TEMPLATE" && $i.getAttribute(Config.hideName) !== null) {
				$p.push($i);
				for (let i = 0; i < $arrLen; i++) {
					$tP[i].push($arr[i]);
				}
				this.q_cloneNodeCreate($i = $i.content.firstChild, false, $arr, $arrLen, asOneVal, 1, null);
				continue;
			}
			if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				this.q_cloneNodeCreate($i = $i.nextSibling, true, $arr, $arrLen, asOneVal, 2, null);
				continue;
			}
			do {
				$i = $i.parentNode;
//				if ($i.nodeType === 11) {
				if ($i.nodeType !== 11) {
					for (let i = 0; i < $arrLen; i++) {
						$arr[i] = $arr[i].parentNode;
					}
				} else {
					$i = $p.pop();
					for (let i = 0; i < $arrLen; i++) {
						$arr[i] = $tP[i].pop();
					}
				}
				if ($i.parentNode === $parent)  {
					$i = null;
					break;
				}
				if ($i.nextSibling !== null) {
					this.q_cloneNodeCreate($i = $i.nextSibling, true, $arr, $arrLen, asOneVal, 2, null);
					break;
				}
			} while (true);
		} while ($i !== null);
	}
	//private
	q_cloneNodeCreate($e, isNotHide, $arr, $arrLen, asOneVal, type, baseAsOne) {
		const src = this.ctx.srcBy$src.get($e);
		if (src === undefined) {
			if (type === 2) {
				for (let i = 0; i < $arrLen; i++) {
					$arr[i] = $arr[i].parentNode.appendChild($e.cloneNode());
				}
				return;
			}
			if (type === 1) {
				if (isNotHide) {
					for (let i = 0; i < $arrLen; i++) {
						$arr[i] = $arr[i].appendChild($e.cloneNode());
					}
					return;
				}
				for (let i = 0; i < $arrLen; i++) {
					$arr[i] = $arr[i].content.appendChild($e.cloneNode());
				}
				return;
			}
			for (let i = 0; i < $arrLen; i++) {
				$arr[i] = $e.cloneNode();
			}
			return;
		}
		const descr = src.descr,
			idx = src.idx,
			save = src.save,
			asOneIdx = src.asOneIdx;
		if (type === 2) {
			for (let i = 0; i < $arrLen; i++) {
				this.createSrc($arr[i] = $arr[i].parentNode.appendChild($e.cloneNode()), descr, new Map(asOneIdx), new Idx(src.idx)).save = save;
			}       
			if (asOneIdx !== null) {
				this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx);
			}
			return;
		}
		if (type === 1) {
			if (isNotHide) {
				for (let i = 0; i < $arrLen; i++) {
					this.createSrc($arr[i] = $arr[i].appendChild($e.cloneNode()), descr, new Map(asOneIdx), new Idx(src.idx)).save = save;
				}
				if (asOneIdx !== null) {
					this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx);
				}
				return;
			}
			for (let i = 0; i < $arrLen; i++) {
				this.createSrc($arr[i] = $arr[i].content.appendChild($e.cloneNode()), descr, new Map(asOneIdx), new Idx(src.idx)).save = save;
			}
			if (asOneIdx !== null) {
				this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx);
			}
			return;
		}
		for (let i = 0; i < $arrLen; i++) {
			this.createSrc($arr[i] = $e.cloneNode(), descr, new Map(asOneIdx), new Idx(src.idx)).save = save;
		}
		if (asOneIdx !== null) {
			this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, baseAsOne);
		}
	}
	//private
	q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx) {
		const srcBy$src = my.ctx.srcBy$src;
		for (let i = 0; i < $arrLen; i++) {
			const $i = $arr[i],
				iSrc = srcBy$src.get($i);
			for (const n of asOneIdx.keys()) {
				const curIdx = iSrc.asOneIdx.get(n),
					v = asOneVal[i].get(curIdx);
				if (v !== undefined) {
					setAsOneIdx(iSrc, n, v);
					continue;
				}
				const vv = this.getNewId();
				asOneVal[i].set(curIdx, vv)
				setAsOneIdx(iSrc, n, vv);
			}
		}
	}
//use in attr
/*не нужно из-за того что будет срабатывать только один раз - дальше кэш
// --- вообще то может пригодится если будет надобнасть получить значение которе еще не применено через раф - но пока не нужно
	getAttribute($e, name) {
		if ($e.nodeName === "INPUT") {
			switch (name) {
				case "value":
					return $e.value;
				case "checked":
					return $e.checked ? "checked" : "";
			}
		}
		return $e.getAttribute(name);
	}*/
	setAttribute($e, name, value) {
//todo атрибут нелльзя создать, если в нем есть некорректные символы - решение ниже слишком исбыточное, на мой взгляд
//		for (let i = name.indexOf("$"); i > 0; i = name.indexOf("$")) {
//			name = name.substr(0, i) + name.substr(i + 1);
//		}
		setAttributeValue($e, name, value);
		$e.setAttribute(name, value);
//!!! думаю что так можно
//	getDescrAttrsBy$scr($e)[name] = value;
	}
	setAttributeValue($e, name, value) {
		switch (name) {
			case "value":
				if ($e === document.activeElement && typeof $e.setSelectionRange === "function") {
					const pos = $e.selectionStart;
					$e.value = value;
//todo input type number console.log($e)
					if ($e.type === "text" || $e.type === "search") {
						$e.setSelectionRange(pos, pos);
					}
				} else {
					$e.value = value;
				}
			break;
			case "checked":
				$e.checked = !!value;
			break;
		}
	}
	//use in attr
	removeAttribute($e, name) {
		switch (name) {
			case "value":
				$e.value = "";
			break;
			case "checked":
				$e.checked = false;
			break;
		}
		$e.removeAttribute(name);
//!! см. выше
//		getDescrAttrsBy$scr($e).delete(name);
	}
	show(req, $e) {
		const src = my.ctx.srcBy$src.get($e);
		if (src !== undefined ? !src.isHide : ($e.nodeName !== "TEMPLATE" || $e.getAttribute(Config.hideName) === null)) {
			return;
		}
		req.sync.animations.add(new Animation(() => this._show(req, $e, src), req.sync.local, 0));//my.ctx.srcBy$src.get($e).id]));
	}
	//private
	_show(req, $e, src) {
		const $new = $e.content.firstChild;
		if (!$new || $new.nextSibling !== null) {
			//todo была ошибка, что $e ет в srcBy$src - повоторить не получается - эта шибка проявляется если Препаре даёт сбой, на данный момент не замечены проблемы в нём
			throw this.getErr(new Error(">>>mw show:01: Template element invalid structure on show function. <template>.content.childNodes.length must be only one element."), $e);
		}
//		if ($new.nodeType === 1 && my.ctx.srcBy$src.has($e)) {
		if (src !== undefined) {
			this.moveProps($e, src, $new, false);
		}
		if (req.$src === $e) {
			req.$src = $new;
		}
		$e.parentNode.replaceChild($new, $e);
	}
	hide(req, $e) {
		const src = my.ctx.srcBy$src.get($e);
		if (src !== undefined) {
			if (!src.isHide) {
				req.sync.animations.add(new Animation(() => this._hide($e, src), req.sync.local, src.id));
			}
			return;
		}
		if ($e.nodeType === 1 ? $e.nodeName === "TEMPLATE" && $e.getAttribute(Config.hideName) !== null : $e.nodeType !== 8) {
			req.sync.animations.add(new Animation(() => this._hide($e, src), req.sync.local, 0));
		}
	}
	//private
	_hide($e, src) {
		let $i = $e;
		const srcBy$src = my.ctx.srcBy$src,
			$new = my.document.createElement("template"),
			$parent = $i.parentNode,
			$p = [];
		$new.setAttribute(Config.hideName, "");
		do {
//////////////////////
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined) {
				const c = iSrc.cache;//это тоже самое что и $i.isCmd
				if (c !== null) {//todo тут можно удалять кэш только для дочерних элементов, но так как еще нужно удалить кэш для команд-после, то такой подход оправдан
					c.value = new Map();
					c.current = new Map();
				}
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
//				if ($i.nodeName === "TEMPLATE" && $i.getAttribute(Config.hideName) !== null) {//iSrc.isCmd) {// && $i.content.firstChild.firstChild !== null) {//проверку на кастом не делается из соображений экономичности
				if (iSrc.isHide && $i.content.firstChild.firstChild !== null) {
					$p.push($i);
					$i = $i.content.firstChild.firstChild;
					continue;
				}
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
//		if ($e.nodeType === 1) {
		if (src !== undefined) {
			this.moveProps($e, src, $new, true);
		}
		//!!переписывать req.$src в данном случаи не имет смысла
		$e.parentNode.replaceChild($new, $e);
		$new.content.appendChild($e);
	}
	//private
	moveProps($from, fromSrc, $to, isHide) {
//!!<-- show hide
//		const fromSrc = my.ctx.srcBy$src.get($from);
		fromSrc.isHide = isHide;
		my.ctx.$srcById.set(fromSrc.id, $to);
		my.ctx.srcById.set(fromSrc.id, fromSrc);
//		my.ctx.srcBy$src.delete($from);
		my.ctx.srcBy$src.set($to, fromSrc);

		$to[Config.p_topUrl] = $from[Config.p_topUrl];
		if (my.debugLevel === 0) {
			return;
		}
		//это какбы не нужно - мы же подготовленной структуре проходим
		if (!isHide) {
			return;
		}
		const attrs = $from.attributes,
			attrsLen = attrs.length;
		for (let i = 0; i < attrsLen; i++) {
//			const a = attrs.item(i);
			const a = attrs[i];
//		for (const a of $from.attributes) {
			setAttribute($to, a.name, a.value);
		}
	}
	is$hide($i) {
		do {
			if ($i === my.rootElement) {
				return false;
			}
			$i = $i.parentNode;
		} while ($i !== null);
		return true;
	}
	isAnimationVisible(animate) {
		return animate.viewedSrcId === 0 ? true : is$visible(my.ctx.$srcById.get(this.getSrcId(animate.local, animate.viewedSrcId)));
/*
		}
		for (const sId in animate.viewedSrcId) {
			if (!is$visibleBySrcId(sId)) {
				return false;
			}
		}
		return true;*/
	}
	is$visible($e) {
		while ($e.nodeType !== 1) {
			$e = $e.nextSibling;
			if ($e === null) {
				return true;
			}
		}
//		const b = $e.getBoundingClientRect();
//		if (b.width === 0 && b.height === 0) {
//			return false;
//		}
		const visibleK = 1 - Config.visibleScreenSize,
			left = $scroll.clientWidth * visibleK,
			right = $scroll.clientWidth + left * -1,
			top = $scroll.clientHeight * visibleK,
			bottom = $scroll.clientHeight + top * -1,
			b = $e.getBoundingClientRect();
//console.log(`!((${b.top} > ${bottom} || ${b.top} + ${b.height} < ${top}) || (b.left > right || b.left + b.width < left))`);
		return !((b.top > bottom || b.top + b.height < top) || (b.left > right || b.left + b.width < left));
	}
	setAsOneIdx(src, str, idx) {
		if (src.asOneIdx === null) {
			src.asOneIdx = new Map();
		}
		src.asOneIdx.set(str, idx);
//!!
		if (my.debugLevel === 0) {
			return;
		}
		const $src = my.ctx.$srcById.get(src.id),
			n = Config.asOneIdxName + str;
		$src.setAttribute(n, idx);
//		if ($src.nodeName === "TEMPLATE" && $src.getAttribute(Config.hideName) !== null) {// && $src.content.firstChild !== null) {//при q_cloneNode мы клонируем не рекурсивно, а это значит что нет внутренностей - они появятся позже
		if (src.isHide && $src.content.firstChild !== null) {//todo!!!!! тут проблема в цустановке атрибута из-за алгоритма q_clone - он не клонирует рекурсивно - todo после можно переделать алгоритм
			$src.content.firstChild.setAttribute(n, idx);
		}
	}
	getIdx(src, str) {
		if (src.idx !== null) {
			return src.idx.get(str);
		}
	}
	setIdx(src, str, idx) {
		if (src.idx === null) {
			src.idx = new Idx();
		}
		src.idx.set(str, idx);
//!!
		if (my.debugLevel === 0) {
			return;
		}
		const $src = my.ctx.$srcById.get(src.id),
			n = Config.idxName + str;
		$src.setAttribute(n, idx);
//		if ($src.nodeName === "TEMPLATE" && $src.getAttribute(Config.hideName) !== null) {
		if (src.isHide) {
			$src.content.firstChild.setAttribute(n, idx);
		}
	}
	getTopUrl(src, str) {
		if (str !== "") {
			const topUrl = this.getAttrTopUrl(src, str);//из-за if ($i[Config.p_topUrl]) { - так как это должэно работать только для робителей
			if (topUrl !== "") {
				return topUrl;
			}
		}
		const srcBy$src = my.ctx.srcBy$src;
		for (let $i = my.ctx.$srcById.get(src.id).parentNode; $i !== my.rootElement; $i = $i.parentNode) {
/*--
			if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
//console.log("getTopUrl", $src, str);
				return getTopUrl(my.ctx.$srcById.get(descrById.get(srcBy$src.get($e).descrId).sId)]);
			}*/
			const topUrl = this.getAttrTopUrl(srcBy$src.get($i));
			if (topUrl !== "") {
				return topUrl;
			}
			if ($i[Config.p_topUrl] !== undefined) {
				return $i[Config.p_topUrl];
			}
		}
		return "";
	}
	//private
	getAttrTopUrl(src, str) {
		if (!src.isCmd) {
			return "";
		}
		const nattr = src.descr.attr.keys();
		let topUrl = "";
		if (str !== "") {
			for (const n of nattr) {
				if (n === str) {
					break;
				}
				if (my.ctx.reqCmd.get(n).cmdName === Config.incCmdName) {//!!maybe todo пока работает только для inc
					topUrl = getIdx(src, n);
				}
			}
			return topUrl;
		}
		for (const n of nattr) {
			if (my.ctx.reqCmd.get(n).cmdName === Config.incCmdName) {//!!maybe todo пока работает только для inc
				topUrl = getIdx(src, n);
			}
		}
		return topUrl;
	}
};
