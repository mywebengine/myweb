/*!
 * myweb/tpl.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 */
import {cmdArgsBegin, cmdArgsDiv, incCmdName, orderCmdName, scopeCmdName, htmlCmdName, textCmdName, renderEventName, resVarName, tplProxyTargetPropName} from "./tpl/const.js";
import {getId, wrapDeep, $goCopy, $goTagsDeep, getMustacheBlocks, spaceRe} from "./util.js";

import scopeCmd from "./tpl/cmd/scope.js";
//import {ifCmd, elseifCmd, elseCmd, switchCmd, caseCmd, defaultCmd} from "./tpl/cmd/if.js";
import {ifCmd, switchCmd} from "./tpl/cmd/if.js";
import forCmd from "./tpl/cmd/for.js";
import attrCmd from "./tpl/cmd/attr.js";
import htmlCmd from "./tpl/cmd/html.js";
import incCmd, {getIncVal} from "./tpl/cmd/inc.js";
import fetchCmd from "./tpl/cmd/fetch.js";

import onCmd from "./tpl/cmd/on.js";

export class Tpl {
	constructor($src = document.documentElement, delay = 0) {
		this.delay = delay;
		this.$src = $src;

		this.descr = new Map();
		this.$srcById = new Map();//элементам присаоен ИД для того чтобы избежать удаления из ВэйкМапа при удалении элемента, так как приходится удалять в Прокми на Гет. Так же выигрыщ в том что мы можем хранить Сет элементов под одним и тем же ИД
		this.$srcByVar = new WeakMap();
		this.$srcByVarProp = new WeakMap();

		this.sync = 0;
		this.renderStack = new Map();
		this.renderAsyncStack = new Map();

		this._reqCmd = new Map();
		this._func = new Map();
	}
	go($src = this.$src, delay = this.delay, scope, attr) {
		const f = () => {
			$src.dispatchEvent(new CustomEvent(renderEventName, {
				detail: {
					tpl: this
				}
			}));
		};
		if (!$src.dataset.isRendered || $src.dataset.isRendered == "false") {
			if (delay >= 0) {
				return this.async($src, delay, scope, attr).then(f);
			}
			this.render($src, scope, attr);
		} else {
			this.linker($src, scope, attr);
		}
		return Promise.resolve().then(f);
	}
	render($src = this.$src, scope = this.getScope($src), attr) {
		if ($src instanceof HTMLElement) {
			return this.renderTag($src, scope, attr);
		}
		if ($src instanceof Text) {
			return this.renderText($src, scope);
		}
		return $src;
	}
	renderTag($src, scope = this.getScope($src), attr = this.getAttrs($src)) {
		for (const [n, v] of attr) {
//if (this.getReqCmd(n)) {
//	console.log("render" + n, v, $src, scope);
//}
			const res = this.execRender($src, n, v, scope);
			if (!res) {
				continue;
			}
//console.log("render", n, v, $src, res);
			if (res.$e) {
				this.removeAllOnRenderStack($src);
				$src = res.$e;
			}
			if (res.isLast) {
				this.removeAllOnRenderStack($src);
//console.log("render exit", $src, $src.nextSibling, $src.previousSibling, attr);
				return $src;
			}
		}
		if ($src instanceof HTMLElement) {
			if (!$src.isCustomHTML) {
				for (let $i = $src.firstChild; $i; $i = $i.nextSibling) {
					$i = this.render($i, scope);
				}
			}
			this.removeAllOnRenderStack($src);
		}
//console.log("render exit1", $src, attr);
		return $src;
	}
	removeAllOnRenderStack($e) {
		this.renderStack.delete($e);
		this.renderAsyncStack.delete($e);
	}
/*
	removeAllOnRenderStack($e, id = $e[getId.propName]) {
		this.renderStack.delete(id);
		this.renderAsyncStack.delete(id);
		for (const stack of [this.renderAsyncStack, this.renderStack]) {
			this.removeOnRenderStack(stack, $e, id);
		}
	}
	removeOnRenderStack(stack, $e, id) {
		const $srcMap = stack.get(id);
		if ($srcMap) {
//			for (const [$src, r] of $srcMap) {
//				r.resolve($src);
//			}
			$srcMap.delete($e);
			if (!$srcMap.size) {
				stack.delete(id);
//				console.log("del", id);
			}
		}
	}*/
	renderText($src, scope) {//когда рендерится - то он делает это в фрагменте и родители выше фрагмента не доступны
		if ($src.isTextRendered) {
			return $src;
		}
		const text = $src.textContent;
		const blocks = getMustacheBlocks(text);
		const blocksLen = blocks.length;
		if (!blocksLen || (blocksLen == 1 && !blocks[0].expr)) {
			$src.isTextRendered = true;
			return $src;
		}
		const $fr = document.createDocumentFragment();
		for (let i = 0; i < blocksLen; i++) {
			const b = blocks[i];
			if (b.expr) {
				const $i = this.appendChild($fr, document.createElement("span"));
				this.setAttribute($i, textCmdName, text.substring(b.begin, b.end));
				this.renderTag($i, scope);
			} else {
				this.appendChild($fr, document.createTextNode(text.substring(b.begin, b.end)))
					.isTextRendered = true;
			}
		}
		const $last = $fr.lastChild;
		$src.parentNode.replaceChild($fr, $src);
		return $last;
	}
	linker($src = this.$src, scope = this.getScope($src), attr = this.getAttrs($src)) {
//!!--
		if (!($src instanceof HTMLElement)) {
console.log("!!!!!!! is not tag", $src);
			return $src;
		}
		for (const [n, v] of attr) {
//if (this.getReqCmd(n)) {
//	console.log("linker" + n, v, $src, $src.parentNode, scope);
//}
			const res = this.execLinker($src, n, v, scope);
			if (!res) {
				continue;
			}
			if (res.$e) {
				$src = res.$e;
			}
			if (res.isLast) {
				return $src;
			}
		}
		if ($src instanceof HTMLElement) {
			for (let $i = $src.firstElementChild; $i; $i = $i.nextElementSibling) {
				$i = this.linker($i, scope);
			}
		}
		return $src;
	}
	async($src = this.$src, delay = this.delay, scope, attr) {
		const already = this.renderAsyncStack.get($src);
		if (already) {
			this._newSync = ++this.sync;
			already.promise;
		}
		const r = {
			scope,
			attr
		};
		this.renderAsyncStack.set($src, r);
		return r.promise = new Promise((resolve, reject) => {
			r.resolve = resolve;
			r.reject = reject;
			setTimeout(this._async.bind(this, ++this.sync, delay), delay);
		});
	}
	_async(sync, delay) {
		if (this._newSync) {
			this._newSync = undefined;
			setTimeout(this._async.bind(this, ++this.sync, delay), delay);
			return;
		}
		if (sync != this.sync) {
			return;
		}
if (self.debug) {
console.log("tpl async stack", Array.from(this.renderAsyncStack.keys()));
//alert(1);
}
		this.onbeforeasync();
this.isNotRender = function($src) {
			let $p = $src;
			while ($p = $p.parentNode) {
				if ($p instanceof DocumentFragment) {
//console.log(222222, $p);
					return $p;
				}
			}
}
		for (const [$src, r] of this.renderAsyncStack) {
			if (this.isNotRender($src)) {
				this.removeAllOnRenderStack($src);
//				r.resolve();
				continue;
			}
//console.log("_async begin", $src, r);//, this.get$srcDescr($src));
//			if ($src.parentNode) { //может так получиться, что элемент который нужно рендерить будет заменен другим, и тогда его не нужно рендерить
				try {
					this.render($src, r.scope, r.attr);
				} catch (err) {
					r.reject(err);
					break;
				}
//			}
			r.resolve();
//console.log("_async =>", $src);
		}
//console.log("_async_end =>");
		this.renderAsyncStack.clear();
		this.onasync();
	}
/*
	async($src = this.$src, delay = this.delay, scope, attr) {
		const already = this.renderAsyncStack.get($src);
		if (already) {
			this._newSync = ++this.sync;
			return $src;
		}
		this.renderAsyncStack.set($src, {
			scope,
			attr
		});
		setTimeout(this._async.bind(this, ++this.sync, delay), delay);
		return $src;
	}
	_async(sync, delay) {
		if (this._newSync) {
			this._newSync = undefined;
			setTimeout(this._async.bind(this, ++this.sync, delay), delay);
			return;
		}
		if (sync != this.sync) {
			return;
		}
console.log("_async stack", Array.from(this.renderAsyncStack.keys()));
		this.onbeforeasync();
		for (const [$src, r] of this.renderAsyncStack) {
//console.log("_async begin", $src, r, $src.parentNode, this.get$srcDescr($src));
			if ($src.parentNode) { //может так получиться, что элемент который нужно рендерить будет заменен другим, и тогда его не нужно рендерить
				this.render($src, r.scope, r.attr);
			}
//console.log("_async =>", $src);
		}
		this.renderAsyncStack.clear();
		this.onasync();
	}*/
	onbeforeasync() {
	}
	onasync() {
	}
/*
	getScopeWithCache($e, cache) {
		let scope = {};
		const $path = [];
		for (; $e && $e.parentNode; $e = $e.parentNode) {
			const s = cache.get($e);
			if (s) {
				scope = s;
				break;
			}
			$path.push($e);
		}
		for (let i = $path.length - 1; i > -1; i--) {
			cache.set($path[i], this.getScopeItem($path[i], scope));
		}
		return scope;
	}*/
	getScope($e) {
		const $path = [];//$e instanceof HTMLElement ? [$e] : [];
//!!!! для того что бы в скоуп не попали переменн цикла
//		const $path = [];
//!!_parent		for (; $e = $e.parentNode || $e._parentNode; $path.push($e));
		for (; $e = $e.parentNode; $path.push($e));
		const scope = {};
		for (let i = $path.length - 2; i > -1; i--) {
			//scope = 
			this.getScopeItem($path[i], scope);
		}
//console.log(11111111, $path, scope);
		return scope;
	}
	getScopeItem($e, scope) {
//!!_partent
		if ($e instanceof HTMLElement) {
			const attr = this.getAttrs($e);
			for (const [n, v] of attr) {
				//scope = 
				this.execGetScope($e, n, v, scope);
			}
		}
		return scope;
	}
	execRender($src, attrName, attrValue, scope) {
		const req = this.getReq($src, attrName, attrValue, scope);
		if (req && req.cmd.render) {
			return req.cmd.render.call(this, req);
		}
	}
	execLinker($src, attrName, attrValue, scope) {
		const req = this.getReq($src, attrName, attrValue, scope);
		if (req && req.cmd.linker) {
			return req.cmd.linker.call(this, req);
		}
	}
	execGetScope($src, attrName, attrValue, scope) {
		const req = this.getReq($src, attrName, attrValue, scope);
		if (req && req.cmd.getScope) {
			return req.cmd.getScope.call(this, req);
		}
		return scope;
	}
	getReq($src, str, expr, scope) {
		const reqCmd = this.getReqCmd(str);
		if (reqCmd) {
			return {
				cmd: reqCmd.cmd,
				args: reqCmd.args,
				str,
				expr,
				$src,
				scope
			};
		}
	}
	getReqCmd(str) {
		const already = this._reqCmd.get(str);
		if (already !== undefined) {
			return already || undefined;
		}
		const [cmdName, args] = this.getCmdArgs(str);
		const cmd = this.getCommand(cmdName);
		if (!cmd) {
			this._reqCmd.set(str, false);
			return;
		}
		const reqCmd = {
			cmd,
			args
		};
		this._reqCmd.set(str, reqCmd);
		return reqCmd;
//11		const reqCmd = this._getReqCmd(cmdName, args);
//		this._reqCmd.set(str, reqCmd || false);
//		if (reqCmd) {
//			return reqCmd;
//		}
	}
/*11
	_getReqCmd(cmdName, args) {
		const cmd = this.getCommand(cmdName);
		if (cmd) {
			return {
				cmd,
				args
			};
		}
	}*/
	getCmdArgs(str) {
		const i = str.indexOf(cmdArgsBegin);
		return i != -1 ? [str.substr(0, i), str.substr(i + 1).split(cmdArgsDiv)] : [str, []];
	}

	cloneNode($e) {
		return $e instanceof HTMLElement ? $goCopy($e, $e.cloneNode(true), this.copyDescr.bind(this)) : $e.cloneNode(true);
	}
/*--
	cloneNode($e) {
		return $goClone($e, document.createDocumentFragment(), this._clone.bind(this)).firstChild;
	}
	_clone($from, $to) {
		if ($from.tagName) {
			$to = $to.appendChild(document.createElement($from.tagName));
			this.copyDescr($from, $to);
			return $to;
		}
//		$to.appendChild(document.createTextNode($from.textContent));
		$to.appendChild($from.cloneNode());
	}*/
	replaceChild($new, $old) {
		return $goTagsDeep($old.parentNode.replaceChild($new, $old), this.clearTagProps.bind(this));
	}
	removeChild($e) {
		return $goTagsDeep($e.parentNode.removeChild($e), this.clearTagProps.bind(this));
	}
//!!!
	createDocumentFragment() {
		return document.createDocumentFragment();
	}
	insertBefore($parent, $e, $before) {
		return $parent.insertBefore($e, $before);
	}
	appendChild($parent, $e) {
		return $parent.appendChild($e);
	}
//!!!<--
	setAttribute($e, name, value) {
///console.log(1111111, $e, name, value)
		$e.setAttribute(name, value);
		this.getAttrs($e).set(name, value);
		switch (name) {
			case "value":
				if (value) {
					$e.value = value;
				} else {
//					delete $e.value;
				}
			break;
			case "checked":
				$e.checked = !!value;
			break;
		}
	}
	removeAttribute($e, name) {
		$e.removeAttribute(name);
		this.getAttrs($e).delete(name);
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
	getAttribute($e, name) {
		return this.getAttrs($e).get(name) || null;
	}*/
	getAttrs($e) {
		const d = this.get$srcDescr($e) || this.createTagDescr($e);
//		if (d) {
			return d.attr;
//		}
	}
	getAttrsBefore(attr, name) {
		const a = new Map();
		for (const [n, v] of attr) {
			if (n == name) {
				break;
			}
			a.set(n, v);
		}
		return a;
	}
	getAttrsAfter(attr, name) {
		const a = new Map();
		let f;
		for (const [n, v] of attr) {
			if (f) {
				a.set(n, v);
			} else if (n == name) {
				f = true;
			}
		}
		return a;
	}
	get$srcDescr($e) {
		return this.descr.get($e[getId.propName]);
	}
	createTagDescr($e) {
///!!_parent
//		if (!($e instanceof HTMLElement)) {
//			return;
//		}

		const d = {
			id: getId($e),
			attr: this.createAttr($e),
//			isAsOne: false,
			target: new Set()
		};
		this.descr.set(d.id, d);
		let $srcSet = this.$srcById.get(d.id);
		if (!$srcSet) {
			this.$srcById.set(d.id, $srcSet = new Set());//for clone
		}
		$srcSet.add($e);
		return d;
	}
	createAttr($e) {
		const attr = new Map();
		const order = $e.getAttribute(orderCmdName);
		if (order) {
			order.trim().split(spaceRe).forEach(n => {
				const v = $e.getAttribute(n);
				if (v) {
					attr.set(n, v);
				}
			});
		}
		const attrsLen = $e.attributes.length;
		for (let i = 0; i < attrsLen; i++) {
			const a = $e.attributes.item(i);
			if (!attr.has(a.name)) {
				attr.set(a.name, a.value);
			}
		}
		return attr;
	}
	getTopURLBy$src($src, incStr) {
		for (let $i = $src.parentNode; $i; $i = $i.parentNode) {
//		for (let $i = $src; $i; $i = $i.parentNode) {
			const d = this.get$srcDescr($i);
			if (!d) {
				continue;
			}
//			if (incStr && d.inc_url) {
			if (d.inc_url) {
				const topURL = d.inc_url[incStr];
				if (topURL) {
					return topURL;
				}
			}
			if (d.tpl_url) {
				return d.tpl_url;
			}
		}
	}
	show($e) {
//console.log(456, $e);
		if ($e.nodeName != "TEMPLATE") {
			return $e;
		}
//		const $new = $e.content.firstElementChild;
		const $new = $e.content.firstChild;
		this.moveProps($e, $new);
		$e.parentNode.replaceChild($new, $e);
		return $new;
	}
	hide($e) {
		if ($e.nodeName == "TEMPLATE") {
			return $e;
		}
//		const $p = $e.parentNode;

		$goTagsDeep($e, this.removeAllOnRenderStack.bind(this));

		const $new = document.createElement("template");
		this.moveProps($e, $new);
		$e.parentNode.replaceChild($new, $e);
		this.appendChild($new.content, $e);

//		$new.content._parentNode = $p;

		return $new;
	}
	moveProps($from, $to) {
		if (!($from instanceof HTMLElement && $to instanceof HTMLElement)) {
			return;
		}
//like as ssr
		for (const [name, value] of this.getAttrs($from)) {
			this.setAttribute($to, name, value);
		}
		const d = this.get$srcDescr($from);
		if (!d) {
			return;
		}
		$to[getId.propName] = d.id;
//		$from[getId.propName] = -1;
		const $srcSet = this.$srcById.get(d.id);
		$srcSet.delete($from);
		$srcSet.add($to);
	}
	copyDescr($from, $to) {
		const id = $from[getId.propName];
		if (id) {
			$to[getId.propName] = id;
//			if (!this.$srcById.has(id)) {
				this.$srcById.get(id).add($to);
//			}
		}
	}
	setDescrWithVars($fromDescr, $to, $toId) {
		$to[getId.propName] = $toId;
		this.$srcById.get($toId).add($to);
		const fromId = $fromDescr.id;
		for (const t of $fromDescr.target) {
//new!!
			this.descr.get($toId).target.add(t);

			const $srcByVar = this.$srcByVar.get(t);
			if ($srcByVar) {
				$srcByVar.add($toId);
			}
			const $srcByVarProp = this.$srcByVarProp.get(t);
			if ($srcByVarProp) {
				for (const $srcSet of $srcByVarProp.values()) {
//				for (const [pName, $srcSet] of $srcByVarProp) {
					if ($srcSet.has(fromId)) {
//console.log(2222, $to, $toId, pName, $srcSet, $srcByVarProp);
						$srcSet.add($toId);
					}
				}
			}
		}
	}
	clearTagProps($e) {
		const d = this.get$srcDescr($e);
		if (!d) {
			return;
		}

		this.removeAllOnRenderStack($e);

		const $srcById = this.$srcById.get(d.id);
		$srcById.delete($e);
		if ($srcById.size) {
			return;
		}
		this.$srcById.delete(d.id);
		for (const t of d.target) {
			const $srcByVar = this.$srcByVar.get(t);
			if ($srcByVar) {
				$srcByVar.delete(d.id);
				if (!$srcByVar.size) {
					$srcByVar.delete(d.id);
				}
			}
			const $srcByVarProp = this.$srcByVarProp.get(t);
			if ($srcByVarProp) {
				for (const [propName, $srcSet] of $srcByVarProp) {
					$srcSet.delete(d.id);
					if (!$srcSet.size) {
						$srcByVarProp.delete(propName);
					}
				}
				if (!$srcByVarProp.size) {
					this.$srcByVarProp.delete(t);
				}
			}
		}
	}

	eval(req) {
		const args = [];
		for (const i in req.scope) {
			args.push(req.scope[i]);
		}
//		const argsStr = Object.keys(req.scope).join(",");
		let argsStr = "";
		for (const i in req.scope) {
			if (argsStr) {
				argsStr += "," + i;
			} else {
				argsStr = i;
			}
		}
		let val;
		this.curReq = req;
		try {
			val = this.getEvalFunc(req, req.expr, argsStr).apply(req.$src, args);
//if (req.expr == "!!console.log(data.curOrder) || data.curOrder") {
//	console.log(2333, val);
//}
		} catch (err) {
			this.check(err, req);
			return;
		}
		delete this.curReq;
		return val;
	}
	getEvalFunc(req, expr, argsStr) {
		const fKey = expr + (argsStr || "");
		let f = this._func.get(fKey);
		if (f) {
			return f;
		}
		const funcBody = expr.trimLeft().indexOf("return") == 0 ? expr : "const " + resVarName + " = " + expr + "; return " + resVarName + ";"
//console.log(funcBody, argsStr);
		try {
			f = new Function(argsStr, funcBody);
		} catch (err) {
			throw new Error(`${err}\n\tfunction body => ${funcBody}\n	args => ${argsStr}`, req);
		}
		this._func.set(fKey, f);
		return f;
	}
	check(res, req, fileName, lineNum, colNum) {
		if (!(res instanceof Error)) {
			return;
		}
		const $src = req.$srcForErr || req.$src;
		const errMsg = ($src.getLineNo ? " in " + $src.getLineNo() : "") + "\n\t" +  req.str + " => " + req.expr + "\n\t$src => ";
		console.error(">>>Tpl error" + errMsg, $src, req);
		if (fileName) {
			res = new Error(res, fileName, lineNum, colNum);
		}
console.log(11111111, res, req, fileName, lineNum, colNum);
//todo error
		const onError = $src.dataset.onerror;
		if (onError) {
			try {
				new Function("err", onError).call(req.$src, res);
			} catch (err) {
				console.error(">>>Tpl error in onerror handler" + errMsg, $src, "onerror=>" + onError, req, err);
			}
		}
		throw res;
	}

	getProxy(obj = {}) {
		return obj[tplProxyTargetPropName] ? obj : wrapDeep(obj, this.getProxyItem.bind(this));
	}
	getProxyItem(obj) {
		return new Proxy(obj, this.getProxyItemHandler());
	}
/*
	getProxyTarget(val) {
		for (let i; val instanceof Object && (i = val[tplProxyTargetPropName]) && i != val[tplProxyTargetPropName]; val = wrapDeep(i, this.getProxyTarget.bind(this)));
		return val;
	}
	skipProxy(val) {
		return val instanceof Object ? val[tplProxyTargetPropName] = val : val;
	}*/
	getProxyItemHandler() {
		return {
			get: this.proxyGet.bind(this),
			set: this.proxySet.bind(this),
			deleteProperty: this.proxyDeleteProperty.bind(this)
		};
	}
	proxyGet(t, n) {
		if (n == tplProxyTargetPropName) {//"tplProxyTarget") {
			return t;
		}
		const v = Reflect.get(t, n);
//		if (!this.curReq || !Reflect.has(t, n)) {// && symbol)) {
//		if (!this.curReq) {// || !t.hasOwnProperty(n)) {
		if (!this.curReq) {
			return v;
		}
		const $src = this.curReq.$src;
		const $srcId = $src[getId.propName];
//console.log('get', n, t, $src);
if (!this.descr.has($srcId)) {
	console.error("err get", n, t, $src);
	throw 2222222222222;
}
		let $srcByVarProp = this.$srcByVarProp.get(t);
		if (!$srcByVarProp) {
			this.$srcByVarProp.set(t, $srcByVarProp = new Map());
		}
		let $srcByProp = $srcByVarProp.get(n);
		if (!$srcByProp) {
			$srcByVarProp.set(n, $srcByProp = new Set());
		}
		if (!$srcByProp.has($srcId)) {
//--old			this.clear$srcByVarProp($srcByVarProp, $src, t);
			$srcByProp.add($srcId);
//console.log('get1', "p." + n, t, v, $srcId, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		}

		const varBy$src = this.descr.get($srcId).target;
		if (!varBy$src.has(t)) {
			varBy$src.add(t);
//console.log('get2', "p." + n, t, $srcId, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		}

		if (v instanceof Object) {
			t = v;
			if (!varBy$src.has(t)) {
				varBy$src.add(t);
//console.log('get3', "p." + n, t, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
			}
		}
		let $srcByVar = this.$srcByVar.get(t);
		if (!$srcByVar) {
			this.$srcByVar.set(t, $srcByVar = new Set());
		}
		if (!$srcByVar.has($srcId)) {
			$srcByVar.add($srcId);
//console.log('get4', "p." + n, t, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		}
//console.log(123, this.curReq.$src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		return v;
	}
	proxySet(t, n, v, r) {
//console.log('set', t, n, v);//, Object.getOwnPropertyDescriptor(t, n));
		if (v === Reflect.get(t, n) && (!v || Object.getOwnPropertyDescriptor(t, n).enumerable)) {
			return true;
		}
		if (v instanceof Object && !v[tplProxyTargetPropName]) {
			v = wrapDeep(v, this.getProxyItem.bind(this));
		}
		if (!Reflect.set(t, n, v)) {
			return false;
		}
		return this.set$srcByVar(t, n, v, r);
	}
	proxyDeleteProperty(t, n, r) {
		if (!Reflect.deleteProperty(t, n)) {
			return false;
		}
//console.log('del', t, n);
		return this.set$srcByVar(t, n, undefined, r);
	}
	set$srcByVar(t, n, v, r) {
//console.info('0 rByProp', n, v, t, this.$srcByVar.get(r));
		const $srcByVarProp = this.$srcByVarProp.get(t);
		if ($srcByVarProp) {
			const $srcIdSet = $srcByVarProp.get(n);
			if ($srcIdSet) {
//console.info('1 rByProp', "name", n, "value", v, "target", t, "$srcIdSet", $srcIdSet);
				this.renderBy$srcIdSet($srcIdSet);
				return true;
			}
		}
		const $srcIdSet = this.$srcByVar.get(r) || this.$srcByVar.get(t);
		if ($srcIdSet) {
//console.info('2 rByT', "name", n, "value", v, "target", t, "$srcIdSet", $srcIdSet);
			this.renderBy$srcIdSet($srcIdSet);
			return true;
		}
		return true;
	}
	renderBy$srcIdSet($srcIdSet) {
//console.info('ss', $srcIdSet);
		if (this.delay >= 0) {
			for (const id of $srcIdSet) {
				this.asyncBy$srcId(id);
			}
			return;
		}
		for (const id of $srcIdSet) {
			this.addToRenderStack(id);
		}
//console.log("stek", this.renderStack);
		for (const [$src, id] of this.renderStack) {
			if (this.has$srcId(id, $src)) {
				this.render($src);
//				$src.render();
			}
			this.renderStack.delete($src);
		}
//console.log("stek", this.renderStack);
		this.renderStack.clear();
	}
	asyncBy$srcId(id) {
		const $srcSet = this.$srcById.get(id);
		if (!$srcSet) {
			return;
		}
		if (this.descr.get(id).isAsOne) {
			for (const $i of $srcSet) {
				this.async($i);
//				$i.render(this.delay);
				return;
			}
		} else {
			for (const $i of $srcSet) {
				this.async($i);
//				$i.render(this.delay);
			}
		}
	}
	addToRenderStack(id) {
		const $srcSet = this.$srcById.get(id);
		if (!$srcSet) {
			return;
		}
		if (this.descr.get(id).isAsOne) {
			for (const $i of $srcSet) {
//				this.renderStack.add($i);
				this.renderStack.set($i, id);
				return;
			}
		} else {
			for (const $i of $srcSet) {
//				this.renderStack.add($i);
				this.renderStack.set($i, id);
			}
		}
	}
	has$srcId(id, $src) {
		const $srcSet = this.$srcById.get(id);
		return $srcSet && $srcSet.has($src);
	}

	getCommand(name) {
		return Tpl.cmd.get(name);
	}
	static addCommand(name, cmd) {
		this.cmd.set(name, cmd);
	}
}
Tpl.cmd = new Map();

Tpl.addCommand(scopeCmdName, scopeCmd);
Tpl.addCommand(htmlCmdName, htmlCmd);
Tpl.addCommand(":attr", attrCmd);

Tpl.addCommand(":if", ifCmd);
Tpl.addCommand(":elseif", ifCmd);
Tpl.addCommand(":else", ifCmd);

Tpl.addCommand(":switch", switchCmd);
Tpl.addCommand(":case", switchCmd);
Tpl.addCommand(":default", switchCmd);

Tpl.addCommand(":for", forCmd);
Tpl.addCommand(incCmdName, incCmd);
Tpl.addCommand(":fetch", fetchCmd);

Tpl.addCommand(":on", onCmd);
/*
Tpl.addCommand(":a1", {
	render: function(req) {
		const $e = req.$src;
console.log(req);
		$e.innerHTML = this.eval(req);
		return {
			$e
		};
	}
});*/

self.Tpl = Tpl;
export default self.tpl = new Tpl();
/*
HTMLElement.prototype.render = Text.prototype.render = function(delay) {
	return delay >= 0 && self.tpl.async(this, delay) || self.tpl.render(this);
}*/
