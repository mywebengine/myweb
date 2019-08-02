import {incCmdName, forKeyAttrName} from "../const.js";
import {copy, $goCopy, get$first, get$eIdx} from "../../util.js";
import {inc_get$els} from "./inc.js";

export default {
	render: function(req) {
//console.log(":for", req.$src, req);
		const d = this.get$srcDescr(req.$src);
		const renderFunc = this.renderTag.bind(this);
		const {$els, $elsLen, step, keys, keysLen} = for_get.call(this, req, renderFunc);
		if (!keysLen) {
			for (let i = 0; i < step; i++) {
				$els[i] = this.hide($els[i]);
			}
			for (let i = step; i < $elsLen; i++) {
				this.removeChild($els[i]);
			}
			delete d.for_oldLastVal;
			return {
				$e: $els[$elsLen - 1],
				isLast: true
			};
		}
		d.isAsOne = true;

//--		req.tpl_url = this.getTopURLBy$src(req.$src);

		const elsLen = $elsLen / step;
		//!!if on start call render function instand of linker function
		if ($els[step] && !this.get$srcDescr($els[step])) {
			for (let i = step; i < $elsLen; i += step) {
				for_copyDescr.call(this, $els, 0, i, step);
			}
		}
		let begin, end;
		const lastVal = JSON.stringify(req.value[keys[keysLen - 1]]);
		if (lastVal === undefined || lastVal != d.for_oldLastVal) {
			begin = 1;
			end = keysLen;
			if (elsLen < keysLen) {
				req._$fr = this.createDocumentFragment();
				const $last = $els[$elsLen - 1];
				req._$frBefore = $last.nextSibling;
				req._$frParent = $last.parentNode;
				end = elsLen;
				for (let i = end; i < keysLen; i++) {
					$els.push(...for_addClone.call(this, req._$fr, $els, step));//, req.tpl_url));
					for_add.call(this, req, $els[i * step], keys[i], renderFunc, step);
				}
			} else if (elsLen > keysLen) {
				const begin = end * step;
				for (let i = begin; i < $elsLen; i++) {
					this.removeChild($els[i]);
				}
				$els.splice(begin, $elsLen - begin);
//--				$elsLen = $els.length;
			}
		} else {
			begin = 0;
			end = keysLen;
			if (elsLen < keysLen) {
				req._$fr = this.createDocumentFragment();
				req._$frBefore = $els[0];
				req._$frParent = $els[0].parentNode;
				begin = keysLen - elsLen;
				for (let i = begin - 1; i > -1; i--) {
					$els.unshift(...for_addClone.call(this, req._$fr, $els, step));//, req.tpl_url));
					for_add.call(this, req, $els[0], keys[i], renderFunc, step);
				}
			} else if (elsLen > keysLen) {
				const end = (elsLen - keysLen) * step;
				for (let i = 0; i < end; i++) {
					this.removeChild($els[i]);
				}
				$els.splice(0, end);
//--				$elsLen = $els.length;
			}
		}
		for (let i = begin; i < end; i++) {
//const ih = $els[i * step].innerHTML;
			for_add.call(this, req, $els[i * step], keys[i], renderFunc, step);
//console.log(ih == $els[i * step].innerHTML);
		}
		d.for_oldLastVal = lastVal;
		if (req._$fr) {
			this.insertBefore(req._$frParent, req._$fr, req._$frBefore);
		}
		return {
			$e: $els[$els.length - 1],
			isLast: true
		};
	},
	linker(req) {
		const renderFunc = this.linker.bind(this);
		const {$els, $elsLen, step, keys, keysLen} = for_get.call(this, req, renderFunc);
		if (!keysLen) {
			return {
				isLast: true
			};
		}
		const d = this.get$srcDescr(req.$src);
		d.isAsOne = true;
		if ($els[step]) {// && !this.get$srcDescr($els[step])) {
			for (let i = step; i < $elsLen; i += step) {
				for_copyDescr.call(this, $els, 0, i, step);
//?????????
				for_add.call(this, req, $els[i], keys[i / step], renderFunc, step);
			}
		}
		d.for_oldLastVal = JSON.stringify(req.value[keys[keysLen - 1]]);
//console.log(req, d.for_oldLastVal);
		return {
			$e: $els[$elsLen - 1],
			isLast: true
		};
	},
	getScope: function(req) {
		const key = getForKey(req.$src, req.str);
		if (key === null) {
			return req.scope;
		}
		const value = this.eval(req);
		if (!value) {
//			this.check(new Error(">>>Tpl for:getScope:01: Object from foreach not exists"), req);
//			return;
			return req.scope;
		}
		const valName = req.args[0];
		if (valName) {
			req.scope[valName] = value[key];
//console.log(1111111111111111, value[key]);
		}
		const keyName = req.args[1];
		if (keyName) {
			req.scope[keyName] = key;
		}
		return req.scope;
	}
};
function for_get(req, renderFunc) {
	req.scope = copy(req.scope);
//--	this.curReq = req;
	req.value = this.eval(req);
//	delete this.curReq;

	const attrsAfter = this.getAttrsAfter(this.getAttrs(req.$src), req.str);
	let incStr;
	for (const n of attrsAfter.keys()) {
		const [cmdName] = this.getCmdArgs(n);
		if (cmdName == incCmdName) {
			incStr = n;
			break;
		}
	}
	const $firstEls = incStr ? inc_get$els.call(this, get$first(req.$src, isSame, req), incStr) : [get$first(req.$src, isSame, req)];
//console.log("for els 0", $firstEls, incStr, get$first(req.$src, isSame, req));
	const step = $firstEls.length;
	if (!req.value) {
		return getEmptyRes(req, $firstEls, step);
	}
	const keys = [];
	for (const key in req.value) {
		keys.push(key);
	}
	if (!keys.length) {
		return getEmptyRes(req, $firstEls, step);
	}

	req.valName = req.args[0];
	req.keyName = req.args[1];
	req.attrsAfter = attrsAfter;

	for (let i = $firstEls.length - 1; i > -1; i--) {
		$firstEls[i] = this.show($firstEls[i]);
	}
	const $els = get$els(req, $firstEls[0], step);
	for (let i = $els.length - 1; i >= step; i--) {
		$els[i] = this.show($els[i]);
	}
//console.log("for els", $els);
//alert(1);
	for_add.call(this, req, $els[0], keys[0], renderFunc, step);
	return {
		$els,
		$elsLen: $els.length,
		step,
		keys,
		keysLen: keys.length
	};
}
function getEmptyRes(req, $firstEls, step) {
	const $els = get$els(req, $firstEls[0], step);
	return {
		$els,
		$elsLen: $els.length,
		step
	};
}
function for_add(req, $src, key, renderFunc, step) {
	if (req.valName) {
		req.scope[req.valName] = req.value[key];
	}
	if (req.keyName) {
		req.scope[req.keyName] = key;
	}
	const $lastNext = get$last($src, step).nextSibling;
	let $e = $src, $next;
	while ($e) {
		if ($e instanceof HTMLElement) {
			$e = renderFunc($e, req.scope, req.attrsAfter);
		}
		$next = $e.nextSibling;
		if (!$next || $e == $lastNext) {
			break;
		}
		$e = $next;
	}
	$e = $src;
	while ($e) {
		if ($e instanceof HTMLElement) {
			$e.setAttribute(getForKeyName(req.str), key);
		}
		$next = $e.nextSibling;
		if (!$next || $next == $lastNext) {
			break;
		}
		$e = $next;
	}
//	set$eKey($e, key, step);
}
function get$last($first, step) {
	for (let i = 1; i < step; i++) {
		$first = $first.nextSibling;
	}
	return $first;
}
function get$els(req, $first, step, firstIdx = get$eIdx($first)) {
//console.log("for getels", req, $first, step, firstIdx);
	const $els = [];
	const $nodes = $first.parentNode.childNodes;
	const $nodesLen = $nodes.length;
	for (let i = firstIdx; i < $nodesLen; i += step) {
		const len = i + step;
		let f;
		for (let j = i; j < len; j++) {
			if ($nodes[j] instanceof HTMLElement) {
				if (!isSame($nodes[j], req)) {
					break;
				}
				f = true;
			}
		}
		if (!f) {
			break;
		}
		for (let j = i; j < len; j++) {
			$els.push($nodes[j]);
		}
	}
	return $els;
}
function for_copyDescr($els, fromIdx, toIdx, step) {
	const copyFunc = this.copyDescr.bind(this);
//console.log(22222222, $els, fromIdx, toIdx, step);
	for (let i = 0; i < step; i++) {
		if ($els[fromIdx + i] instanceof HTMLElement) {
			$goCopy($els[fromIdx + i], $els[toIdx + i], copyFunc);
		}
	}
}
function for_addClone($fr, $els, step) {//, tpl_url) {
	const $c = [];
	for (let i = 0; i < step; i++) {
		$c.push(this.appendChild($fr, this.cloneNode($els[i])));
	}
/*
	if (tpl_url) {
		for (let i = 0; i < step; i++) {
			if ($c[i] instanceof HTMLElement) {
				this.get$srcDescr($c[i]).tpl_url = tpl_url;
				break;
			}
		}
	}*/
//console.log("for clone", $c, $els, step);
	return $c;
}
function isSame($e, req) {
//	return this.get$srcDescr($e).id == this.get$srcDescr(req.$src).id;
	return $e.getAttribute(req.str) == req.$src.getAttribute(req.str);
}
/*--
function set$eKey($e, key, step) {
//console.log(121, key, $e, $e.parentNode);
	for (let i = 0; i < step; i++, $e = $e.nextSibling) {
//console.log(123, key, $e);
		if ($e instanceof HTMLElement) {
			$e.setAttribute(forKeyAttrName, key);
		}
	}
}*/
export function getForKeyName(str) {
	return forKeyAttrName + "_" + str;
}
export function getForKey($e, str) {
	return $e.getAttribute(getForKeyName(str));
}
