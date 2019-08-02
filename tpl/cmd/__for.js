import {incCmdName, forKeyAttrName} from "../const.js";
import {copy, $goCopy, get$first, get$eIdx} from "../../util.js";
import {inc_get$els, inc_isInc} from "./inc.js";

export default {
	render: function(req) {
//console.log(":for", req.$src, req);
		const d = this.get$srcDescr(req.$src);
		const renderFunc = this.renderTag.bind(this);
		const {$els, $elsLen, keys, keysLen} = for_get.call(this, req, renderFunc);
		if (!keysLen) {
			for (let j = $els[0].length - 1; j > -1; j--) {
				$els[0][j] = this.hide($els[0][j]);
			}
			for (let i = 1, j; i < $elsLen; i++) {
				for (j = $els[i].length - 1; j > -1; j--) {
					this.removeChild($els[i][j]);
				}
			}
			delete d.for_oldLastVal;
			return {
				$e: $els[$elsLen - 1],
				isLast: true
			};
		}
		d.isAsOne = true;

//--		req.tpl_url = this.getTopURLBy$src(req.$src);

//		const elsLen = $elsLen / step;
		//!!if on start call render function instand of linker function
		if ($els[1]) {
			let $f;
			for (let j = 0; j < $els[1].length; i++) {
				if ($els[1][j] instanceof HTMLElement) {
					$f = $els[1][i];
					break;
				}
			}
			if ($f && !this.get$srcDescr($f)) {
				for (let i = 1; i < $elsLen; i++) {
					for_copyDescr.call(this, $els, 0, i);
				}
			}
		}
		let begin, end;
		const lastVal = JSON.stringify(req.value[keys[keysLen - 1]]);
		if (lastVal === undefined || lastVal != d.for_oldLastVal) {
			begin = 1;
			end = keysLen;
			if ($elsLen < keysLen) {
				req._$fr = this.createDocumentFragment();
				const $last = $els[$elsLen - 1][$els[$elsLen - 1].length - 1];
				req._$frBefore = $last.nextSibling;
				req._$frParent = $last.parentNode;
				end = $elsLen;
				for (let i = end; i < keysLen; i++) {
					$els.push(for_addClone.call(this, req._$fr, $els));//, req.tpl_url));
					for_add.call(this, req, $els[i], keys[i], renderFunc);
				}
			} else if ($elsLen > keysLen) {
				const begin = end;
				for (let i = begin, j; i < $elsLen; i++) {
					for (j = 0; j < $els[i].length; j++) {
						this.removeChild($els[i][j]);
					}
				}
				$els.splice(begin, $elsLen - begin);
//--				$elsLen = $els.length;
			}
		} else {
			begin = 0;
			end = keysLen;
			if ($elsLen < keysLen) {
				req._$fr = this.createDocumentFragment();
				req._$frBefore = $els[0][0];
				req._$frParent = req._$frBefore.parentNode;
				begin = keysLen - $elsLen;
				for (let i = begin - 1; i > -1; i--) {
					$els.unshift(for_addClone.call(this, req._$fr, $els));//, req.tpl_url));
					for_add.call(this, req, $els[0], keys[i], renderFunc);
				}
			} else if ($elsLen > keysLen) {
				const _end = ($elsLen - keysLen);
				for (let i = 0, j; i < _end; i++) {
					for (j = 0; j < $els[i].length; j++) {
						this.removeChild($els[i][j]);
					}
				}
				$els.splice(0, end);
//--				$elsLen = $els.length;
			}
		}
		for (let i = begin; i < end; i++) {
//const ih = $els[i * step].innerHTML;
			for_add.call(this, req, $els[i], keys[i], renderFunc);
//console.log(ih == $els[i * step].innerHTML);
		}
		d.for_oldLastVal = lastVal;
		if (req._$fr) {
			this.insertBefore(req._$frParent, req._$fr, req._$frBefore);
		}
		return {
			$e: $els[$elsLen - 1][$els[$elsLen - 1].length - 1],
			isLast: true
		};
	},
	linker(req) {
		const renderFunc = this.linker.bind(this);
		const {$els, $elsLen, keys, keysLen} = for_get.call(this, req, renderFunc);
		if (!keysLen) {
			return {
				isLast: true
			};
		}
		const d = this.get$srcDescr(req.$src);
		d.isAsOne = true;
		if ($els[1]) {// && !this.get$srcDescr($els[step])) {
			for (let i = 1; i < $elsLen; i++) {
				for_copyDescr.call(this, $els, 0, i);
//?????????
				for_add.call(this, req, $els[i], keys[i], renderFunc);
			}
		}
		d.for_oldLastVal = JSON.stringify(req.value[keys[keysLen - 1]]);
//console.log(req, d.for_oldLastVal);
		return {
			$e: $els[$elsLen - 1][$els[$elsLen - 1].length],
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
	req.value = this.eval(req);

	const $first = get$first(req.$src, isSame, req);
	if (!req.value) {
		return getEmptyRes(req, $first);
	}
	const keys = [];
	for (const key in req.value) {
		keys.push(key);
	}
	if (!keys.length) {
		return getEmptyRes(req, $first);
	}

	req.valName = req.args[0];
	req.keyName = req.args[1];
	req.attrsAfter = this.getAttrsAfter(this.getAttrs(req.$src), req.str);

//	$first = this.show($first);
	const $els = inc_isInc.call(this, req.$src) ? for_get$elsInc.call(this, req, $first) : get$els(req, $first);
//	for (let i = $els.length - 1; i >= step; i--) {
//		$els[i] = this.show($els[i]);
//	}
//console.log("for els", $els);
//alert(1);
	for_add.call(this, req, $els[0], keys[0], renderFunc);
	return {
		$els,
		$elsLen: $els.length,
		keys,
		keysLen: keys.length
	};
}
function getEmptyRes(req, $first) {
	const $els = get$els(req, $first);
	return {
		$els,
		$elsLen: $els.length
	};
}
function for_add(req, $iEls, key, renderFunc) {
	if (req.valName) {
		req.scope[req.valName] = req.value[key];
	}
	if (req.keyName) {
		req.scope[req.keyName] = key;
	}
console.log($iEls);
	const $lastNext = $iEls[$iEls.length - 1].nextSibling;
	let $e = $iEls[0], $next;
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
	$e = $iEls[0];
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
/*
function get$last($first, step) {
	for (let i = 1; i < step; i++) {
		$first = $first.nextSibling;
	}
	return $first;
}*/
function get$els(req, $first) {
	const $els = [[$first]];
	for (let $i = $first.nextSibling; $i; $i = $i.nextSibling) {
//		if (!($i instanceof HTMLElement && isSame($i, req))) {
//			break;
//		}
		if (!($i instanceof HTMLElement && getForKey($i, req.str) != null)) {
			break;
		}
		$els.push([$i]);
	}
	return $els;
}
function for_get$elsInc(req, $first) {
	const $els = [inc_get$els.call(this, $first)];
	for (let $i = $els[0][$els[0].length - 1].nextElementSibling; $i; $i = $i.nextElementSibling) {
		if (!inc_isInc.call(this, $i)) {
			break;
		}
		const $iEls = inc_get$els.call(this, $i);
		let f;
		for (let i = 0; i < $iEls.length; i++) {
			const $j = $iEls[i];
			if (getForKey($i, req.str) === null) {
				f = true;
				break;
			}
		}
		if (f) {
			break;
		}
		$els.push($iEls);
	}
	return $els;
}
function for_copyDescr($els, fromIdx, toIdx) {
	const copyFunc = this.copyDescr.bind(this);
//console.log(22222222, $els, fromIdx, toIdx, step);
	for (let i = 0; i < $els[fromIdx].length; i++) {
		if ($els[fromIdx][i] instanceof HTMLElement) {
//!!!!!!!!!!!
			$goCopy($els[fromIdx][i], $els[toIdx][i], copyFunc);
		}
	}
}
function for_addClone($fr, $els) {//, tpl_url) {
	const $c = [];
//!!!!!!!!!!!
	for (let i = 0; i < 1; i++) {
		for (let j = 0; j < 1; j++) {
			$c.push(this.appendChild($fr, this.cloneNode($els[i][j])));
		}
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
