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
	renderEventName, tplProxyTargetPropName,
	resVarName} from "./tpl/const.js";
import {getId, wrapDeep, $goCopy, $goTagsDeep, getMustacheBlocks, spaceRe, trimSlashRe} from "./util.js";

import scopeCmd from "./tpl/cmd/scope.js";
import {ifCmd, switchCmd} from "./tpl/cmd/if.js";
import forCmd from "./tpl/cmd/for.js";
import attrCmd from "./tpl/cmd/attr.js";
import htmlCmd from "./tpl/cmd/html.js";
//import incCmd, {getIncVal} from "./tpl/cmd/inc.js";
import incCmd, {getIncVal, inc_get$els, inc_isInc} from "./tpl/cmd/inc.js";
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
//	console.log("render" + n, v);//, $src, scope);
//}
			const res = this.execRender($src, n, v, scope);
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
			if (!$src.isCustomHTML) {
				for (let $i = $src.firstChild; $i; $i = $i.nextSibling) {
					$i = this.render($i, scope);
				}
			}
		}
		return $src;
	}
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
//--				const $i = this.appendChild($fr, document.createElement("span"));
				const $i = $fr.appendChild(document.createElement("span"));
				this.setAttribute($i, textCmdName, text.substring(b.begin, b.end));
				this.renderTag($i, scope);
			} else {
//--				this.appendChild($fr, document.createTextNode(text.substring(b.begin, b.end)))
				$fr.appendChild(document.createTextNode(text.substring(b.begin, b.end)))
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
	async($src = this.$src, delay = this.delay || 0, scope, attr) {
		const already = this.renderStack.get($src);
		if (already) {
			setTimeout(this._async.bind(this, ++this.sync), delay);
			return already.promise;
		}
		const p = {
			scope,
			attr
		};
		this.renderStack.set($src, p);
		return p.promise = new Promise((resolve, reject) => {
			p.resolve = resolve;
			p.reject = reject;
			setTimeout(this._async.bind(this, ++this.sync), delay);
		});
	}
	_async(sync) {
		if (sync != this.sync) {
			return;
		}
		this.onbeforeasync();

		if (this.isDebug) {
			console.log("tpl async stack", this.renderStack);
		}

		for (const [$i, r] of this.renderStack) {
//console.log("_async begin", $i, r);
			if (r.isDel) {
				continue;
			}
			try {
				this.render($i, r.scope, r.attr);
			} catch (err) {
				console.log(err);
//				if (r.reject) {
//					r.reject(err);
//				}
				break;
			}
			if (r.resolve) {
				r.resolve();
			}
		}
		this.renderStack.clear();
		this.onasync();
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
this._scoping = true;
		const $path = [];//$e instanceof HTMLElement ? [$e] : [];
//!!_parent		for (; $e = $e.parentNode || $e._parentNode; $path.push($e));
		for (; $e; $path.push($e), $e = $e.parentNode);
		const scope = {};
		for (let i = $path.length - 2; i > -1; i--) {// -2 then parent on docEl -> HTMLDocument or parent mauby DocumentFragment
//		for (let i = $path.length - 2; i > 0; i--) {// -2 then parent on docEl -> HTMLDocument or parent mauby DocumentFragment
			this.execScopeItem($path[i], scope);
		}
this._scoping = false;
		return scope;
	}
	execScopeItem($e, scope) {
		for (const [n, v] of this.getAttrs($e)) {
			if (!this.execGetScope($e, n, v, scope)) {
				break;
			}
		}
	}
	execRender($src, attrName, attrValue, scope) {
		const req = this.getReq($src, attrName, attrValue, scope);
		if (req && req.cmd.render) {
//try {
			return req.cmd.render.call(this, req);
//} catch(err) {
//	alert(err);
//}
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
//		return scope;
		return true;
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
/*
	insertBefore($parent, $e, $before) {
		return $parent.insertBefore($e, $before);
	}
	appendChild($parent, $e) {
		return $parent.appendChild($e);
	}*/
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
		let $srcById = this.$srcById.get(d.id);
		if (!$srcById) {
			this.$srcById.set(d.id, $srcById = new Set());//for clone
		}
		$srcById.add($e);
		return d;
	}
	createAttr($e) {
//if (!$e.getAttribute) {
//	console.log(11112, $e);
//}
		const attr = new Map();
		const order = $e.getAttribute(orderCmdName);
		if (order) {
			const o = order.trim().split(spaceRe);
			const oLen = o.length;
			for (let i = 0; i < oLen; i++) {
				attr.set(o[i], $e.getAttribute(o[i]));
			}
		}
//todo		const attrsLen = $e.attributes.length;
		const attrs = Array.from($e.attributes);
		const attrsLen = attrs.length;
		for (let i = 0; i < attrsLen; i++) {
//			const a = $e.attributes.item(i);
			const a = attrs[i];
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
	show($e, afterAttrName) {
		if ($e.nodeName != "TEMPLATE") {
			return $e;
		}
		if (/*this.isDebug && */$e.content.childNodes.length != 1) {
//console.log(this.renderStack.get($e), getId($e), $e);
			this.check(new Error(">>>Tpl show:01: Template element invalid structure on show function. <template>.childNodes.length must be only one element."), {
				$src: $e,
				afterAttrName
			});
			return;
		}
		const $new = $e.content.firstChild;
		this.moveProps($e, $new);
		$e.parentNode.replaceChild($new, $e);
//		this.replaceChild($new, $e);
		return $new;
	}
	hide($e, afterAttrName) {
//del
		if ($e.nodeName == "TEMPLATE") {
			return $e;
		}
		const $new = document.createElement("template");
		if ($e instanceof HTMLElement) {
			this.moveProps($e, $new);
			for (let $i = $e.firstElementChild; $i; $i = $i.nextElementSibling) {
				$goTagsDeep($i, this.clearTagPropsToMove.bind(this));
			}
		}
		$e.parentNode.replaceChild($new, $e);
		$new.content.appendChild($e);
//		this.replaceChild($new, $e);
//--		this.appendChild($new.content, $e);
//		$new.content._parentNode = $p;
		if (this.renderStack.size) {//hide вызван не из async (просто из render, например, из загрузившейся в фоне вставки)
			this.renderStack.set($new, {
				isDel: true
			});
		}
		return $new;
	}
	moveProps($from, $to) {
//--		if (!($from instanceof HTMLElement && $to instanceof HTMLElement)) {
//			return;
//		}
		const r = this.renderStack.get($from);
		if (r) {
			r.isDel = true;
		}
//like as ssr and for-cmd
//		for (const [name, value] of this.getAttrs($from)) {
//			this.setAttribute($to, name, value);
//		for (const attr of $from.attributes) {
		const d = this.get$srcDescr($from);// || this.createTagDescr($e);
//		if (!d) {
//			return;
//		}
		$to[getId.propName] = d.id;
//		$from[getId.propName] = -1;
		const $srcById = this.$srcById.get(d.id);
		if ($srcById) {
			$srcById.delete($from);
			$srcById.add($to);
		} else {
console.log("!!!!!!!! $srcById", d.id, $from, $to);
		}
//!!!!!!!!!attributes
//try {
		const attrs = Array.from($from.attributes);
		for (const attr of attrs) {
			//!!должно выполняться полсе присвоения ID, потому что в setAttribute используется getAttrs
			this.setAttribute($to, attr.name, attr.value);
		}
//} catch(err) {
//	alert(err);
//}
	}
	clearTagProps($e) {
		const d = this.get$srcDescr($e);
		if (!d) {
			return;
		}
		const r = this.renderStack.get($e);
		if (r) {
			r.isDel = true;
		}
		const $srcById = this.$srcById.get(d.id);
		if (!$srcById) {
//todo проверить почему так
			return;
		}
		$srcById.delete($e);
		if ($srcById.size) {
			return;
		}
		this.$srcById.delete(d.id);
		this.clearVarsByDescr(d);
	}
	clearTagPropsToMove($e) {
		const d = this.get$srcDescr($e);
		if (!d) {
			return;
		}
		const r = this.renderStack.get($e);
		if (r) {
			r.isDel = true;
		}
		this.clearVarsByDescr(d);
	}
	clearVarsByDescr(d) {
		for (const t of d.target) {
			const $srcByVar = this.$srcByVar.get(t);
			if ($srcByVar) {
				$srcByVar.delete(d.id);
				if (!$srcByVar.size) {
					this.$srcByVar.delete(t);
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

	copyDescr($from, $to) {
		const id = $from[getId.propName];
		if (!id) {
			return;
		}
		$to[getId.propName] = id;
		const $srcById = this.$srcById.get(id);
//		if (!this.$srcById.has(id)) {
		if ($srcById) {
			$srcById.add($to);
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
					if ($srcSet.has(fromId)) {
						$srcSet.add($toId);
					}
				}
			}
		}
	}

	eval(req, isOnlyRun) {
		let argsStr = "";
		const args = [];
		for (const i in req.scope) {
			if (argsStr) {
				argsStr += "," + i;
			} else {
				argsStr = i;
			}
			args.push(req.scope[i]);
		}
		if (!isOnlyRun) {
			this.curReq = req;
			let val;
			try {
				val = this.getEvalFunc(req, req.expr, argsStr).apply(req.$src, args);
			} catch (err) {
				this.check(err, req);
				return;
			}
			delete this.curReq;
			return val;
		}
		try {
			return this.getEvalFunc(req, req.expr, argsStr).apply(req.$src, args);
		} catch (err) {
			this.check(err, req);
		}
	}
	getEvalFunc(req, expr, argsStr) {
		const fKey = expr + (argsStr || "");
		let f = this._func.get(fKey);
		if (f) {
			return f;
		}
//todo еще раз подумать о конструкциях с return
		const funcBody = expr.trimLeft().indexOf("return") == 0 ? expr : "const " + resVarName + " = " + expr + "; return " + resVarName + ";";
		try {
			f = new Function(argsStr, funcBody);
		} catch (err) {
			throw new Error(`${err}\n\tfunction body => ${funcBody}\n\targs => ${argsStr}`, req);
		}
		this._func.set(fKey, f);
		return f;
	}
	check(res, req, fileName, lineNum, colNum) {
		if (!(res instanceof Error)) {
			return;
		}
		const $src = req.$srcForErr || req.$src;
		const errMsg = ($src.getLineNo ? " in " + $src.getLineNo() : "") + (req.str ? "\n\t" + req.str + " => " + req.expr : '') + "\n\t$src => ";
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
//--		this.renderStack.clear();
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
		if (n == tplProxyTargetPropName) {
			return t;
		}
//		const v = Reflect.get(t, n);
		const v = t[n];
		if (!this.curReq) {
			return v;
		}
		const $srcId = this.curReq.$src[getId.propName];
//console.log('get', n, t, r, this.curReq.$src);
		const $srcByVarProp = this.$srcByVarProp.get(r);
		if ($srcByVarProp) {
			const $srcByProp = $srcByVarProp.get(n);
			if ($srcByProp) {
				if (!$srcByProp.has($srcId)) {
					$srcByProp.add($srcId);
				}
			} else {
				$srcByVarProp.set(n, new Set([$srcId]));
			}
		} else {
			this.$srcByVarProp.set(r, new Map([[n, new Set([$srcId])]]));
		}

		const varBy$src = this.descr.get($srcId).target;
		if (!varBy$src.has(r)) {
			varBy$src.add(r);
		}

		if (v instanceof Object) {
			if (!v[tplProxyTargetPropName]) {
				v = wrapDeep(v, this.getProxyItem.bind(this));
			}
			r = v;
			if (!varBy$src.has(r)) {
				varBy$src.add(r);
			}
		}
		const $srcByVar = this.$srcByVar.get(r);
		if ($srcByVar) {
			if (!$srcByVar.has($srcId)) {
				$srcByVar.add($srcId);
			}
		} else {
			this.$srcByVar.set(r, new Set([$srcId]));
		}
		return v;
	}
	proxySet(t, n, v, r) {
if (this._scoping) {
	return Reflect.set(t, n, v);
}
//		const old = Reflect.get(t, n);
		const old = t[n];
//console.log('set', t, n, v, "old=>", old);//, Object.getOwnPropertyDescriptor(t, n));
		if (v === old && (!v || Object.getOwnPropertyDescriptor(t, n).enumerable)) {
			return true;
		}
		this.clearVarsByVar(old);
		if (v instanceof Object && !v[tplProxyTargetPropName]) {
			v = wrapDeep(v, this.getProxyItem.bind(this));
		}
		if (!Reflect.set(t, n, v)) {
			return false;
		}
		return this.set$srcByVar(t, n, v, r);
	}
	proxyDeleteProperty(t, n, r) {
//		const old = Reflect.get(t, n);
		const old = t[n];
//console.log('del', t, n, "old=>", old);
		if (!Reflect.deleteProperty(t, n)) {
			return false;
		}
		this.clearVarsByVar(old);
		return this.set$srcByVar(t, n, undefined, r);
	}
	clearVarsByVar(t) {
		if (!(t instanceof Object)) {
			return;
		}
		if (t instanceof Array) {
			const iLen = t.length;
			for (let i = 0; i < iLen; i++) {
				this.clearVarsByVar(t[i]);
			}
		} else {
			for (const i in t) {
				this.clearVarsByVar(t[i]);
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
		const $srcIdSet = this.$srcByVar.get(r);
		if ($srcIdSet) {
//console.info('2 rByT', "name", n, "value", v, "target", t, "$srcIdSet", $srcIdSet);
			this.renderBy$srcIdSet($srcIdSet);
			return true;
		}
		return true;
	}
	renderBy$srcIdSet($srcIdSet) {
		const sLen = this.renderStack.size;
		this.add$srcSetToRenderStack($srcIdSet);
		if (sLen) {
//console.log(111, sLen, this.renderStack);
			return;
		}
		for (const id of $srcIdSet) {
			const $srcSet = this.$srcById.get(id);
			if (!$srcSet) {
				continue;
			}
			for (const $i of $srcSet) {
				this.async($i);
				return;
			}
		}
	}
	add$srcSetToRenderStack($srcIdSet) {
		for (const id of $srcIdSet) {
			const $srcSet = this.$srcById.get(id);
			if (!$srcSet) {
				continue;
			}
			if (this.descr.get(id).isAsOne) {
				for (const $i of $srcSet) {
					if (!this.renderStack.has($i)) {
						this.renderStack.set($i, {});
					}
					break;
				}
				continue;
			}
			for (const $i of $srcSet) {
				if (!this.renderStack.has($i)) {
					this.renderStack.set($i, {});
				}
			}
		}
	}

	getLoc(url, defPageName = "") {
		url = new URL(url);
		const loc = this.getLoc_parsePath(url.href, url.pathname, defPageName);
		loc.hash = this.getLoc_parsePath(url.hash, url.hash.substr(1), defPageName);
		for (const [n, v] of url.searchParams) {
			loc.query[n] = v;
		}
		return loc;
	}
	getLoc_parsePath(href, path, defPageName) {
		const loc = {
			href,
			path,
			args: path.replace(trimSlashRe, "").split("/"),
			param: {},
			query: {}
		};
		loc.name = loc.args[0] || defPageName;
		for (let i = 1, len = loc.args.length; i < len; i += 2) {
			loc.param[loc.args[i]] = loc.args[i + 1];
		}
		return loc;
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

export default self.tpl = new Tpl();

self.data = tpl.getProxy(self.data);
self.data.loc = tpl.getLoc(location.href);
self.addEventListener("hashchange", () => {
	self.data.loc = tpl.getLoc(location.href);
});
//!!for Edge
//const url = new URL(import.meta.url);
const $s = document.querySelector("script");
const url = $s && new URL($s.src);

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
	if (!url) {
		main();
		return;
	}
//!!for Edge
//	import(url.origin + url.pathname.replace("tpl.js", "getLineNo.js")).then(m => m.default).then(main);
	try {
		eval('import(url.origin + "/myweb/getLineNo.js").then(m => m.default).then(main);');
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

self.tpl.isDebug = url && url.search.indexOf("debug") != -1;
if (url && url.search.indexOf("onload") == -1) {
	if (!document.readyState || document.readyState == "loading") {
		document.addEventListener("DOMContentLoaded", onload);
	} else {
		onload();
	}
} else if (document.readyState != "complete") {
	self.addEventListener("load", onload);
} else {
	onload();
}
