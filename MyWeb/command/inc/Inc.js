import getRequest from "../../../url/getRequest.js";
import getUrl from "../../../url/getUrl.js";
import config from "../../../config/config.js";
import CloneNodeOn from "../../dom/CloneNodeOn.js";
import Animation from "../../render/Animation.js";
import LocalCounter from "../../render/LocalCounter.js";
import RenderRes from "../../render/RenderRes.js";
import Command from "../Command.js";
import IncLoading from "./IncLoading.js";
import Include from "./Include.js";

export default class Inc extends Command {
	incCache = new Map();
	//private
	incScriptCache = new Map();
	//private
	waitingStack = new Map();
	reset() {
		this.incCache.clear();
		this.incScriptCache.clear();
		this.waitingStack.clear();
	}
	render(req) {
		return this.my.eval2(req, req.$src, true)
			.then(val => this.renderByValue(req, val));
//			.then(val => this.getIncude(req, val))
//			.then(include => this.inc_render(req, include));
	}
	q_render(req, arr, isLast) {
		return this.my.q_eval2(req, arr, isLast)
			.then(vals => {
				const arrLen = arr.length,
					res = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast.has(i)) {
						res[i] = this.renderByValue(this.my.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), vals[i]);
//						res[i] = getIncude(req, vals[i]);
					}
				}
				return res;
/*
				return Promise.all(res)
					.then(includes => {
						for (let i = 0; i < arrLen; i++) {
							if (!isLast.has(i)) {
								res[i] = inc_render(my.createReq(arr[i].$src, req.str, req.expr, arr[i].scope, req.sync), includes[i]);
							}
						}
						return res;
					});*/
			});
	}
	get$first($src, str, expr, pos) {
		if ($src.nodeType === 1 && !this.isRenderdInc($src, str)) {
			return $src;
		}
		if ($src.nodeType === 8 && $src.textContent === "inc_begin") {
			return $src;
		}
		const srcBy$src = this.my.context.srcBy$src;
		for (let $i = $src, count = 0; $i !== null; $i = $i.previousSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			count = this.getIncCount($i, str, expr, pos);
			for ($i = $i.previousSibling; $i !== null; $i = $i.previousSibling) {
				const iSrc = srcBy$src.get($i);
				if (iSrc !== undefined && iSrc.isCmd || $i.nodeType !== 8) {
					continue;
				}
				const t = $i.textContent;
				if (t === "inc_begin") {
					if (count === 0) {
						return $i;
					}
					count--;
				} else if (t === "inc_end") {
					count++;
				}
			}
			break;
		}
		throw this.my.getError(new Error(`>>>mw inc:incGet$first: Not found <!--inc_begin-->: "${str}", "${expr}", ${pos}`), $src);
	}
	get$els($src, str, expr, pos) {
//console.log("inc get$els", $src, str, expr)
		if ($src.nodeType === 1 && !this.isRenderdInc($src, str)) {
			return [$src];
		}
		const $els = [],
			srcBy$src = this.my.context.srcBy$src;
		for (let $i = this.get$first($src, str, expr, pos), count = 0; $i !== null; $i = $i.nextSibling) {
			$els.push($i);
			const iSrc = srcBy$src.get($i);
			if (iSrc === undefined || !iSrc.isCmd) {
				continue;
			}
			count = this.getIncCount($i, str, expr, pos);
			for ($i = $i.nextSibling; $i !== null; $i = $i.nextSibling) {
				$els.push($i);
				const iSrc = srcBy$src.get($i);
				if (iSrc !== undefined && iSrc.isCmd || $i.nodeType !== 8) {
					continue;
				}
				const t = $i.textContent;
				if (t === "inc_end") {
					if (count === 0) {
						return $els;
					}
					count--;
				} else if (t === "inc_begin") {
					count++;
				}
			}
			break;
		}
		throw this.my.getError(new Error(`>>>mw inc:incGet$els: Not found <!--inc_begin-->: "${str}", "${expr}", ${pos}`), $src);
	}
	//private
	renderByValue(req, val) {
//console.info("inc", req);
		const include = this.getIncude(req, val);
		if (include === null) {
			return new RenderRes(true);
		}
		const pos = -1,
			$els = this.get$els(req.$src, req.str, req.expr, pos),
			$elsLen = $els.length,
			srcBy$src = this.my.context.srcBy$src,
			oldVal = srcBy$src.get(req.$src).getIdx(req.str);
//todo
		for (let i = 0; i < $elsLen; i++) {
			const iSrc = srcBy$src.get($els[i]);
			if (iSrc !== undefined && !req.sync.local.has(iSrc.id)) {
				req.sync.local.set(iSrc.id, new LocalCounter());
			}
		}
//console.log(111, req, $els, oldVal, srcBy$src.get(req.$src), include);
//alert(1);
		//если выражение вернуло Request или Response, то такой запрос будет всегда запрашиваться
//todo если объект тогда новый
		if ($elsLen !== 1 && oldVal === include.key) {//уже в доме
//console.log(444, $els, req, `${$elsLen} !== 1 && ${oldVal} === ${include.key}`, $elsLen !== 1 && oldVal === include.key);
//alert(22);
//			return $elsLen > 3 ? this.getInc(req, include, $els, $elsLen) : null;//если много тегов, тогда ренедрим их или продолжаем рендер следующей команды
			if ($elsLen === 3) {
				return null;
			}
			return this.renderI(req, $els[0], $els[$elsLen - 1], (req, $e) => this.renderInc(req, $e))//todo?
				.then($last => this.readyInc(req, include, $last));//если много тегов, тогда ренедрим их или продолжаем рендер следующей команды
		}
		const $last = $els[$elsLen - 1];
		if (include.readyState === "complete") {
			this.getNewInc(req, include, oldVal, $els, $elsLen, null);
			return new RenderRes(true, null, $last);
		}
		const loading = new IncLoading(req);
		if (loading.isShow) {
//			showLoading(req.$src, () => include.readyState === "complete", loading.type, loading.waitTime);
			this.my.showLoading(req.$src, () => false, loading.type, loading.waitTime);
		}
		if (!this.waitingStack.has(include.key)) {
			this.waitingStack.set(include.key, (include.res === null ? fetch(include.req)
				.then(res => res.text()) : include.res.text())
				.then(html => {
					this.waitingStack.delete(include.key);
					return this.createIncFragment(req, include, html);
				}));
		}
		const w = this.waitingStack.get(include.key);
		req.sync.afterAnimations.add(new Animation(() => w
			.then(() => req.sync.stat === 0 && this.getNewInc(req, include, oldVal, $els, $elsLen, loading)), req.sync.local, 0));
		return new RenderRes(true, null, $last);
	}
	//private
	getIncude(req, val) {
		if (typeof val !== "string") {
			const r = getRequest(val, "");
			if (r === null) {
				return null;
			}
//todo так как у респонса неполчится узнать гет ли он - то все добовляем кэш - А при использовании в строке в фетч - он всегда будет разный ...
			if (r.method === "GET" || r.method === undefined) {
				const include = this.incCache.get(r.url);
				if (include !== undefined) {
					return include;
				}
			}
			const inc = r instanceof Request ? new Include("loading", r.url, r, null) : new Include("loading", r.url, null, r);
			this.incCache.set(inc.key, inc);
			return inc;
		}
		if (val === "") {
			return null;
		}
		const r = getRequest(val, this.getTopUrl(this.my.context.srcBy$src.get(req.$src), req.str)),
			include = this.incCache.get(r.url);
		if (include !== undefined) {
			return include;
		}
		const inc = new Include("loading", r.url, r, null);
		this.incCache.set(inc.url, inc);
		return inc;
	}
	//private
	async createIncFragment(req, include, html) {
		const $fr = this.my.context.document.createDocumentFragment(),
			$div = this.my.context.document.createElement("div");
		$div.innerHTML = html;
		for (let $i = $div.firstChild; $i !== null; $i = $div.firstChild) {
			$fr.appendChild($i);
		}
		if (this.my.createLineNo) {
			this.my.createLineNo(include.url, html, $fr);
		}
		this.my.joinText($fr);
		include.$tags = [];
//		include.$tags = [...$fr.querySelectorAll("link[rel]")];
		const $links = $fr.querySelectorAll("link"),
			$linksLen = $links.length;
		for (let i = 0; i < $linksLen; i++) {
			const $i = $links[i];
			if ($i.getAttribute("rel") !== null) {
				include.$tags.push($i);
			}
		}
		for (const $i of include.$tags) {
			const uri = $i.getAttribute("href");
			if (uri) {
				const url = getUrl(uri, include.url);
				if (uri !== url) {
					$i.setAttribute("href", url);
				}
			}
		}
//		include.$tags.push(...$fr.querySelectorAll("style"));
		const $styles = $fr.querySelectorAll("style"),
			$stylesLen = $styles.length;
		for (let i = 0; i < $stylesLen; i++) {
			include.$tags.push($styles[i]);
		}
		const $scripts = $fr.querySelectorAll("script");
		if ($scripts.length !== 0) {
			await this.createIncScripts(req, include, $scripts);
		}
		if (include.$tags.length !== 0) {
//todo может быть просто вставить?
//--			req.sync.animations.add(new Animation(() => {//todo- если так сделать то онрендер на тегах не сработает - пусть так
				if (include.$tags[0].parentNode === this.my.context.document.head) {
//todo такого не долждно быть - можно удалять
console.warn("applyIncFragment", include.$tags, req);
//alert(1);
				}
				for (const $i of include.$tags) {
					this.my.document.head.appendChild($i);
				}
//--			}, req.sync.local, 0));
		}
		include.$fr = $fr;
		include.readyState = "complete";
	}
	//private
	createIncScripts(req, include, $scripts) {
		const $sLen = $scripts.length,
			scripts = new Array($sLen);
		for (let i = 0; i < $sLen; i++) {
			scripts[i] = this.createIncScript(req, include, $scripts[i]);
		}
		return Promise.all(scripts);
	}
	//private
	createIncScript(req, include, $e) {
		$e.parentNode.removeChild($e);
		const origUrl = $e.getAttribute("src"),
			url = origUrl !== null ? getUrl(origUrl, include.url) : null;
		if (url !== origUrl) {
			$e.setAttribute("src", url);
		}
		if ($e.type === "module") {
			if (url !== null) {
//				try {
					return import(url)
						.then(m => this.incToScope(m, include))
						.catch(err => {
							throw this.checkScript(err, $e, req, url);
						});
//				} catch (err) {
//					throw this.checkScript(err, $e, req, url);
//				}
			}
			const uurl = URL.createObjectURL(new Blob([$e.textContent], {
				type: "text/javascript"
			}));
//			try {
				return import(uurl)
					.then(m => {
//						if (my.debugLevel !== 0) {//todo
							URL.revokeObjectURL(uurl);
//						}
						this.incToScope(m, include);
					})
					.catch(err => {
//						if (my.debugLevel !== 0) {//todo
							URL.revokeObjectURL(uurl);
//						}
						throw this.checkScript(err, $e, req);
					});
//			} catch (err) {
////				if (my.debugLevel !== 0) {//todo
//					URL.revokeObjectURL(uurl);
////				}
//				throw this.checkScript(err, $e, req);
//			}
//			return;
		}
		if (url === null) {
			this.runIncScript(req, $e.textContent, $e, url);
			return;
		}
		const s = this.incScriptCache.get(url);
		if (s !== undefined)  {
			this.runIncScript(req, s, $e, url);
			return;
		}
		return fetch(url, config.defRequestInit)
			.then(res => {
				if (res.ok) {
					return res.text();
				}
				throw this.my.getError(new Error(`>>>mw inc:createIncScript: Request stat ${res.status}`), req.$src, req);
			})
			.then(text => {
				this.incScriptCache.set(url, text);
				this.runIncScript(req, text, $e, url);
			});
	}
	//private
	incToScope(m, include) {
		include.scope = {};
		for (const i in m) {
			const j = m[i];
			include.scope[j.name !== undefined ? j.name : i] = j;
		}
	}
	//private
	scopeToInc(include, req) {
		if (include.scope === null) {
			return;
		}
		for (const n in include.scope) {
			req.scope[config.p_target][n] = include.scope[n];
		}
	}
	//private
	runIncScript(req, text, $e, url) {
		try {
//			new Function(text).apply($e);
			self.eval(text);
		} catch (err) {
			throw this.checkScript(err, $e, req, url);
		}
	}
	//private
	checkScript(err, $e, req, url) {
		if (url) {
			return this.my.getError(error, $e, req, null, url, err.lineNumber, err.columnNumber);
		}
		if (my.getLineNo === undefined) {
			return this.my.getError(err, $e, req);
		}
		const line = my.getLineNo($e),
			numIdx = line.lastIndexOf(":");
		return this.my.getError(err, $e, req, null, line.substr(0, numIdx), Number(line.substr(numIdx + 1)) - 1 + err.lineNumber);
	}
//new
	//private
	getNewInc(req, include, oldVal, $els, $elsLen, loading) {
		req.sync.animations.add(new Animation(() => {
			const $new = this.cloneIncFragment(req, include, oldVal, loading),
				$src = $new.firstChild,
				$last = $new.lastChild;
			this.getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src);
			req.sync.afterAnimations.add(new Animation(() => {
				this.scopeToInc(include, req);
				return this.renderI(req, $src, $last, (req, $e) => this.renderNewInc(req, $e))//todo?
					.then($last => this.readyInc(req, include, $last));
			}, req.sync.local, 0))
		}, req.sync.local, 0));
/*//!!этот вариант плох тем, что если после анимации произойдёт отмена, то последующие рендеры будут считать что вставка уже отрендерена - это плохо для слотов
		const $new = cloneIncFragment(req, include, oldVal, loading),
			$src = $new.firstChild,
			$last = $new.lastChild;
		req.sync.animations.add(new Animation(() => getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src), req.sync.local, 0));
		req.sync.afterAnimations.add(new Animation(() => {
			scopeToInc(include, req);
			return renderI(req, $src, $last, renderNewInc)
				.then($last => readyInc(req, include, $last));
		}, req.sync.local, 0));*/
	}
	//private
	getNewIncInsert(req, oldVal, $els, $elsLen, $new, $src) {
		const srcBy$src = this.my.context.srcBy$src;
		let newSrcId = 0;
		for (let $i = $new.firstChild; $i !== null; $i = $i.nextSibling) {
			const iSrc = srcBy$src.get($i);
			if (iSrc !== undefined) {
				newSrcId = iSrc.id;
				break;
			}
		}
		const $parent = $els[0].parentNode,
			$lastNext = $els[$elsLen - 1].nextSibling,
			src = srcBy$src.get(req.$src);
		for (let iSrc, i = 0;; i++) {
			iSrc = srcBy$src.get($els[i]);
			if (iSrc === undefined) {
				this.my.removeChild($els[i], req);
				continue;
			}
//			if (newSrcId !== 0) {
				const vIds = this.my.context.srcById.get(newSrcId).descr.varIds;
				for (const vId of iSrc.descr.varIds) {
					vIds.add(vId);
					this.my.context.srcIdsByVarId.get(vId).add(newSrcId);
/*
					const sIds = this.my.context.srcIdsByVarId.get(vId);
if (sIds === undefined) {
//todo
console.warn("inc.js");
alert(1)
//						continue;
}
					sIds.add(newSrcId);*/
				}
//			}
			do {
				if (iSrc !== undefined) {
					const l = req.sync.local.get(iSrc.id);
					l.animationsCount = -1;
					l.newSrcId = newSrcId;
					if (iSrc.id === req.sync.renderParam.sId) {// && $els[i][p_srcId] !== req.$src[p_srcId]) {
						req.sync.renderParam.sId = newSrcId;
					}
				}
				this.my.removeChild($els[i]);
				iSrc = srcBy$src.get($els[i]);
			} while (++i < $elsLen);
			break;
		}
//todo	if (oldVal !== undefined) {
//			incClear(req.str, src, oldVal);
//		}
		$parent.insertBefore($new, $lastNext);
	}
/*
function incClear(str, src, incKey) {
	incClearByKey(incKey);
	for (const n of getAttrItAfter(src.descr.attr.keys(), str, false)) {
		if (this.my.context.commandWithArgsByStr.get(n).commandName !== config.incCmdName) {
			break;
		}
		incKey = src.getIdx(n);
		if (incKey === undefined) {
			break;
		}
		incClearByKey(incKey);
	}
}
export function incClearByKey(key) {
	const inc = this.incCache.get(key);
console.error(1, key, inc?.counter);
	if (--inc.counter !== 0) {
		return;
	}
	this.incCache.delete(key);
	if (inc.$tags === null) {
		return;
	}
	for (let i = inc.$tags.length - 1; i > -1; i--) {
		const $i = inc.$tags[i];
		$i.parentNode.removeChild($i);
//or		this.my.context.document.head.removeChild($i);
	}
}*/
//function getNewIncRender(req, include, $src, $last) {
//	if (include.scope !== null) {
//		for (const n in include.scope) {
//			req.scope[config.p_target][n] = include.scope[n];
//		}
//	}
//	return renderI(req, $src, $last, renderNewInc)
//		.then($last => readyInc(req, include, $last));
//}
	//private
	renderNewInc(req, $e) {
/*
		const afterAttr = new Map(),
			descr = my.context.srcBy$src.get($e).descr,
			attrIt = descr.attr.entries();
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			const [n, v] = i.value,
				cn = my.context.commandWithArgsByStr.get(n).commandName;
//todo inc args --
//			if (v && ((cn !== config.incCmdName && cn !== config.fetchCmdName) || !my.context.commandWithArgsByStr.get(n).args[0]) && cn !== config.elseCmdName && cn !== config.defaultCmdName && cn !== config.onCmdName) {
//todo наверное всё же не так! для иквов фетчей это может стать проблемой
			if (v && cn !== config.elseCmdName && cn !== config.defaultCmdName && cn !== config.onCmdName) {
//todo
console.warn(n, v);
				await this.my.eval2(my.createReq($e, n, v, req.scope, req.sync), $e, true);//привязываем к новым тегам команды ДО
			}
			if (n !== req.str) {
				continue;
			}
			for (i = attrIt.next(); !i.done; i = attrIt.next()) {
				afterAttr.set(i.value[0], i.value[1]);
			}
			return renderTag($e, req.scope, afterAttr, req.sync);
		}
		throw new Error("inc.js");*/
		return this.my.renderTag($e, req.scope, req.str, req.sync);
	}
//current
//function getInc(req, include, $els, $elsLen) {
//	return renderI(req, $els[0], $els[$elsLen - 1], renderInc)
//		.then($last => readyInc(req, include, $last));
//}
	//private
	renderInc(req, $e) {
		return this.my.renderTag($e, req.scope, req.str, req.sync);
	}
	//private
	async renderI(req, $e, $last, h) {
		const srcBy$src = this.my.context.srcBy$src;
		do {
			const iSrc = srcBy$src.get($e);
			if (iSrc !== undefined && iSrc.isCmd) {//это когда template и в нем скрыта тектовая нода
				$e = await h(req, $e);
				if (req.sync.stat !== 0) {
//					console.error(7878787, iSrc.id, $e, $last, req);
//					alert(11);
					return $last;
				}
/*
//todo--
				if ($e.parentNode !== $last.parentNode) {
					console.error(555555555, iSrc.id, $e, $last, req);
					alert(11);

					return $last;
				}
				if (!$last.nextSibling === $e) {
//todo--
					console.warn(666666666, $e, $last, req);
					alert(11);

					return $last;
				}*/
			}
			if ($e === $last) {
				return $last;
			}
			$e = $e.nextSibling;
		} while ($e !== null);
		throw new Error("inc.js");
	}
//todo replace inline
	readyInc(req, include, $last) {
		return new RenderRes(true, null, $last);
	}
	//private
	cloneIncFragment(req, include, oldVal, loading) {
//		const $fr = this.my.cloneNode(req, include.$fr),
		const $fr = include.$fr.cloneNode(true),
			srcBy$src = this.my.context.srcBy$src,
			src = srcBy$src.get(req.$src),
			descr = src.descr,
			attrs = req.$src.attributes,
			attrsLen = attrs.length,
			curAttr = new Map(),
			isR = oldVal !== undefined,
//			asOneIdx = src.asOneIdx !== null ? src.asOneIdx : new Map(),
//			idx = src.idx !== null ? src.idx : new Map(),
			save = isR ? src.save : (src.save !== null ? src.save : new Map()),
			on = [],
			isAsOne = src.asOneIdx !== null,
			isIdx = src.idx !== null;
		if (isAsOne || isIdx) {
			for (const n of src.getAttrItAfter(req.str, false)) {
				if (isAsOne) {
					src.asOneIdx.delete(n);
				}
				if (isIdx) {
					src.idx.delete(n);
				}
			}
		}
		if (isR) {
			for (const [n, v] of src.save.get(req.str)) {
				curAttr.set(n, v);
			}
		} else {
			const skipAttrs = new Set();
			if (loading !== null && loading.isShow) {
				const sId = src.id,
					l = this.my.context.loadingCount.get(sId),
					lCount = l.get("") - 1;
				l.set("", lCount);
				if (lCount <= 0) {
					skipAttrs.add(config.isFillingName);
				}
				if (loading.type !== "") {
					const lCount = l.get(loading.type) - 1;
					l.set(loading.type, lCount);
					if (lCount <= 0) {
						skipAttrs.add(config.isFillingName + config.isFillingDiv + loading.type);
					}
				}
			}
			const saveI = new Map();
			save.set(req.str, saveI);
			for (let i = 0; i < attrsLen; i++) {
				const a = attrs[i];
				if (skipAttrs.has(a.name)) {
					continue;
				}
				curAttr.set(a.name, a.value);
				//todo
				if ((my.debugLevel !== 0 || a.name.indexOf(config.idxName) !== 0 && a.name.indexOf(config.asOneIdxName) !== 0) && a.name.indexOf(config.isFillingName) !== 0) {
					saveI.set(a.name, a.value);
				}
			}
		}
		for (const [n, v] of descr.attr) {
			if (n === req.str) {
				break;
			}
			const rc = this.my.context.commandWithArgsByStr.get(n);
			if (rc.commandName === config.onCmdName) {
				on.push(new CloneNodeOn(rc.command, n, v));
			}
		}
		const onLen = on.length;
		for (let k, nn, j, i = 0, $i = $fr.firstChild; $i !== null; i++, $i = $i.nextSibling) {
			if ($i.nodeType !== 1) {
				continue;
			}
			const iAttrs = $i.attributes,
				iAttrsLen = iAttrs.length,
				newAttr = new Map();
			for (let i = 0; i < iAttrsLen; i++) {
				const a = iAttrs[i];
				newAttr.set(a.name, a.value);
			}
			for (const n of newAttr.keys()) {
				$i.removeAttribute(n);
			}
			const curAttrIt = curAttr.entries(),
				nSet = new Set();
			for (j = curAttrIt.next(); !j.done; j = curAttrIt.next()) {
				const [n, v] = j.value;
				$i.removeAttribute(n);
				$i.setAttribute(n, v);
				nSet.add(n);
				if (n !== req.str) {
					continue;
				}
				for (const [n, v] of newAttr) {
					if (!this.my.addStrToCommandWithArgsIfThatCommend(n)) {
						$i.removeAttribute(n);
						$i.setAttribute(n, v);
						continue;
					}
					nn = n;
					while (nSet.has(nn)) {
						nn += config.commandArgsDiv;
					}
					nSet.add(nn);
					$i.setAttribute(nn, v);
				}
				for (j = curAttrIt.next(); !j.done; j = curAttrIt.next()) {
					const [n, v] = j.value;
					if (!this.my.addStrToCommandWithArgsIfThatCommend(n)) {
						$i.removeAttribute(n);
						$i.setAttribute(n, v);
						continue;
					}
					nn = n;
					while (nSet.has(nn)) {
						nn += config.commandArgsDiv;
					}
					$i.setAttribute(nn, v);
				}
				break;
			}
			this.my.preRender($i, false);
			const iSrc = srcBy$src.get($i);
			if (isAsOne && src.asOneIdx.size !== 0) {
				iSrc.asOneIdx = new Map(src.asOneIdx);
			}
			if (isIdx) {//todo  почему тут не смотрим на длину?
				iSrc.idx = new Map(src.idx);
			}
			iSrc.save = this.createSave(save);
			if (onLen !== 0) {
				for (k = 0; k < onLen; k++) {
					const o = on[k];
					o.command.render(this.my.createReq($i, o.str, o.expr, req.scope, req.sync));
				}
			}
//!!2
			if (my.debugLevel !== 0) {
				if (isAsOne) {
					for (const [n, v] of src.asOneIdx) {
						$i.setAttribute(config.asOneIdxName + n, v);
					}
				}
				if (isIdx) {
					for (const [n, v] of src.idx) {
						$i.setAttribute(config.idxName + n, v);
					}
				}
			}
			iSrc.setIdx(req.str, include.key);
		}
		let isHas$e = false;
		for (let $i = $fr.firstChild; $i !== null; $i = $i.nextSibling) {
			if ($i.nodeType === 1) {
				isHas$e = true;
				break;
			}
		}
		if (!isHas$e) {//!$fr.firstElementChild) {
			return $fr;
		}
//тут что бы не создовать sId => preRender
//todo
		if (!isR) {//со слотами такая штука: если уже была вставка - это не делаем, так как путаница получиться
			this.makeSlots(req, $fr);
		}
		$fr.insertBefore(this.my.context.document.createComment("inc_begin"), $fr.firstChild);
		$fr.appendChild(this.my.context.document.createComment("inc_end"));
		return $fr;
	}
	//private
	makeSlots(req, $fr) {
		const srcBy$src = this.my.context.srcBy$src,
			$slots = $fr.querySelectorAll("slot"),
//			$slots = $fr.getElementsByTagName("slot"),
			$slotsLen = $slots.length,
			$parent = req.$src.parentNode;
		let $freeSlot = null;
		for (let $i, i = 0; i < $slotsLen; i++) {
			const $s = $slots[i],
				n = $s.name;
			if (n === "" && !$freeSlot) {
				$freeSlot = $s;
				continue;
			}
/*
			const $v = req.$src.querySelectorAll(`[slot="${n}"]`),
				$vLen = $v.length;
			for (let j = 0; j < $vLen; j++) {
//				const jSrc = this.my.context.srcBy$src.get($v[j]);
//				if (jSrc === undefined) {
//					$s.appendChild($v[j]);
//					continue;
//				}
//				const get$elsByStr = jSrc.descr.get$elsByStr;
				const $j = $v[j],
					get$elsByStr = this.my.context.srcBy$src.get($j).descr.get$elsByStr;
				if (get$elsByStr === null) {
					$s.appendChild($j);
					continue;
				}
				const $els = get$els($j, get$elsByStr, ""),
					$elsLen = $els.length;
				for (let k = 0; k < $elsLen; k++) {
					$s.appendChild($els[k]);
				}
			}*/
			$i = req.$src.firstChild;
			if ($i === null) {
				continue;
			}
			const $p = [];
			do {
//////////////////////
				if ($i.nodeType === 1) {
					if ($i.getAttribute("slot") === n) {
						const $j = $i,
							jSrc = srcBy$src.get($j);//,
//							get$elsByStr = jSrc.descr.get$elsByStr;
						$i = $i.previousSibling;
						if ($i === null) {
							$i = $j.parentNode;
						}
						if (jSrc.descr.get$elsByStr === null) {
							$s.appendChild($j);
							continue;
						}
						const $els = jSrc.get$els(""),
							$elsLen = $els.length;
						for (let k = 0; k < $elsLen; k++) {
							$s.appendChild($els[k]);
						}
					}
					if ($i.firstChild !== null) {
						$i = $i.firstChild;
						continue;
					}
//					if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
//						$p.push($i);
//						$i = $i.content.firstChild;
//						continue;
//					}
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
//					if ($i.nodeType === 11) {
//						$i = $p.pop();
//					}
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
		if ($freeSlot === null) {
			return;
		}
		for (let $i = req.$src.firstChild; $i !== null; $i = req.$src.firstChild) {
			$freeSlot.appendChild($i);
		}
	}
	getIncCount($i, str, expr, pos) {
//todo , expr, pos
		let count = 0;
		const attrIt = this.my.context.srcBy$src.get($i).getAttrItAfter(str, false);
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			if (this.my.context.commandWithArgsByStr.get(i.value).commandName !== config.incCmdName) {
				continue;
			}
			if (!this.isRenderdInc($i, i.value)) {
				return count;
			}
			count++;
		}
		return count;
	}
	isRenderdInc($i, str) {
		const srcBy$src = this.my.context.srcBy$src;
		if ($i.nodeType === 8 && $i.textContent === "inc_end") {
			while (!srcBy$src.has($i) && $i !== null) {
				$i = $i.previousSibling;
			}
		} else {
			while (!srcBy$src.has($i) && $i !== null) {
				$i = $i.nextSibling;
			}
		}
		const iSrc = srcBy$src.get($i);
		if (str) {
			return iSrc.getIdx(str) !== undefined;
		}
		for (const n of iSrc.descr.attr.keys()) {
			if (this.my.context.commandWithArgsByStr.get(n).commandName === config.incCmdName) {
				return iSrc.getIdx(n) !== undefined;
			}
		}
	}
	//private
	createSave(save) {
		const s = new Map();
		for (const [n, v] of save) {
			s.set(n, new Map(v));
		}
		return s;
	}
	//private
	getTopUrl(src, str) {
		if (str !== "") {
			const topUrl = this.getAttrTopUrl(src, str);//из-за if ($i[config.p_topUrl]) { - так как это должэно работать только для робителей
			if (topUrl !== "") {
				return topUrl;
			}
		}
		const srcBy$src = this.my.context.srcBy$src;
		for (let $i = this.my.context.$srcById.get(src.id).parentNode; $i !== this.my.context.rootElement; $i = $i.parentNode) {
/*--
			if ($i.nodeType === 11) {//рендер внутри фрагмента возможен, например, for
//console.log("getTopUrl", $src, str);
				return getTopUrl($srcById.get(descrById.get(srcBy$src.get($e).descrId).sId)]);
			}*/
			const topUrl = this.getAttrTopUrl(srcBy$src.get($i));
			if (topUrl !== "") {
				return topUrl;
			}
			if ($i[config.p_topUrl] !== undefined) {
				return $i[config.p_topUrl];
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
				if (this.my.context.commandWithArgsByStr.get(n).commandName === config.incCmdName) {//!!maybe todo пока работает только для inc
					topUrl = src.getIdx(n);
				}
			}
			return topUrl;
		}
		for (const n of nattr) {
			if (this.mycontext.commandWithArgsByStr.get(n).commandName === config.incCmdName) {//!!maybe todo пока работает только для inc
				topUrl = src.getIdx(n);
			}
		}
		return topUrl;
	}
};
