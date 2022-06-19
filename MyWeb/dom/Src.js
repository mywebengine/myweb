import config from "../../config/config.js";
import Q$i from "./Q$i.js";
import CloneNodeOn from "./CloneNodeOn.js";

export default class Src {
	constructor(my, id, descr, isCmd, isHide, asOneIdx, idx, cache) {
		this.my = my;
		this.id = id;
//		this.descrId = 0,
		this.descr = descr;
		this.isCmd = isCmd;//false,
		this.isHide = isHide;
		this.asOneIdx = asOneIdx;
		this.idx = idx;
		this.save = null;
		this.cache = cache;
		this.scopeCache = my.getReact({});//todo rename to scope
		this.isMounted = false;
	}
	setScope(scope) {
		const srcScope = this.scopeCache,
			srcScopeT = srcScope[config.p_target],
			scopeT = scope[config.p_target],
			s = scopeT !== undefined ? scopeT : scope;
		for (const i in s) {
			srcScopeT[i] = s[i];
		}
		return srcScope;
	}
/*
	cloneNode(req, $e) {//во время клонирования описания не будут созданы - предназначен для клогнирования новго элемента (который ранее не рендерился)
		if ($e.nodeType === 11) {
			const $fr = this.context.document.createDocumentFragment();
			for ($e = $e.firstChild; $e !== null; $e = $e.nextSibling) {
				$fr.appendChild(cloneNode(req, $e));
			}
			return $fr;
		}
		if ($e.nodeType !== 1) {
			return $e.cloneNode();
		}
		const $n = $e.cloneNode(true),
			$on = $n.nodeName !== "TEMPLATE" || $n.getAttribute(config.hideName) === null ? $n : $n.content.firstChild,
			src = this.my.context.srcBy$src.get(req.$src);
		for (const [n, v] of src.descr.attr) {
			if (n === req.str) {
				break;
			}
			const rc = this.my.context.commandWithArgsByStr.get(n);
			if (rc.commandName === config.onCmdName) {
//console.log(111111, n, v, $on);
				rc.command.render(new Req($on, n, v, req.scope, req.sync));
			}
		}
		const l = this.my.context.loadingCount.get(src.id);
		if (l !== undefined) {
			this.my.context.loadingCount.set($n, l);
		}
		return $n;
	}*/
	q_cloneNode(req, beginIdx, len) {//во время клонирования будут созданы описания
//		const sId = this.my.getSrcId(this.id, req.sync.local);
		const srcBy$src = this.my.context.srcBy$src,
			$src = this.my.context.$srcById.get(this.id),
//!!			src = this.my.context.srcById.get(this.id),
			nStr = this.getNextStr(req.str),
			$els = nStr !== "" ? this.get$els(nStr) : [$src],
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
//			console.warn(">>>mw dom:q_cloneNode:", req, $els, beginIdx, len);
			throw this.my.getError(new Error(`>>>myweb Src:q_cloneNode: среди элементов для клонирования нет элемента с командой, такого не должно быть`), req.$src, req);
		}
		const fDescr = fSrc.descr;
		for (const [n, v] of fDescr.attr) {
			if (n === req.str) {
				break;
			}
			const rc = this.my.context.commandWithArgsByStr.get(n);
			if (rc.commandName === config.onCmdName) {
				on.push(new CloneNodeOn(rc.command, n, v));
			}
		}
		const onLen = on.length,
			l = this.my.context.loadingCount.get(fSrc.id),
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
			this.q_cloneNodeCreate($j, $j.nodeName !== "TEMPLATE" || $j.getAttribute(config.hideName) === null, $jArr, len, asOneVal, 0, baseAsOne);
			this.q_cloneNodeCreateChildren($j, $jArr, len, asOneVal);
			for (i = 0; i < len; i++) {
				const arrI = arr[i],
					$i = arrI.$els[j] = $jArr[i],
					iSrc = srcBy$src.get($i);
				if (iSrc === undefined) {
					continue;
				}
				iSrc.setIdx(req.str, arrI.idx);
				if (onLen !== 0) {
					for (k = 0; k < onLen; k++) {
						const o = on[k];
						//todo не совсем уместно тут рундлерить - мы еще не подключили рендер
						//o.command.render(new Req($i, o.str, o.expr, req.scope, req.sync));
						o.command.render(this.my.createReq($i, o.str, o.expr, req.scope, req.sync));
					}
				}
				if (l !== undefined) {
//todo заменить $i на iSrc.id
//					this.my.context.loadingCount.set($i, l);
//todo не понятно как убирать филилинг с новых элементов
					this.my.context.loadingCount.set(iSrc.id, l);
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
			if ($i.nodeType === 1) {
				if ($i.firstChild !== null) {
					this.q_cloneNodeCreate($i = $i.firstChild, true, $arr, $arrLen, asOneVal, 1, null);
					continue;
				}
//				const iSrc = srcBy$src.get($i);
//				if (iSrc !== undefined && iSrc.isHide) {
				if ($i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {
					$p.push($i);
					for (let i = 0; i < $arrLen; i++) {
						$tP[i].push($arr[i]);
					}
					this.q_cloneNodeCreate($i = $i.content.firstChild, false, $arr, $arrLen, asOneVal, 1, null);
					continue;
				}
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
		const src = this.my.context.srcBy$src.get($e);
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
				this.my.createSrc($arr[i] = $arr[i].parentNode.appendChild($e.cloneNode()), descr, new Map(asOneIdx), new Map(src.idx)).save = save;
			}       
			if (asOneIdx !== null) {
				this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx);
			}
			return;
		}
		if (type === 1) {
			if (isNotHide) {
				for (let i = 0; i < $arrLen; i++) {
					this.my.createSrc($arr[i] = $arr[i].appendChild($e.cloneNode()), descr, new Map(asOneIdx), new Map(src.idx)).save = save;
				}
				if (asOneIdx !== null) {
					this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx);
				}
				return;
			}
			for (let i = 0; i < $arrLen; i++) {
				this.my.createSrc($arr[i] = $arr[i].content.appendChild($e.cloneNode()), descr, new Map(asOneIdx), new Map(src.idx)).save = save;
			}
			if (asOneIdx !== null) {
				this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx);
			}
			return;
		}
		for (let i = 0; i < $arrLen; i++) {
			this.my.createSrc($arr[i] = $e.cloneNode(), descr, new Map(asOneIdx), new Map(src.idx)).save = save;
		}
		if (asOneIdx !== null) {
			this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, baseAsOne);
		}
	}
	//private
	q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx) {
		const srcBy$src = this.my.context.srcBy$src;
		for (let i = 0; i < $arrLen; i++) {
			const $i = $arr[i],
				iSrc = srcBy$src.get($i);
			for (const n of asOneIdx.keys()) {
				const curIdx = iSrc.asOneIdx.get(n),
					v = asOneVal[i].get(curIdx);
				if (v !== undefined) {
					iSrc.setAsOneIdx(n, v);
					continue;
				}
				const vv = this.my.getNewId();
				asOneVal[i].set(curIdx, vv)
				iSrc.setAsOneIdx(n, vv);
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
	setAttribute(name, value, $src = this.my.context.$srcById.get(this.id)) {
//todo атрибут нелльзя создать, если в нем есть некорректные символы - решение ниже слишком исбыточное, на мой взгляд
//		for (let i = name.indexOf("$"); i > 0; i = name.indexOf("$")) {
//			name = name.substr(0, i) + name.substr(i + 1);
//		}
		$src.setAttribute(name, value);
		this.setAttributeValue(name, value, $src);
//!!! думаю что так можно
//	getDescrAttrsBy$scr($e)[name] = value;
	}
	setAttributeValue(name, value, $src = this.my.context.$srcById.get(this.id)) {
		switch (name) {
			case "value":
				if ($src === document.activeElement && typeof $src.setSelectionRange === "function") {
					const pos = $src.selectionStart;
					$src.value = value;
//todo input type number console.log($e)
					if ($src.type === "text" || $src.type === "search") {
						$src.setSelectionRange(pos, pos);
					}
				} else {
					$src.value = value;
				}
			break;
			case "checked":
				$src.checked = !!value;
			break;
		}
	}
	//use in attr
	removeAttribute(name) {
		const $src = this.my.context.$srcById.get(this.id);
		switch (name) {
			case "value":
				$src.value = "";
			break;
			case "checked":
				$src.checked = false;
			break;
		}
		$src.removeAttribute(name);
//!! см. выше
//		getDescrAttrsBy$scr($e).delete(name);
	}
	setAsOneIdx(str, idx) {
		if (this.asOneIdx === null) {
			this.asOneIdx = new Map();
		}
		this.asOneIdx.set(str, idx);
//!!
		if (my.debugLevel === 0) {
			return;
		}
		const $src = this.my.context.$srcById.get(this.id),
			n = config.asOneIdxName + str;
		$src.setAttribute(n, idx);
//		if ($src.nodeName === "TEMPLATE" && $src.getAttribute(config.hideName) !== null) {// && $src.content.firstChild !== null) {//при q_cloneNode мы клонируем не рекурсивно, а это значит что нет внутренностей - они появятся позже
		if (this.isHide && $src.content.firstChild !== null) {//todo!!!!! тут проблема в цустановке атрибута из-за алгоритма q_clone - он не клонирует рекурсивно - todo после можно переделать алгоритм
			$src.content.firstChild.setAttribute(n, idx);
		}
	}
	getIdx(str) {
		if (this.idx !== null) {
			return this.idx.get(str);
		}
	}
	setIdx(str, idx) {
		if (this.idx === null) {
			this.idx = new Map();
		}
		this.idx.set(str, idx);
//!!
		if (my.debugLevel === 0) {
			return;
		}
		const $src = this.my.context.$srcById.get(this.id),
			n = config.idxName + str;
		$src.setAttribute(n, idx);
//		if ($src.nodeName === "TEMPLATE" && $src.getAttribute(config.hideName) !== null) {
		if (this.isHide) {
			$src.content.firstChild.setAttribute(n, idx);
		}
	}
	get$first(str) {
		const $src = this.my.context.$srcById.get(this.id),
			attrIt = this.descr.attr.keys();
		let i = attrIt.next();
		if (str !== "") {
			for (; !i.done; i = attrIt.next()) {
				if (i.value === str) {
					break;
				}
			}
		}
		while (!i.done) {
			const n = i.value,
				get$e = this.descr.get$elsByStr.get(str);
			if (get$e !== undefined) {
				return this.my.context.commandWithArgsByStr.get(str).command.get$first($src, str, get$e.expr, get$e.pos);
			}
			i = attrIt.next();
		}
		return $src;
	}
	get$els(str) {
		const $src = this.my.context.$srcById.get(this.id),
			attrIt = this.descr.attr.keys();
		let i = attrIt.next();
		if (str !== "") {
			for (; !i.done; i = attrIt.next()) {
				if (i.value === str) {
					break;
				}
			}
		}
		while (!i.done) {
			const n = i.value,
				get$e = this.descr.get$elsByStr.get(n);
			if (get$e !== undefined) {
				return this.my.context.commandWithArgsByStr.get(n).command.get$els($src, n, get$e.expr, get$e.pos);
			}
			i = attrIt.next();
		}
		return [$src];
	}
	getNextStr(str) {
//todo есть много вызовов в корых уже вчеслен src
		const attrIt = this.descr.attr.keys();
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			if (i.value !== str) {
				continue;
			}
			i = attrIt.next();
			if (i.done) {
				return "";
			}
			return i.value;
		}
		return "";
	}
	getAttrAfter(name) {
		const a = new Map(),
			attrIt = this.getAttrItAfter(name, true);
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			a.set(i.value[0], i.value[1]);
		}
		return a;
	}
	getAttrItAfter(name, isEnties) {
		if (isEnties) {
			const attrIt = this.descr.attr.entries();
			if (name === "") {
				return attrIt;
			}
			for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
				if (i.value[0] === name) {
					return attrIt;
				}
			}
			return attrIt;
		}
		const attrIt = this.descr.attr.keys();
		if (name === "") {
			return attrIt;
		}
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			if (i.value === name) {
				return attrIt;
			}
		}
		return attrIt;
	}
	is$hide() {
		const $root = this.my.context.rootElement;
		let $i = this.my.context.$srcById.get(this.id);
		do {
			if ($i === $root) {
				return false;
			}
			$i = $i.parentNode;
		} while ($i !== null);
		return true;
	}
};
