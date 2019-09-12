import {forCmdName, forIdxAttrName} from "../const.js";
import {copy, $goCopy} from "../../util.js";
import {inc_get$els, inc_isInc} from "./inc.js";

export default {
	render: function(req) {
//console.log("_for", req.str, req.$src, req);
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
			if (d.for_oldLastVal) {
				delete d.for_oldLastVal[req.str];
			}
			return {
				$e: $els[0][$els[0].length - 1],
				isLast: true
			};
		}
//??
		d.isAsOne = true;
		if (!d.for_oldLastVal) {
			d.for_oldLastVal = {};
		}

		const lastVal = JSON.stringify(req.value[keys[keysLen - 1]]);
		const isUpDown = lastVal === undefined || lastVal != d.for_oldLastVal[req.str];

		let isFirstRender;
		if (!d.isRendered) {
			//!!if on start call render function instand of linker function
			if (isUpDown) {
				for_render.call(this, req, $els, keys, 0, renderFunc);
				for (let i = 1; i < $elsLen; i++) {
					for_copyDescr.call(this, $els, 0, i);
				}
			} else {
				const idxToRender = $elsLen - 1;
				for_render.call(this, req, $els, keys, idxToRender, renderFunc);
				for (let i = 0; i < idxToRender; i++) {
					for_copyDescr.call(this, $els, idxToRender, i);
				}
			}
			isFirstRender = d.isRendered = true;
		}
		let begin, end;
		if (isUpDown) {
			begin = isFirstRender ? 1 : 0;
			end = keysLen;
			if ($elsLen < keysLen) {
				req._$fr = this.createDocumentFragment();
				const $last = $els[$elsLen - 1][$els[$elsLen - 1].length - 1];
				req._$frBefore = $last.nextSibling;
				req._$frParent = $last.parentNode;
				end = $elsLen;
				for (let i = end; i < keysLen; i++) {
					$els.push(for_clone$e.call(this, req, req._$fr, $els[0], null, i));
					for_render.call(this, req, $els, keys, i, renderFunc);
				}
			} else if ($elsLen > keysLen) {
				for (let i = keysLen; i < $elsLen; i++) {
					for (let j = 0; j < $els[i].length; j++) {
						this.removeChild($els[i][j]);
					}
				}
				$els.splice(keysLen, $elsLen - keysLen);
			}
		} else {
			begin = 0;
			end = keysLen;
			if (isFirstRender) {
				end--;
				const idxName = getForIdxName(req.str);
				for (let i = $elsLen - 1, j = $els[i].length - 1; j > -1; j--) {
					const $j = $els[i][j];
					if ($j instanceof HTMLElement) {
						$j.setAttribute(idxName, end);
					}
				}
			}
			if ($elsLen < keysLen) {
				req._$fr = this.createDocumentFragment();
				req._$frBeforePrev = $els[0][0].previousSibling;
				req._$frParent = $els[0][0].parentNode;
				begin = keysLen - $elsLen;
				const $toClone = $els[$elsLen - 1];
				for (let i = begin - 1; i > -1; i--) {
					$els.unshift(for_clone$e.call(this, req, req._$fr, $toClone, req._$fr.firstChild, i));
				}
				for (let i = 0; i < begin; i++) {
					for_render.call(this, req, $els, keys, i, renderFunc);
				}
			} else if ($elsLen > keysLen) {
				const _end = $elsLen - keysLen;
				for (let i = 0; i < _end; i++) {
					for (let j = 0; j < $els[i].length; j++) {
						this.removeChild($els[i][j]);
					}
				}
				$els.splice(0, _end);
			}
		}
		for (let i = begin; i < end; i++) {
//const ih = $els[i * step].innerHTML;
			for_render.call(this, req, $els, keys, i, renderFunc);
//console.log(ih == $els[i * step].innerHTML);
		}
		d.for_oldLastVal[req.str] = lastVal;
		if (req._$fr) {
			this.insertBefore(req._$frParent, req._$fr, req._$frBefore === undefined ? (req._$frBeforePrev ? req._$frBeforePrev.nextSibling : req._$frParent.firstChild) : req._$frBefore);
		}
		const $l = $els[$els.length - 1];
		return {
			$e: $l[$l.length - 1],
			isLast: true
		};
	},
	linker(req) {
		const renderFunc = this.linker.bind(this);
		const {$els, $elsLen, keys, keysLen} = for_get.call(this, req, renderFunc);
		const $l = $els[$elsLen - 1];
		if (!keysLen) {
			return {
				$e: $l[$l.length - 1],
				isLast: true
			};
		}
		const d = this.get$srcDescr(req.$src);
//??
		d.isAsOne = true;
//		if ($elsLen > 1) {// && !this.get$srcDescr($els[step])) {
			for (let i = 1; i < $elsLen; i++) {
				for_copyDescr.call(this, $els, 0, i);
//?????????
				for_render.call(this, req, $els, keys, i, renderFunc);
			}
//		}
		if (!d.for_oldLastVal) {
			d.for_oldLastVal = {};
		}
		d.for_oldLastVal[req.str] = JSON.stringify(req.value[keys[keysLen - 1]]);
//console.log(req, d.for_oldLastVal[req.str]);
		return {
			$e: $l[$l.length - 1],
			isLast: true
		};
	},
	getScope: function(req) {
		const idx = getForIdx(req.$src, req.str);
		if (idx === null) {
			return req.scope;
		}
		const value = this.eval(req);
		if (!value) {
//			this.check(new Error(">>>Tpl for:getScope:01: Object from foreach not exists"), req);
//			return;
			return req.scope;
		}
		let key;
		let i = 0;
		for (const k in value) {
			if (i == idx) {
				key = k;
				break;
			}
			i++;
		}
		const valName = req.args[0];
		if (valName) {
			req.scope[valName] = value[key];
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
	const $first = for_get$first.call(this, req, req.$src);
	if (!req.value) {
		return for_getEmptyRes.call(this, req, $first);
	}
	const keys = [];
	for (const key in req.value) {
		keys.push(key);
	}
	if (!keys.length) {
		return for_getEmptyRes.call(this, req, $first);
	}
	req.valName = req.args[0];
	req.keyName = req.args[1];
	req.attrsAfter = this.getAttrsAfter(this.getAttrs(req.$src), req.str);
	const $els = for_get$els.call(this, req, $first);
	return {
		$els,
		$elsLen: $els.length,
		keys,
		keysLen: keys.length
	};
}
function for_get$first(req, $e) {
	const [forStrs, forStrsLast] = for_getForStrs.call(this, req, $e);
	for (let $i = $e; $i; $i = $i.previousElementSibling) {
		const idx = getForIdx($i, req.str);
		if (idx === null) {
			return $e;
		}
		$e = $i;
		if (idx != 0) {
			continue;
		}
		for ($i = $i.previousElementSibling; $i; $i = $i.previousElementSibling) {
			const prevIdx = getForIdx($i, req.str);
			if (prevIdx === null || prevIdx != 0) {
				return $e;
			}
			if (forStrs) {
				for (let i = forStrsLast; i > -1; i--) {
					const a = forStrs[i];
					if (getForIdx($i, a.str) != a.val) {
						return $e;
					}
				}
			}
			$e = $i;
		}
		return $e;
	}
	return $e;
}
function for_getEmptyRes(req, $first) {
	const $els = for_get$els.call(this, req, $first);
	return {
		$els,
		$elsLen: $els.length
	};
}
function for_get$els(req, $first) {
	if (inc_isInc.call(this, req.$src, req.str)) {
		return for_get$elsInc.call(this, req, $first);
	}
	const [forStrs, forStrsLast] = for_getForStrs.call(this, req, $first);
	const $els = [];
	for (let $i = $first; $i;) {
		const $e = [$i];
		$els.push($e);
		const idx = getForIdx($i, req.str);
		if (idx === null) {
			return $els;
		}
		for ($i = $i.nextElementSibling; $i; $i = $i.nextElementSibling) {
			if (forStrs) {
				for (let i = forStrsLast; i > -1; i--) {
					const a = forStrs[i];
					if (getForIdx($i, a.str) != a.val) {
						return $els;
					}
				}
			}
			const jdx = getForIdx($i, req.str);
//console.log(22, req.str, $i, idx, jdx, $els);
			if (jdx === null || Number(idx) > Number(jdx)) {
				return $els;
			}
			if (idx != jdx) {
				break;
			}
			$e.push($i);
		}
	}
	return $els;
}
function for_get$elsInc(req, $first) {
	const $els = [];
	for (let $i = $first; $i;) {
		const $e = inc_get$els.call(this, $i);
		$els.push($e);
		const idx = getForIdx($i, req.str);
		if (idx === null) {
			return $els;
		}
		for ($i = $e[$e.length - 1].nextElementSibling; $i; $i = $i.nextElementSibling) {
			if (!inc_isInc.call(this, $i, req.str)) {
				return $els;
			}
			const jdx = getForIdx($i, req.str);
			if (jdx === null || Number(idx) > Number(jdx)) {
				return $els;
			}
			if (idx != jdx) {
				break;
			}
			$e.push(...inc_get$els.call(this, $i));
		}
	}
	return $els;
}
function for_getForStrs(req, $e) {
	const forStrs = [];
//	for (const n of this.getAttrsBefore(this.getAttrs($e), req.str).keys()) {
	for (const n of this.getAttrs($e).keys()) {
		if (n == req.str) {
			break;
		}
		const [cmdName] = this.getCmdArgs(n);
		if (cmdName == forCmdName) {
			forStrs.push({
				str: n,
				val: getForIdx($e, n)
			});
		}
	}
	if (forStrs.length) {
		return [forStrs, forStrs.length - 1];
	}
	return [];
}
/*
function for_render(req, $els, keys, idx, renderFunc) {
	if (req.valName) {
		req.scope[req.valName] = req.value[keys[idx]];
	}
	if (req.keyName) {
		req.scope[req.keyName] = keys[idx];
	}
	for (let j = $els[idx].length - 1; j > -1; j--) {
		if ($els[idx][j] instanceof HTMLElement) {
			if (inc_isInc.call(this, $els[idx][j], req.str)) {
				return _for_renderInc(req, $els, keys, idx, renderFunc);
			}
			break;
		}
	}
*/
function for_render(req, $els, keys, idx, renderFunc) {
	if (req.valName) {
		req.scope[req.valName] = req.value[keys[idx]];
	}
	if (req.keyName) {
		req.scope[req.keyName] = keys[idx];
	}
//console.log(777, req.str, idx, $els, $els[idx]);
//alert(1);
	const idxName = getForIdxName(req.str);
	const $lastNext = $els[idx][$els[idx].length - 1].nextSibling;
	let $e = $els[idx][0];
	$els[idx] = [];
	while ($e) {
		if ($e instanceof HTMLElement) {
			$e = this.show($e);
			const $prev = inc_isInc.call(this, $e, req.str) ? inc_get$els.call(this, $e)[0].previousSibling : $e.previousSibling;
//			let $prev = $e.previousSibling;
//console.log(123, req.str, idx, $prev, $e, $e.parentNode, $lastNext);
//alert(1);
			$e = renderFunc($e, req.scope, req.attrsAfter);
//console.log(12444, req.str, idx, $prev, $e, $els[idx], req.attrsAfter);
//alert(2);
//try {
			for (let $i = $prev ? $prev.nextSibling : $e.parentNode.firstChild;; $i = $i.nextSibling) {
				if ($i instanceof HTMLElement) {
					$i.setAttribute(idxName, idx);
				}
				$els[idx].push($i);
				if ($i == $e) {
					break;
				}
			}
//} catch(e) {
//	console.log(req.str, e, $prev, $e);
//	alert(112121);
//	throw 111;
//}
//--		} else {
//--			$els[idx].push($e);
		}
		const $next = $e.nextSibling;
		if (!$next || $next == $lastNext) {
			break;
		}
		$e = $next;
	}
}
function for_copyDescr($els, fromIdx, toIdx) {
	const copyFunc = this.copyDescr.bind(this);
//Предполагается, что если первый элемент это tmplate - то значит он результат hide
//Если бы была вставка, то первый был бы коммент, а если бы первым задумывался template - то он бы и получился циклом - и в этом случаи все сломается (!!!), но данный сценарий - что-то очень абстрактное
	const $fromEls = $els[fromIdx][0].content && getForIdx($els[fromIdx][0], $req.str) === null ? $els[fromIdx][0].content.childNodes : $els[fromIdx];
	const $toEls = $els[toIdx][0].content && getForIdx($els[toIdx][0], req.str) == null ? $els[toIdx][0].content.childNodes : $els[toIdx];
	for (let j = 0; j < $fromEls.length; j++) {
		if ($fromEls[j] instanceof HTMLElement) {
			$goCopy($fromEls[j], $toEls[j], copyFunc);
		}
	}
}
function for_clone$e(req, $fr, $src, $before, idx) {
	const $new = [];
	const $srcLen = $src.length;
	for (let j = 0; j < $srcLen; j++) {
		$new.push(this.insertBefore($fr, this.cloneNode($src[j]), $before));
	}
	return $new;
}
function getForIdxName(str) {
	return forIdxAttrName + "_" + str;
}
function getForIdx($e, str) {
	return $e.getAttribute(getForIdxName(str));
}
//todo
// 1) Можно оптимизировать клонирование, так как сейчас мы клонируем 0-й элемент - и если он состоит из нескольких тегов - то они будут склонированы - но если эти несколько тегов являются результатом вложенного цикла, то их все копированить не нужно - достаточно только первого
