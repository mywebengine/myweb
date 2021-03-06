import {cache, type_cacheValue, type_cacheCurrent} from "./cache.js";
import {Tpl_doc, Tpl_$src, p_srcId, p_descrId, p_localId, p_topURL, p_isCmd, incCmdName, textCmdName, idxName, localIdName} from "./config.js";
import {$srcById, descrById, createSrc, getAttrItAfter} from "./descr.js";
import {varIdByVar, varById, srcIdSetByVarId, varIdByVarIdByProp} from "./proxy.js";
import {reqCmd} from "./req.js";
import {addAnimation, check} from "./util.js";

export function preRender($e) {// = Tpl_$src) {
	const d = createSrc($e);
	if ($e.nodeName === "TEMPLATE") {
		return d;
	}
	for (let $iD, iD, $i = $e.firstChild; $i; $i = $i.nextSibling) {
		switch ($i.nodeType) {
			case 1:
				if (iD && iD.isAsOne) {
//todo это не будет работать если после фора идет вставка на много тегов
					let f = true;
					for (const str of iD.attr.keys()) {
						if (reqCmd[str].cmd.isAsOne) {
							if (getIdx($i, str) > 0) {
								f = false;
								_preRender($i, $iD);//тут нужно переделать
							}
							break;
						}
					}
					if (f) {
						iD = preRender($i);
					}
				} else {
					iD = preRender($i);
				}
				$iD = $i;
			break;
			case 3:
				let $j = $i.previousSibling;
				$i = replaceTextBlocks($i);
				if (!$j) {
					$j = $i.parentNode.firstChild;
				}
				while ($j !== $i && ($j = $j.nextSibling)) {
					if ($j.nodeType === 1) {
						createSrc($j);
					}
				}
			break;
		}
	}
	return d;
}
function _preRender($e, $d) {
	createSrc($e, $d[p_descrId]);
	if ($e.nodeName === "TEMPLATE") {
		return;
	}
	for ($e = $e.firstChild, $d = $d.firstChild; $e; $e = $e.nextSibling, $d = $d.nextSibling) {
		if ($e.nodeType === 1) {
			_preRender($e, $d);
		}
	}
}
export function replaceTextBlocks($src) {//, scope) {//когда рендерится - то он делает это в фрагменте и родители выше фрагмента не доступны
//	if ($src.isTextRendered) {
//		return $src;
//	}
	const text = $src.textContent,
		blocks = getMustacheBlocks(text),
		blocksLen = blocks.length;
	if (!blocksLen || (blocksLen === 1 && !blocks[0].expr)) {
//		$src.isTextRendered = true;
		return $src;
	}
	const $fr = Tpl_doc.createDocumentFragment();
	for (let i = 0; i < blocksLen; i++) {
		const b = blocks[i];
		if (b.expr) {
			const $i = $fr.appendChild(Tpl_doc.createElement("span"));
			setAttribute($i, textCmdName, text.substring(b.begin, b.end));
			continue;
		}
		$fr.appendChild(Tpl_doc.createTextNode(text.substring(b.begin, b.end)));
//			.isTextRendered = true;
	}
	const $last = $fr.lastChild;
	$src.parentNode.replaceChild($fr, $src);
	return $last;
}
export function getMustacheBlocks(text) {
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
function type_mustacheBlock(begin, end, expr) {
	return {
		begin,
		end,
		expr
	};
}
export function removeChild($e, isClearLocalScope) {
//console.error("remC", $e[p_srcId], $e);
	$e.parentNode.removeChild($e);
	const rem = new Map();
	let $i = $e,
		$p = [];
	do {
		const iId = $i[p_srcId];
//console.log(iId, $i);
//alert(1);
		if (iId) {
			clearTag($i, iId, isClearLocalScope, rem);
		}
		if ($i.firstChild) {
			$i = $i.firstChild;
			continue;
		}
		if ($i.content && $i[p_isCmd] && $i.content && $i.content.firstChild.firstChild) {
			$p.push($i);
			$i = $i.content.firstChild.firstChild;
			continue;
		}
		if (!$i.parentNode) {
			break;
		}
		if ($i.nextSibling) {
			$i = $i.nextSibling;
			continue;
		}
		while ($i = $i.parentNode) {
			if ($i.nodeType === 11) {
				$i = $p.pop();
			}
			if (!$i.parentNode) {
				$i = null;
				break;
			}
			if ($i.nextSibling) {
				$i = $i.nextSibling;
				break;
			}
		}
	} while ($i);
	if (rem.size) {
		requestIdleCallback(() => {
//console.time("rem");
			_clearTag(rem);
//console.timeEnd("rem");
		});
	}
}
function clearTag($e, sId, isClearLocalScope, rem) {
	delete $srcById[sId];
	if (!$e[p_isCmd]) {
		descrById.delete($e[p_descrId]);
		return;
	}
//console.error("DEL", sId, $e, $e[p_isCmd]);
	delete cache[sId];
	const dId = $e[p_descrId],
		d = descrById.get(dId);
	d.srcIdSet.delete(sId);
	if (d.sId === sId) {
		d.sId = d.srcIdSet.values().next().value;
	}
	if (isClearLocalScope) {
		clearScope($e);
	}
	const r = rem.get(dId);
	if (r) {
		r.add(sId);
		return;
	}
	rem.set(dId, new Set([sId]));
}
function _clearTag(rem) {
	const vIdSet = new Set(),
		sIdSet = new Set(),
		deletedVarId = new Set();//,
//		skipDelBySrcId = {};
	for (const [dId, s] of rem) {
		const d = descrById.get(dId);
		for (const vId of d.varIdSet) {
			vIdSet.add(vId);
		}
		for (const sId of s) {
			sIdSet.add(sId);
//			if (d.isAsOne && sId != d.sId) {
//todo
//console.error(123);
//alert(123);
//				skipDelBySrcId[sId] = true;
//			}
		}
	}
	for (const vId of vIdSet) {
		const s = srcIdSetByVarId.get(vId);
		if (!s) {
			continue;
		}
		const vIdByProp = varIdByVarIdByProp[vId];
//		let f = false;
		for (const sId of sIdSet) {
//			if (skipDelBySrcId[sId]) {
//				f = true;
//			}
			if (s.has(sId)) {
//console.log(1, vId, sId, s.has(sId), s);
//alert(1);
				s.delete(sId);
			}
			if (!vIdByProp) {
				continue;
			}
			for (const [pName, pId] of vIdByProp) {
				const propS = srcIdSetByVarId.get(pId);
				if (propS && propS.has(sId)) {
//console.log(vIdByProp, sId, pId);
					s.delete(sId);
					propS.delete(sId);
					if (!propS.size) {
						deletedVarId.add(pId);
						srcIdSetByVarId.delete(pId);
						vIdByProp.delete(pName);
					}
				}
			}
		}
//		if (f) {
//			continue;
//		}
//console.log(2, vId, s);
		if (!s.size) {
			deletedVarId.add(vId);
			srcIdSetByVarId.delete(vId);
			const v = varById[vId];
			delete varById[vId];
			varIdByVar.delete(v);
			if (vIdByProp) {
				delete varIdByVarIdByProp[vId];
//todo
				if (vIdByProp.size) {
					console.warn("должно быть пусто", vId, vIdByProp);
				}
//--				for (const pId of vIdByProp.values()) {
//					srcIdSetByVarId.delete(pId);
//				}
			}
		} else if (vIdByProp && !vIdByProp.size) {
//console.warn(11111, vId, vIdByProp);
			delete varIdByVarIdByProp[vId];
		}
	}
	for (const [dId, s] of rem) {
		const d = descrById.get(dId);
		for (const vId of deletedVarId) {
			d.varIdSet.delete(vId);
		}
		for (const sId of s) {
			d.srcIdSet.delete(sId);
//todo--
			if (d.sId === sId) {
				console.warn(22222222);
			}
		}
		if (!d.srcIdSet.size) {
			descrById.delete(dId);
		}
	}
}
//use in attr
export function setAttribute($e, name, value) {
//todo атрибут нелльзя создать, если в нем есть некорректные символы - решение ниже слишком исбыточное, на мой взгляд
//	for (let i = name.indexOf("$"); i > 0; i = name.indexOf("$")) {
//		name = name.substr(0, i) + name.substr(i + 1);
//	}
//console.log($e);
	$e.setAttribute(name, value);
//!!! думаю что так можно
//	getDescrAttrsBy$scr($e)[name] = value;
	switch (name) {
		case "value":
//			if (value) {
				$e.value = value;
//			} else {
//				$e.value = undefined;
//			}
		break;
		case "checked":
			$e.checked = value !== "false";
		break;
	}
}
//use in attr
export function removeAttribute($e, name) {
	$e.removeAttribute(name);
//!! см. выше
//	getDescrAttrsBy$scr($e).delete(name);
	switch (name) {
		case "value":
			$e.value = "";
		break;
		case "checked":
			$e.checked = false;
		break;
	}
}
/*
function getAttribute($e, name) {
	return getDescrAttrsBy$scr($e).get(name) || null;
}*/

export function show(req, $e) {
//console.log("show", $e);
//	if ($e.nodeName !== "TEMPLATE") {
	if (!$e.content) {
		return $e;
	}
	const $new = $e.content.firstChild;
	if (!$new || $new.nextSibling) {
		throw check(new Error(">>>Tpl show:01: Template element invalid structure on show function. <template>.content.childNodes.length must be only one element."), $e);
	}
	return addAnimation(() => {
		if ($new.nodeType === 1) {
			moveProps($e, $new, true);
		}
//!! todo если сваливаемся сюда с ошибкой "can't access property "replaceChild", $e.parentNode is null" - это означает, что новый рндер пошел раньше, чем кончился текущий - так не должно быть 
		if (!$e.parentNode) {
console.error(`если сваливаемся сюда с ошибкой "can't access property "replaceChild", $e.parentNode is null" - это означает, что новый рндер пошел раньше, чем кончился текущий - так не должно быть`, $e, $new, sync);
//alert(1);
			return $new;
		}
		$e.parentNode.replaceChild($new, $e);
		return $new;
	}, req.sync);
}
export function hide(req, $e) {
//	if ($e.nodeName === "TEMPLATE") {
	if ($e.content) {
		return $e;
	}
//	if ($e.nodeType === 8) {
//		return $e;
//	}
	const $parent = $e.parentNode;
	let $i = $e,
		$p = [];
	do {
		if ($i[p_isCmd]) {
			const iId = $i[p_srcId],
				c = cache[iId];
			if (c) {
				cache[iId].value = type_cacheValue();
				cache[iId].current = type_cacheCurrent();
			}
//todo см. комментарий про [p_localId] в clearScope
			clearScope($i, $i === $e && req.str || "");
		}
		if ($i.firstChild) {
			$i = $i.firstChild;
			continue;
		}
		if ($i.content && $i[p_isCmd] && $i.content.firstChild.firstChild) {
			$p.push($i);
			$i = $i.content.firstChild.firstChild;
			continue;
		}
		if ($i.parentNode === $parent) {
			break;
		}
		if ($i.nextSibling) {
			$i = $i.nextSibling;
			continue;
		}
		while ($i = $i.parentNode) {
			if ($i.nodeType === 11) {
				$i = $p.pop();
			}
			if ($i.parentNode === $parent) {
				$i = null;
				break;
			}
			if ($i.nextSibling) {
				$i = $i.nextSibling;
				break;
			}
		}
	} while ($i);
	return addAnimation(() => {
		const $new = Tpl_doc.createElement("template");
		if ($e.nodeType === 1) {
			moveProps($e, $new, false);
		}
		$e.parentNode.replaceChild($new, $e);
		$new.content.appendChild($e);
		return $new;
	}, req.sync);
}
function clearScope($e, str) {
	const attrIt = getAttrItAfter(descrById.get($e[p_descrId]).attr.keys(), str);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
//		const n = i.value;
//		if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
			const lId = getLocalId($e, i.value);
//console.log(lId);
//alert(1)
			if (lId) {
				delete self.localScope[lId];
//console.warn("remove data", lId, $e);
			}
//		}
	}
	if (str) {
//todo если есть str то это с hide, а это значит, что мы не можем точно рассудить про [p_localId] --- а если нет стр, то это значит мы удаляем или скрывам дочерний тег и можно грохать [p_localId]
// -- тут открытым остается вопрос про [p_localId] и дочерний тег
		return;
	}
	if ($e[p_localId]) {
		delete self.localScope[$e[p_localId]];
//console.warn("2 remove data", $e[p_localId], $e);
	}
}
export function is$hide($i) {
	do {
		if ($i === Tpl_$src) {
			return false;
		}
	} while ($i = $i.parentNode);
	return true;
}
function moveProps($from, $to, isShow) {
	const sId = $from[p_srcId];
	$srcById[$to[p_srcId] = sId] = $to;
	$to[p_descrId] = $from[p_descrId];
	$to[p_isCmd] = $from[p_isCmd];

	$to[p_localId] = $from[p_localId];
	$to[p_topURL] = $from[p_topURL];

	if (isShow) {
		return;
	}
	const attrs = $from.attributes,
		attrsLen = attrs.length;
	for (let i = 0; i < attrsLen; i++) {
//		const a = attrs.item(i);
		const a = attrs[i];
//	for (const a of $from.attributes) {
		setAttribute($to, a.name, a.value);
	}
}
/*
export function $goTagsDeep($e, func) {
	func($e);
	if ($e.nodeType === 1 && $e[p_descrId] && descrById.get($e[p_descrId]).isCustomHTML) {
		return $e;
	}
	for (let $i = $e.content ? $e.content.firstChild : $e.firstChild; $i; $i = $i.nextSibling) {
		if ($i.nodeType === 1) {
			$goTagsDeep($i, func);
		}
	}
	return $e;
}*/
/*
export function __$goCopy($from, $to, func) {
	func($from, $to);
	if (descrById.get($from[p_descrId]).isCustomHTML) {
		return $to;
	}
	const $ret = $to;
	for ($from = $from.firstChild, $to = $to.firstChild; $from; $from = $from.nextSibling, $to = $to.nextSibling) {
		if ($from.nodeType === 1) {
			__$goCopy($from, $to, func);
		}
	}
	return $ret;
}*/

export function getIdxName(str) {
	return idxName + str;
}
export function getIdx($e, str) {
	return $e.getAttribute(idxName + str);
//	return $e.getAttribute(getIdxName(str));
}
export function getTopURL($e, str) {
	if (str) {
		const topURL = getAttrTopURL($e, str);//из-за if ($i[p_topURL]) { - так как это должэно работать только для робителей
		if (topURL) {
			return topURL;
		}
	}
	for (let $i = $e.parentNode; $i !== Tpl_$src; $i = $i.parentNode) {
		if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
//console.log("getTopURL", $src, str);
			return getTopURL($srcById[descrById.get($e[p_descrId]).sId]);
		}
		const topURL = getAttrTopURL($i) || $i[p_topURL];
		if (topURL) {
			return topURL;
		}
	}
}
function getAttrTopURL($e, str) {
	if (!$e[p_isCmd]) {
		return "";
	}
	const nattr = descrById.get($e[p_descrId]).attr.keys();
	let topURL = "";
	if (str) {
		for (const n of nattr) {
			if (n === str) {
				break;
			}
			if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
				topURL = getIdx($e, n);
			}
		}
		return topURL;
	}
	for (const n of nattr) {
		if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
			topURL = getIdx($e, n);
		}
	}
	return topURL;
}

export function getLocalIdName(str) {
	return localIdName + str;
}
export function getLocalId($e, str) {
	return $e.getAttribute(localIdName + str);
}
export function getTopLocal($e, str) {
	let $i;
	if (str && $e[p_isCmd]) {
		const lId = getAttrTopLocalId($e, str);
		if (lId) {
			return type_local(lId, $e);
		}
		$i = $e.parentNode;
	} else {
		$i = $e;
	}
	for (; $i !== Tpl_$src; $i = $i.parentNode) {
		if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
			return getTopLocal($srcById[descrById.get($e[p_descrId]).sId]);
		}
		if (!$i[p_isCmd]) {
			continue;
		}
		const lId = getAttrTopLocalId($i);
		if (lId) {
			return type_local(lId, $i);
		}
	}
}
function type_local(id, $src) {
	return {
		id,
		$src
	};
}
function getAttrTopLocalId($e, str) {
	const nattr = descrById.get($e[p_descrId]).attr.keys();
	let lId = "";
	if (str) {
		for (const n of nattr) {
			if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
				const _lId = getLocalId($e, n);
				if (_lId) {
					lId = _lId;
				}
			}
			if (n === str) {
				break;
			}
		}
		return lId || $e[p_localId];
	}
	for (const n of nattr) {
		if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
			const _lId = getLocalId($e, n);
			if (_lId) {
				lId = _lId;
			}
		}
	}
	return lId || $e[p_localId];
}
