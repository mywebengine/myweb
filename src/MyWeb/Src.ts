import {config} from "../config.js";
import {my} from "../myweb.js";
import {Cache} from "./Cache.js";
import {CloneNodeOn} from "./CloneNodeOn.js";
import {CommandWithArgs} from "./CommandWithArgs.js";
import {Context} from "./Context.js";
import {Descr} from "./Descr.js";
import {Q_I} from "./Q_$i.js";
import {Req} from "./Req.js";
import {Sync} from "./Sync.js";

interface IMyWeb {
	context: Context;

	createSrc($e: HTMLElement, descr: Descr | null, asOneIdx: Map<string, number> | null, idx: Map<string, number> | null): Src;

	createReq($src: HTMLElement, str: string, expr: string, scope: Record<string | symbol, unknown>, event: Event | null, sync: Sync): Req;

	getNewId(): number;

	getError(err: Error, $src: Node, req?: Req, scope?: Record<string, unknown>, fileName?: string, lineNum?: number, colNum?: number): Error;
}

export class Src {
	myweb: IMyWeb;
	id: number;
	descr: Descr;
	isCmd: boolean;
	isHide: boolean;
	scope: Record<string | symbol, unknown> | null;
	//todo rename to asOneId
	asOneIdx: Map<string, number> | null;
	idx: Map<string, number> | null;
	cache: Cache | null;

	isMounted = false;
	isCustomElementConnected = false;
	//rem
	save: Map<string, Map<string, string>> | null = null;

	constructor(
		myweb: IMyWeb,
		id: number,
		descr: Descr,
		isCmd: boolean,
		isHide: boolean,
		scope: Record<string, unknown> | null,
		asOneIdx: Map<string, number> | null,
		idx: Map<string, number> | null,
		cache: Cache | null
	) {
		this.myweb = myweb;
		this.id = id;
		//this.descrId = 0,
		this.descr = descr;
		this.isCmd = isCmd; //false,
		this.isHide = isHide;
		this.scope = scope;
		this.asOneIdx = asOneIdx;
		this.idx = idx;
		this.cache = cache;
	}

	//todo | symbol, rename to mergeScope
	getScope<T extends Record<string | symbol, unknown>>(scope: T) {
		//todo -- такого мы сознательно не должны делать
		if (this.scope === null) {
			throw new Error("this.scope === null");
		}
		const srcScopeTarget = this.scope[config.p_target] as T;
		const scopeTarget = scope[config.p_target] as T | undefined;
		const s = scopeTarget !== undefined ? scopeTarget : scope;
		for (const i in s) {
			srcScopeTarget[i] = s[i];
		}
		return this.scope;
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
	q_cloneNode(req: Req, beginIdx: number, len: number) {
		//во время клонирования будут созданы описания
		//const srcId = this.my.getSrcId(this.id, req.sync.local);
		const srcBy$src = this.myweb.context.srcBy$src;
		const $src = this.myweb.context.$srcById.get(this.id);
		//const !!src = this.my.context.srcById.get(this.id);
		const nStr = this.getNextStr(req.str);
		const $els = nStr !== "" ? this.get$els(nStr) : [$src];
		const $elsLen = $els.length;
		const arr = new Array<Q_I>(len);
		const on = [];
		let fSrc;
		for (let i = 0; i < $elsLen; ++i) {
			const $i = $els[i];
			fSrc = srcBy$src.get($i as HTMLElement);
			if (fSrc === undefined || !fSrc.isCmd) {
				//todo--
				//console.warn($i)
				continue;
			}
			break;
		}
		if (fSrc === undefined) {
			//console.warn(">>>mw dom:q_cloneNode:", req, $els, beginIdx, len);
			throw this.myweb.getError(
				new Error(
					`>>>myweb Src:q_cloneNode: среди элементов для клонирования нет элемента с командой, такого не должно быть`
				),
				req.$src,
				req
			);
		}
		const fDescr = fSrc.descr;
		for (const [n, v] of fDescr.attr as Map<string, string>) {
			//!!
			if (n === req.str) {
				break;
			}
			const rc = this.myweb.context.commandWithArgsByStr.get(n) as CommandWithArgs;
			if (rc.commandName === config.onCmdName) {
				on.push(new CloneNodeOn(rc.command, n, v));
			}
		}
		const onLen = on.length;
		const l = this.myweb.context.loadingCount.get(fSrc.id);
		const baseAsOnes = new Set<string>();
		//todo rename to asOneIdByAdOneIds
		const asOneVal: Map<number, number>[] = new Array(len);
		const aIt = (fDescr.asOnes as Set<string>).keys(); //!!
		for (let i = aIt.next(); !i.done; i = aIt.next()) {
			if (i.value !== req.str) {
				continue;
			}
			for (i = aIt.next(); !i.done; i = aIt.next()) {
				baseAsOnes.add(i.value);
			}
		}
		for (let i = 0; i < len; ++i) {
			arr[i] = new Q_I(new Array($elsLen), i + beginIdx);
			asOneVal[i] = new Map();
		}
		for (let i, k, j = 0; j < $elsLen; ++j) {
			const $j = $els[j] as HTMLElement;
			const $jArr = new Array(len);
			const isNotHide = $j.nodeName !== "TEMPLATE" || $j.getAttribute(config.hideName) === null;
			this.q_cloneNodeCreate($j, isNotHide, $jArr, len, asOneVal, 0, baseAsOnes);
			this.q_cloneNodeCreateChildren($j, $jArr, len, asOneVal);
			for (i = 0; i < len; ++i) {
				const arrI = arr[i];
				const $i = (arrI.$els[j] = $jArr[i]);
				const iSrc = srcBy$src.get($i);
				if (iSrc === undefined) {
					continue;
				}
				iSrc.setIdx(req.str, arrI.idx);
				if (onLen !== 0) {
					for (k = 0; k < onLen; ++k) {
						const o = on[k];
						//todo не совсем уместно тут рендлерить - мы еще не подключили рендер
						//o.command.render(new Req($i, o.str, o.expr, req.scope, req.sync));
						o.command.render(this.myweb.createReq($i, o.str, o.expr, req.scope, null, req.sync));
					}
				}
				if (l !== undefined) {
					//todo заменить $i на iSrc.id
					//this.my.context.loadingCount.set($i, l);
					//todo не понятно как убирать филилинг с новых элементов
					this.myweb.context.loadingCount.set(iSrc.id, l);
				}
			}
		}
		return arr;
	}

	private q_cloneNodeCreateChildren($i: Node, $arr: HTMLElement[], $arrLen: number, asOneVal: Map<number, number>[]) {
		const $tP = new Array($arrLen);
		let $parent = $i.parentNode;
		const $p = [];
		for (let i = 0; i < $arrLen; ++i) {
			$tP[i] = [];
		}
		do {
			//////////////////////
			if ($i.nodeType === 1) {
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					this.q_cloneNodeCreate($i as HTMLElement, true, $arr, $arrLen, asOneVal, 1, null);
					continue;
				}
				//const iSrc = srcBy$src.get($i);
				//if (iSrc !== undefined && iSrc.isHide) {
				if ($i.nodeName === "TEMPLATE" && ($i as HTMLTemplateElement).getAttribute(config.hideName) !== null) {
					$p.push($i);
					for (let i = 0; i < $arrLen; ++i) {
						$tP[i].push($arr[i]);
					}
					$i = ($i as HTMLTemplateElement).content.firstChild as Node;
					this.q_cloneNodeCreate($i as HTMLElement, false, $arr, $arrLen, asOneVal, 1, null);
					continue;
				}
			}
			if ($i.parentNode === $parent) {
				//если мы не ушли вглубь - значит и вправо двигаться нельзя
				return;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				this.q_cloneNodeCreate($i as HTMLElement, true, $arr, $arrLen, asOneVal, 2, null);
				continue;
			}
			do {
				$i = $i.parentNode as HTMLElement; //!!
				//if ($i.nodeType === 11) {
				if ($i.nodeType !== 11) {
					for (let i = 0; i < $arrLen; ++i) {
						$arr[i] = $arr[i].parentNode as HTMLElement;
					}
				} else {
					$i = $p.pop() as HTMLElement; //!!
					for (let i = 0; i < $arrLen; ++i) {
						$arr[i] = $tP[i].pop();
					}
				}
				if ($i.parentNode === $parent) {
					return;
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					this.q_cloneNodeCreate($i as HTMLElement, true, $arr, $arrLen, asOneVal, 2, null);
					break;
				}
			} while (true);
		} while (true);
	}

	private q_cloneNodeCreate(
		$e: HTMLElement,
		isNotHide: boolean,
		$arr: Node[],
		$arrLen: number,
		asOneVal: Map<number, number>[],
		type: number, //0-родители, 1-пошли в вглубь, 2-пошли вбок
		baseAsOnes: Set<string> | null
	) {
		const src = this.myweb.context.srcBy$src.get($e);
		if (src === undefined) {
			if (type === 2) {
				for (let i = 0; i < $arrLen; ++i) {
					$arr[i] = ($arr[i].parentNode as HTMLElement).appendChild($e.cloneNode());
				}
				return;
			}
			if (type === 1) {
				if (isNotHide) {
					for (let i = 0; i < $arrLen; ++i) {
						$arr[i] = $arr[i].appendChild($e.cloneNode());
					}
					return;
				}
				for (let i = 0; i < $arrLen; ++i) {
					$arr[i] = ($arr[i] as HTMLTemplateElement).content.appendChild($e.cloneNode());
				}
				return;
			}
			for (let i = 0; i < $arrLen; ++i) {
				$arr[i] = $e.cloneNode();
			}
			return;
		}
		const {descr, idx, asOneIdx, save} = src;
		if (type === 2) {
			for (let i = 0; i < $arrLen; ++i) {
				$arr[i] = ($arr[i].parentNode as HTMLElement).appendChild($e.cloneNode());
				this.myweb.createSrc(
					$arr[i] as HTMLElement,
					descr,
					asOneIdx === null ? null : new Map(asOneIdx),
					idx === null ? null : new Map(idx)
				).save = save;
			}
			if (asOneIdx !== null) {
				this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx.keys());
			}
			return;
		}
		if (type === 1) {
			if (isNotHide) {
				for (let i = 0; i < $arrLen; ++i) {
					$arr[i] = $arr[i].appendChild($e.cloneNode());
					this.myweb.createSrc(
						$arr[i] as HTMLElement,
						descr,
						asOneIdx === null ? null : new Map(asOneIdx),
						idx === null ? null : new Map(idx)
					).save = save;
				}
				if (asOneIdx !== null) {
					this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx.keys());
				}
				return;
			}
			for (let i = 0; i < $arrLen; ++i) {
				$arr[i] = ($arr[i] as HTMLTemplateElement).content.appendChild($e.cloneNode());
				this.myweb.createSrc(
					$arr[i] as HTMLElement,
					descr,
					asOneIdx === null ? null : new Map(asOneIdx),
					idx === null ? null : new Map(idx)
				).save = save;
			}
			if (asOneIdx !== null) {
				this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, asOneIdx.keys());
			}
			return;
		}
		for (let i = 0; i < $arrLen; ++i) {
			$arr[i] = $e.cloneNode();
			this.myweb.createSrc(
				$arr[i] as HTMLElement,
				descr,
				asOneIdx === null ? null : new Map(asOneIdx),
				src.idx === null ? null : new Map(src.idx)
			).save = save;
		}
		if (baseAsOnes !== null) {
			this.q_cloneNodeChangeAsOne($arr, $arrLen, asOneVal, baseAsOnes.values());
		}
	}

	private q_cloneNodeChangeAsOne($arr: Node[], $arrLen: number, asOneVal: Map<number, number>[], asOnes: IterableIterator<string>) {
		const srcBy$src = this.myweb.context.srcBy$src;
		for (let i = 0; i < $arrLen; ++i) {
			const $i = $arr[i];
			const iSrc = srcBy$src.get($i as HTMLElement) as Src;
			for (const n of asOnes) {
				const iAsOneId = (iSrc.asOneIdx as Map<string, number>).get(n) as number;
				const iAsOneIdByAsOneId = asOneVal[i].get(iAsOneId);
				if (iAsOneIdByAsOneId !== undefined) {
					iSrc.setAsOneIdx(n, iAsOneIdByAsOneId);
					continue;
				}
				const vv = this.myweb.getNewId();
				asOneVal[i].set(iAsOneId, vv);
				iSrc.setAsOneIdx(n, vv);
			}
		}
	}

	//use in attr
	/*не нужно из-за того что будет срабатывать только один раз - дальше кэш
// --- вообще то может пригодится если будет надобность получить значение которе еще не применено через раф - но пока не нужно
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
	setAttribute(name: string, value: string, $src = this.myweb.context.$srcById.get(this.id) as HTMLElement) {
		//todo атрибут нельзя создать, если в нем есть некорректные символы - решение ниже слишком избыточное, на мой взгляд
		//for (let i = name.indexOf("$"); i > 0; i = name.indexOf("$")) {
		//	name = name.substring(0, i) + name.substring(i + 1);
		//}
		$src.setAttribute(name, value);
		this.setAttributeValue(name, value, $src as HTMLInputElement);
		//!!! думаю что так можно
		//getDescrAttrsBy$scr($e)[name] = value;
	}

	setAttributeValue(name: string, value: string, $src = this.myweb.context.$srcById.get(this.id) as HTMLInputElement) {
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
	removeAttribute(name: string) {
		const $src = this.myweb.context.$srcById.get(this.id) as HTMLInputElement;
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
		//getDescrAttrsBy$scr($e).delete(name);
	}

	setAsOneIdx(str: string, idx: number) {
		if (this.asOneIdx === null) {
			this.asOneIdx = new Map();
		}
		this.asOneIdx.set(str, idx);
		//!!
		if (my.debugLevel === 0) {
			return;
		}
		const $src = this.myweb.context.$srcById.get(this.id) as HTMLTemplateElement;
		const name = config.asOneIdxName + str;
		$src.setAttribute(name, String(idx));
		//if ($src.nodeName === "TEMPLATE" && $src.getAttribute(config.hideName) !== null) {// && $src.content.firstChild !== null) {//при q_cloneNode мы клонируем не рекурсивно, а это значит что нет внутренностей - они появятся позже
		if (this.isHide && $src.content.firstChild !== null) {
			//todo!!!!! тут проблема в установке атрибута из-за алгоритма q_clone - он не клонирует рекурсивно - todo после можно переделать алгоритм
			($src.content.firstChild as HTMLElement).setAttribute(name, idx as unknown as string);
		}
	}

	getIdx(str: string) {
		if (this.idx !== null) {
			return this.idx.get(str);
		}
	}

	setIdx(str: string, idx: number) {
		if (this.idx === null) {
			this.idx = new Map();
		}
		this.idx.set(str, idx);
		//!!
		if (my.debugLevel === 0) {
			return;
		}
		const $src = this.myweb.context.$srcById.get(this.id) as HTMLTemplateElement;
		const name = config.idxName + str;
		$src.setAttribute(name, String(idx));
		//if ($src.nodeName === "TEMPLATE" && $src.getAttribute(config.hideName) !== null) {
		if (this.isHide) {
			($src.content.firstChild as HTMLElement).setAttribute(name, idx as unknown as string);
		}
	}

	get$first(str: string): HTMLElement {
		//todo
		if (this.descr.attr === null || this.descr.get$elsByStr === null) {
			throw new Error("this.descr.attr === null || this.descr.get$elsByStr === null");
		}
		const $src = this.myweb.context.$srcById.get(this.id) as HTMLElement;
		const attrIt = this.descr.attr.keys();
		let i = attrIt.next();
		if (str !== "") {
			for (; !i.done; i = attrIt.next()) {
				if (i.value === str) {
					break;
				}
			}
		}
		while (!i.done) {
			const n = i.value;
			const get$e = this.descr.get$elsByStr.get(n);
			if (get$e !== undefined) {
				return (this.myweb.context.commandWithArgsByStr.get(n) as CommandWithArgs).command.get$first(
					$src,
					n,
					get$e.expr,
					get$e.pos
				);
			}
			i = attrIt.next();
		}
		return $src;
	}

	get$els(str: string): HTMLElement[] {
		//todo
		if (this.descr.attr === null || this.descr.get$elsByStr === null) {
			throw new Error("this.descr.attr === null || this.descr.get$elsByStr === null");
		}
		const $src = this.myweb.context.$srcById.get(this.id) as HTMLElement;
		const attrIt = this.descr.attr.keys();
		let i = attrIt.next();
		if (str !== "") {
			for (; !i.done; i = attrIt.next()) {
				if (i.value === str) {
					break;
				}
			}
		}
		while (!i.done) {
			const n = i.value;
			const get$e = this.descr.get$elsByStr.get(n);
			if (get$e !== undefined) {
				return (this.myweb.context.commandWithArgsByStr.get(n) as CommandWithArgs).command.get$els(
					$src,
					n,
					get$e.expr,
					get$e.pos
				);
			}
			i = attrIt.next();
		}
		return [$src];
	}

	getNextStr(str: string) {
		//todo
		if (this.descr.attr === null) {
			throw new Error("this.descr.attr === null");
		}
		//todo есть много вызовов в которых уже вычислен src
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

	getAttrAfter(name: string) {
		const a = new Map<string, string>();
		const attrIt = this.getAttrAfterEntries(name);
		for (let i = attrIt.next(); !i.done; i = attrIt.next()) {
			a.set(i.value[0], i.value[1]);
		}
		return a;
	}

	getAttrAfterEntries(name: string) {
		//todo
		if (this.descr.attr === null) {
			throw new Error("this.descr.attr === null");
		}
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

	getAttrAfterKeys(name: string) {
		//todo
		if (this.descr.attr === null) {
			throw new Error("this.descr.attr === null");
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
		const $root = this.myweb.context.rootElement;
		let $i = this.myweb.context.$srcById.get(this.id) as Node | null;
		do {
			if ($i === $root) {
				return false;
			}
			$i = ($i as Node).parentNode;
		} while ($i !== null);
		return true;
	}
}
