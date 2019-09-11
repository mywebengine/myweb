/*!
 * myweb/tpl.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
import {cmdArgsBegin, cmdArgsDiv,
	incCmdName, orderCmdName, scopeCmdName, htmlCmdName, textCmdName,
	attrCmdName, forCmdName, fetchCmdName, onCmdName,
	ifCmdName, elseifCmdName, elseCmdName, switchCmdName, caseCmdName, defaultCmdName,
	renderEventName, resVarName, tplProxyTargetPropName} from "./tpl/const.js";
import {getId, wrapDeep, $goCopy, $goTagsDeep, getMustacheBlocks, spaceRe} from "./util.js";

import scopeCmd from "./tpl/cmd/scope.js";
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
		this.renderStack = new Set();
//		this.renderAsyncStack = new Map();
		this.renderAsyncParamsStack = new Map();

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
//if (this.ii > 0 && this.ii++ > 800) {
//this.ii=1; alert(1); return;
//}
			const res = this.execRender($src, n, v, scope);
			if (!res) {
				continue;
			}
//console.log("render", n, v, $src, res);
			if (res.$e) {
//				this.removeAllOnRenderStack($src);
				this.renderStack.delete($src);
				$src = res.$e;
			}
			if (res.isLast) {
//				this.removeAllOnRenderStack($src);
				this.renderStack.delete($src);
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
//			this.removeAllOnRenderStack($src);
			this.renderStack.delete($src);
		}
//console.log("render exit1", $src, attr);
		return $src;
	}
/*--?
	removeAllOnRenderStack($e) {
		this.renderStack.delete($e);
//		this.renderAsyncStack.delete($e);
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
//console.log(123, $src);
		const already = this.renderAsyncParamsStack.get($src);
//		const already = this.renderAsyncStack.get($src);
		if (already) {
			this._newSync = ++this.sync;
			return already.promise;
		}
		const r = {
			scope,
			attr
		};
		this.renderStack.add($src);
//		this.renderAsyncStack.set($src, r);
		this.renderAsyncParamsStack.set($src, r);
		return r.promise = new Promise((resolve, reject) => {
			r.resolve = resolve;
			r.reject = reject;
//console.log(1);
			setTimeout(this._async.bind(this, ++this.sync, delay), delay);
		});
	}
	_async(sync, delay) {
		if (this._newSync) {
			this._newSync = undefined;
//todo console.log(11);
			setTimeout(this._async.bind(this, ++this.sync, delay), delay);
			return;
		}
		if (sync != this.sync) {
			return;
		}
		if (this.isDebug) {
			console.log("tpl async stack", Array.from(this.renderStack.keys()));
		}
		this.onbeforeasync();
//		for (const [$src, r] of this.renderAsyncStack) {
		for (const $src of this.renderStack.keys()) {
			if (this.isNotRender($src)) {
//				this.removeAllOnRenderStack($src);
				this.renderStack.delete($src);
//				r.resolve();
				continue;
			}
			const r = this.renderAsyncParamsStack.get($src);


//console.log("_list =>", Array.from(this.renderAsyncStack.keys()));
//alert(1);
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
//		this.renderAsyncStack.clear();
		this.renderStack.clear();
		this.renderAsyncParamsStack.clear();
		this.onasync();
	}
	isNotRender($e) {
		while ($e = $e.parentNode) {
			if ($e instanceof DocumentFragment) {
//console.log(222222, $i);
				return $e;
			}
		}
	}
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
		if (!reqCmd) {
			return;
		}
		return {
			cmdName: reqCmd.cmdName,
			cmd: reqCmd.cmd,
			args: reqCmd.args,
			str,
			expr,
			$src,
			scope
		};
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
			cmdName,
			cmd,
			args
		};
		this._reqCmd.set(str, reqCmd);
		return reqCmd;
	}
	getCmdArgs(str) {
		const i = str.indexOf(cmdArgsBegin);
		return i != -1 ? [str.substr(0, i), str.substr(i + 1).split(cmdArgsDiv)] : [str, []];
	}

	cloneNode($e) {
		return $e instanceof HTMLElement ? $goCopy($e, $e.cloneNode(true), this.copyDescr.bind(this)) : $e.cloneNode(true);
	}
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
//todo атрибут нелльзя создать, если в нем есть некорректные символы - решение ниже слишком исбыточное, на мой взгляд
//		for (let i = name.indexOf("$"); i > 0; i = name.indexOf("$")) {
//			name = name.substr(0, i) + name.substr(i + 1);
//		}
		$e.setAttribute(name, value);
		this.getAttrs($e).set(name, value);
		switch (name) {
			case "value":
				if (value) {
					$e.value = value;
//				} else {
//					delete $e.value;
				}
			break;
			case "checked":
				$e.checked = value != "false";
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
/*
	getAttrsBefore(attr, name) {
		const a = new Map();
		for (const [n, v] of attr) {
			if (n == name) {
				break;
			}
			a.set(n, v);
		}
		return a;
	}*/
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
	getTopURLBy$src($src) {
		for (let $i = $src.parentNode; $i; $i = $i.parentNode) {
			const d = this.get$srcDescr($i);
			if (!d) {
				continue;
			}
			if (d.tpl_url) {
				return d.tpl_url;
			}
			let topURL;
			for (const [n, v] of d.attr) {
				const [cmdName] = this.getCmdArgs(n);
				if (cmdName == incCmdName) {
					topURL = getIncVal($i, n);
				}
			}
			if (topURL) {
				return topURL;
			}
		}
	}
	show($e) {
//		this.removeAllOnRenderStack($e);
		this.renderStack.delete($e);
		if ($e.nodeName != "TEMPLATE") {
			return $e;
		}
		const $new = $e.content.firstChild;
		this.moveProps($e, $new);
		$e.parentNode.replaceChild($new, $e);
//--		this.replaceChild($new, $e);
		return $new;
	}
	hide($e) {
		if ($e.nodeName == "TEMPLATE") {
//			this.removeAllOnRenderStack($e);
			this.renderStack.delete($e);
			return $e;
		}
//		$goTagsDeep($e, this.removeAllOnRenderStack.bind(this));
		$goTagsDeep($e, this.renderStack.delete.bind(this.renderStack));

		const $new = document.createElement("template");
		this.moveProps($e, $new);
		$e.parentNode.replaceChild($new, $e);
//--		this.replaceChild($new, $e);
		this.appendChild($new.content, $e);

//		$new.content._parentNode = $p;

		return $new;
	}
	moveProps($from, $to) {
		if (!($from instanceof HTMLElement && $to instanceof HTMLElement)) {
			return;
		}
//like as ssr and for-cmd
//		for (const [name, value] of this.getAttrs($from)) {
//			this.setAttribute($to, name, value);
		for (const attr of $from.attributes) {
			this.setAttribute($to, attr.name, attr.value);
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

//		this.removeAllOnRenderStack($e);
		this.renderStack.delete($e);

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
					if ($srcSet.has(d.id)) {
						$srcSet.delete(d.id);
						if (!$srcSet.size) {
							$srcByVarProp.delete(propName);
						}
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
		console.error(res, "\n>>>Tpl error" + errMsg, $src, req);
		if (fileName) {
			res = new Error(res, fileName, lineNum, colNum);
		}
//console.log(11111111, res, req, fileName, lineNum, colNum);
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
	getProxyItemHandler() {
		return {
			get: this.proxyGet.bind(this),
			set: this.proxySet.bind(this),
			deleteProperty: this.proxyDeleteProperty.bind(this)
		};
	}
	proxyGet(t, n, r) {
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
//console.log('get', n, t, r, $src);
/*
if (!this.descr.has($srcId)) {
	console.error("err get", n, t, $src);
	throw 2222222222222;
}*/
		let $srcByVarProp = this.$srcByVarProp.get(r);
		if (!$srcByVarProp) {
			this.$srcByVarProp.set(r, $srcByVarProp = new Map());
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
		if (!varBy$src.has(r)) {
			varBy$src.add(r);
//console.log('get2', "p." + n, t, $srcId, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		}

		if (v instanceof Object) {
//console.log(1, t, n, r);
			if (!v[tplProxyTargetPropName]) {
				v = wrapDeep(v, this.getProxyItem.bind(this));
			}
			r = v;
			if (!varBy$src.has(r)) {
				varBy$src.add(r);
//console.log('get3', "p." + n, t, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
			}
		}
		let $srcByVar = this.$srcByVar.get(r);
		if (!$srcByVar) {
			this.$srcByVar.set(r, $srcByVar = new Set());
		}
		if (!$srcByVar.has($srcId)) {
			$srcByVar.add($srcId);
//console.log('get4', "p." + n, t, $src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		}
//console.log(123, this.curReq.$src, tpl.$srcByVarProp.get(d) && tpl.$srcByVarProp.get(d).get("isShow"));
		return v;
	}
	proxySet(t, n, v, r) {
		const old = Reflect.get(t, n);
//console.log('set', t, n, v);//, Object.getOwnPropertyDescriptor(t, n));
		if (v === old && (!v || Object.getOwnPropertyDescriptor(t, n).enumerable)) {
//console.log("1", v, n);
			return true;
		}
		this.clearVars(old);
		if (v instanceof Object && !v[tplProxyTargetPropName]) {
			v = wrapDeep(v, this.getProxyItem.bind(this));
		}
		if (!Reflect.set(t, n, v)) {
			return false;
		}
		return this.set$srcByVar(t, n, v, r);
	}
	proxyDeleteProperty(t, n, r) {
		const old = Reflect.get(t, n);
		if (!Reflect.deleteProperty(t, n)) {
			return false;
		}
		this.clearVars(old);
//alert(2 + n);
//console.log('del', t, n);
		return this.set$srcByVar(t, n, undefined, r);
	}
	set$srcByVar(t, n, v, r) {
//console.info('0 rByProp', n, v, t, this.$srcByVar.get(r));
		const $srcByVarProp = this.$srcByVarProp.get(r);
		if ($srcByVarProp) {
			const $srcIdSet = $srcByVarProp.get(n);
			if ($srcIdSet) {
//console.info('1 rByProp', "name", n, "value", v, "target", r, "$srcIdSet", $srcIdSet);
				this.renderBy$srcIdSet($srcIdSet);
				return true;
			}
		}
		const $srcIdSet = this.$srcByVar.get(r);// || this.$srcByVar.get(t);
		if ($srcIdSet) {
//console.info('2 rByT', "name", n, "value", v, "target", t, "$srcIdSet", $srcIdSet);
			this.renderBy$srcIdSet($srcIdSet);
			return true;
		}
		return true;
	}
//рендер стэк нам нужен для того что бы из рендера можно было удаляить элементы из него
//?? можно ли использовать один стэк?
//-- asyncBy$srcId и addToRenderStack - очень похожи ...
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
//		for (const [$src, id] of this.renderStack) {
//			if (this.has$srcId(id, $src)) {
		for (const $src of this.renderStack.keys()) {
//			if (this.has$srcId($src)) {
				this.render($src);
//				$src.render();
//			}
			this.renderStack.delete($src);
		}
//console.log("stek", this.renderStack);
//todo think about
		if (this.renderStack.size) {
			this.renderStack.clear();
		}
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
				this.renderStack.add($i);
//				this.renderStack.set($i, id);
				return;
			}
		} else {
			for (const $i of $srcSet) {
				this.renderStack.add($i);
//				this.renderStack.set($i, id);
			}
		}
	}
	has$srcId(id, $src) {
		const $srcSet = this.$srcById.get(id);
		return $srcSet && $srcSet.has($src);
	}
	clearVars(t) {
		if (!(t instanceof Object)) {
			return;
		}
		if (t instanceof Array) {
			const iLen = t.length;
			for (let i = 0; i < iLen; i++) {
				this.clearVars(t[i]);
			}
		} else {
			for (const i in t) {
				this.clearVars(t[i]);
			}
		}
		if (this.$srcByVar.has(t)) {
//console.log("$srcByVar", t);
			this.$srcByVar.delete(t);
		}
		if (this.$srcByVarProp.has(t)) {
//console.log("$srcByVarProp", t);
			this.$srcByVarProp.delete(t);
		}
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
Tpl.addCommand(attrCmdName, attrCmd);
 
Tpl.addCommand(ifCmdName, ifCmd);
Tpl.addCommand(elseifCmdName, ifCmd);
Tpl.addCommand(elseCmdName, ifCmd);

Tpl.addCommand(switchCmdName, switchCmd);
Tpl.addCommand(caseCmdName, switchCmd);
Tpl.addCommand(defaultCmdName, switchCmd);

Tpl.addCommand(forCmdName, forCmd);
Tpl.addCommand(incCmdName, incCmd);
Tpl.addCommand(fetchCmdName, fetchCmd);

Tpl.addCommand(onCmdName, onCmd);

//self.Tpl = Tpl;
export default self.tpl = new Tpl();
self.data = self.tpl.getProxy(self.data);

let isDynamicImport;
try {
	new Function("import('')");
	isDynamicImport = true;
} catch (err) {
}

//!!for Edge
//const url = new URL(import.meta.url);
const url = new URL(document.querySelector("script[src*='tpl.js'").src);
self.tpl.isDebug = url.search.indexOf("debug") != -1;
function main() {
	self.tpl.go();
}
function debug() {
	self.tpl.onbeforeasync = function() {
		this.time = performance.now();
	}
	self.tpl.onasync = function() {
		console.log('render time: ', performance.now() - this.time);
	}
//!!for Edge
//	import(url.origin + url.pathname.replace("tpl.js", "getLineNo.js")).then(m => m.default).then(main);
	try {
		eval('import(url.origin + url.pathname.replace("tpl.js", "getLineNo.js")).then(m => m.default).then(main);');
	} catch (err) {
		main();
	}
}
function onload() {
	if (self.tpl.isDebug) {
		debug();
	} else {
		main();
	}
}
if (url.search.indexOf("ondomready") == -1) {
	if (document.readyState == "complete") {
		onload();
	} else {
		self.addEventListener("load", onload);
	}
} else if (document.readyState == "loading") {
	document.addEventListener("DOMContentLoaded", onload);
} else {
	onload();
}
