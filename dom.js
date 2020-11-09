import {cache, type_cacheValue, type_cacheCurrent} from "./cache.js";
import {Tpl_doc, Tpl_$src, srcId, descrId, isCmd, incCmdName, textCmdName, idxName, localIdName} from "./config.js";
import {$srcById, descrById, createSrc, getAttrItAfter} from "./descr.js";
import {srcIdSetByVarId, varIdByVarIdByProp} from "./proxy.js";
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
								_preRender($i, $iD);
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
	createSrc($e, $d[descrId]);
	if ($e.nodeName === "TEMPLATE") {
		return;
	}
	for ($e = $e.firstChild, $d = $d.firstChild; $e; $e = $e.nextSibling, $d = $d.nextSibling) {
		if ($e.nodeType === 1) {
			_preRender($e, $d);
		}
/*
		switch ($e.nodeType) {
			case 1:
				_preRender($e, $d);
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
		}*/
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
/*
export function __copyDescr($from, $to) {
//console.log($from, $to);
	const sId = getNewId();
	$srcById[$to[srcId] = sId] = $to;
	descrById.get($to[descrId] = $from[descrId]).srcIdSet.add(sId);
}
export function __cloneNode($e) {
	return __$goCopy($e, $e.cloneNode(true), __copyDescr);
}*/
/*
export function replaceChild($new, $old) {
	return $goTagsDeep($old.parentNode.replaceChild($new, $old), clearTag);
}*/
export function removeChild($e, isClearLocalScope) {
//console.error($e[srcId], $e);
	$e.parentNode.removeChild($e);
	const rems = [];
	let $i = $e;
	do {
		const sId = $i[srcId];
		if (sId) {
			const r = clearTag($i, sId, isClearLocalScope);
			if (r) {
				rems.push(r);
			}
		}
		if ($i.firstChild) {
			$i = $i.firstChild;
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
	if (rems.length) {
		requestIdleCallback(() => {
			for (const r of rems) {
				_clearTag(...r);
			}
		});
	}
//	$goTagsDeep($e.parentNode.removeChild($e), isClearLocalScope && clearTagWithLocalScope || clearTag);
}
//function clearTagWithLocalScope($e) {
//	clearTag($e, true);
//}
//function clearTag($e, isClearLocalScope) {
//	const sId = $e[srcId];
//	if (!sId) {
//		return;
//	}
function clearTag($e, sId, isClearLocalScope) {
//console.error("DEL", sId, $e);
	delete $srcById[sId];
	delete cache[sId];
	const dId = $e[descrId],
		d = descrById.get(dId);
	if (!$e[isCmd]) {
		return;
	}
	d.srcIdSet.delete(sId);
//!!1-20200826>
	if (d.sId === sId) {
		d.sId = d.srcIdSet.values().next().value;
	}
//!!1-20200826<
	if (isClearLocalScope) {
		clearScope($e);
	}
	return [sId, dId, d];
//	_clearTag(d);
}
function _clearTag(sId, dId, d) {
//	requestIdleCallback(() => {
//todo!!!
		for (const vId of d.varIdSet) {
			const s = srcIdSetByVarId.get(vId);
			if (!s || !s.has(sId)) {
				continue;
			}
			const vIdByProp = varIdByVarIdByProp[vId];
			if (vIdByProp) {
				for (const pId of vIdByProp.values()) {
					const propS = srcIdSetByVarId.get(pId);
					if (propS && propS.has(sId)) {
						_del(pId, propS, sId, d);
					}
				}
			}
			_del(vId, s, sId, d, dId);
		}
/*
		for (const [vId, s] of srcIdSetByVarId) {
			if (!s.has(sId)) {
				continue;
			}
			s.delete(sId);
			if (s.size) {
				continue;
			}
			if (dSId && $srcById[dSId]) {
				s.add(dSId);
				continue;
			}
			srcIdSetByVarId.delete(vId);
		}*/
//	});
}
function _del(vId, s, sId, d, dId) {
//if (vId === varIdByVar.get(loc.hash[_target])) {
//console.error(vId, s, sId, d, dId);
//alert("!!" + sId);
//}
	s.delete(sId);
	if (s.size) {// || sId === d.sId) {
		return;
	}
//!!1-20200826>
/*
	const dSId = d.srcIdSet.values().next().value;
	if (dSId) {
//!!!!!!todo
		if (dSId !== d.sId) {
			s.add(d.sId = dSId);
			return;
		}
//		return;
	}*/
//!!1-20200826<
//console.log("dom del", dId, vId, d);
//alert(1);
//	descrById.delete(dId);
	srcIdSetByVarId.delete(vId);
	delete varIdByVarIdByProp[vId];
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
//	return addAnimation(() => {
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
//	});//, req.sync);
}
export function hide(req, $e) {
//	if ($e.nodeName === "TEMPLATE") {
	if ($e.content) {
		return $e;
	}
//	if ($e.nodeType === 8) {
//		return $e;
//	}
	const $p = $e.parentNode;
	let $i = $e;
	do {
		if ($i[isCmd]) {
			const iId = $i[srcId];
			cache[iId].value = type_cacheValue();
			cache[iId].current = type_cacheCurrent();
//todo см. комментарий про local_id в clearScope
			clearScope($i, $i === $e && req.str || "");
		}
		if ($i.firstChild) {
			$i = $i.firstChild;
			continue;
		}
		if ($i.parentNode === $p) {
			break;
		}
		if ($i.nextSibling) {
			$i = $i.nextSibling;
			continue;
		}
		while ($i = $i.parentNode) {
			if ($i.parentNode === $p) {
				$i = null;
				break;
			}
			if ($i.nextSibling) {
				$i = $i.nextSibling;
				break;
			}
		}
	} while ($i);
//	return addAnimation(() => {
		const $new = Tpl_doc.createElement("template");
		if ($e.nodeType === 1) {
			moveProps($e, $new, false);
		}
		$e.parentNode.replaceChild($new, $e);
		$new.content.appendChild($e);
		return $new;
//	});//, req.sync);
}
function clearScope($e, str) {
	const attrIt = getAttrItAfter(descrById.get($e[descrId]).attr.keys(), str);
	for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
//		const n = i.value;
//		if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
			const lId = getLocalId($e, i.value);
			if (lId) {
				delete self.localScope[lId];
//console.warn("remove data", lId, $e);
			}
//		}
	}
	if (str) {
//todo если есть str то это с hide, а это значит, что мы не можем точно рассудить про local_id --- а если нет стр, то это значит мы удаляем или скрывам дочерний тег и можно грохать local_id
// -- тут открытым остается вопрос про local_id и дочерний тег
		return;
	}
	if ($e.local_id) {
		delete self.localScope[$e.local_id];
//console.warn("2 remove data", $e.local_id, $e);
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
	const sId = $from[srcId];
	$srcById[$to[srcId] = sId] = $to;
	$to[descrId] = $from[descrId];
	$to[isCmd] = $from[isCmd];

	$to.top_url = $from.top_url;
	$to.local_id = $from.local_id;

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
	if ($e.nodeType === 1 && $e[descrId] && descrById.get($e[descrId]).isCustomHTML) {
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
	if (descrById.get($from[descrId]).isCustomHTML) {
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
		const topURL = getAttrTopURL($e, str);//из-за if ($i.tpl_url) { - так как это должэно работать только для робителей
		if (topURL) {
			return topURL;
		}
	}
	for (let $i = $e.parentNode; $i !== Tpl_$src; $i = $i.parentNode) {
		if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
//console.log("getTopURL", $src, str);
			return getTopURL($srcById[descrById.get($e[descrId]).sId]);
		}
		const topURL = getAttrTopURL($i) || $i.tpl_url;
		if (topURL) {
			return topURL;
		}
	}
}
function getAttrTopURL($e, str) {
	if (!$e[isCmd]) {
		return "";
	}
	const nattr = descrById.get($e[descrId]).attr.keys();
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
export function getTopLocalId($e, str) {
	let $i;
	if (str) {
		const lId = getAttrTopLocalId($e, str);
		if (lId) {
			return lId;
		}
		$i = $e.parentNode;
	} else {
		$i = $e;
	}
	for (; $i !== Tpl_$src; $i = $i.parentNode) {
		if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
			return getTopLocalId($srcById[descrById.get($e[descrId]).sId]);
		}
		const lId = getAttrTopLocalId($i);
		if (lId) {
			return lId;
		}
	}
}
function getAttrTopLocalId($e, str) {
	const nattr = descrById.get($e[descrId]).attr.keys();
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
		return lId || $e.local_id;
	}
	for (const n of nattr) {
		if (reqCmd[n].cmdName === incCmdName) {//!!maybe todo пока работает только для inc
			const _lId = getLocalId($e, n);
			if (_lId) {
				lId = _lId;
			}
		}
	}
	return lId || $e.local_id;
}
