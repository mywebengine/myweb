import {config} from "../config.js";
import {my} from "../myweb.js";
import {Context} from "./Context.js";
import {CustomElement} from "./CustomElement.js";
import {Descr} from "./Descr.js";
import {CommandWithArgs} from "./CommandWithArgs.js";
import {ICommand} from "./ICommand.js";
import {ICommandConstructor, IMyWeb} from "./IMyWeb.js";
import {LocalState} from "./LocalState.js";
import {MyWebProxyController} from "./MyWebProxyController.js";
import {Q_arr} from "./Q_arr.js";
import {Req} from "./Req.js";
import {Src} from "./Src.js";
import {Sync} from "./Sync.js";

//Base_MyWeb <- (CreateDom <- RemoveChild <- ShowHide) <- Eval2 <- Loading <- (RenderLoop <- RenderTag <- Q_renderTag <- Render) <- this
export abstract class Base_MyWeb implements IMyWeb {
	context = new Context();
	//todo rename to command
	protected commands = new Map<string, ICommand>();
	//todo
	protected customElementByKey = new Map<string, CustomElement>();
	protected proxyController: MyWebProxyController;

	constructor() {
		this.proxyController = new MyWebProxyController(this, config.p_target);
	}

	//CreateDom
	abstract createSrc($e: HTMLElement, descr: Descr | null, asOneIdx: Map<string, number> | null, idx: Map<string, number> | null): Src;

	abstract createDescr($e: HTMLElement, srcId: number): Descr;

	abstract prepare$src($i: Node, isLinking: boolean): void;

	abstract joinText($e: HTMLElement | DocumentFragment): void;

	//RemoveChild
	abstract removeChild($e: Node): void;

	//ShowHide
	abstract show(req: Req, $e: HTMLElement): void;

	abstract hide(req: Req, $e: HTMLElement): void;

	abstract is$visible($e: HTMLElement): boolean;

	//Eval2
	abstract eval2(req: Req, $src: HTMLElement, isReactive: boolean): Promise<unknown>;

	abstract eval2Execute(req: Req, $src: HTMLElement): Promise<unknown>;

	abstract q_eval2(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<unknown[]>;

	//Loading
	abstract showLoading($e: HTMLElement, testFunc: Function, type: string, waitTime?: number | string): Promise<void>;

	//RenderLoop
	abstract checkScrollAnimations(): void;

	//RenderTag
	abstract renderTag($src: HTMLElement, scope: Record<string | symbol, unknown>, str: string, sync: Sync): Promise<HTMLElement>;

	abstract createReq(
		$src: HTMLElement,
		str: string,
		expr: string,
		scope: Record<string | symbol, unknown> | null,
		event: Event | null,
		sync: Sync
	): Req;

	//Q_renderTag
	abstract q_renderTag(arr: Q_arr[], str: string, isLast: Set<number>, sync: Sync): Promise<Q_arr[]>;

	//Render
	abstract render($src: HTMLElement, delay?: number, scope?: Record<string | symbol, unknown> | null, isLinking?: boolean): Promise<unknown>;

	abstract renderBySrcIds(srcIds: Set<number>): Promise<unknown>;

	abstract setDelay(time: number, cb?: Function): void;

	abstract getCurRender(): Promise<void>;

	abstract get$srcScope($e: HTMLElement): Record<string | symbol, unknown>;

	//Base_MyWeb - this
	reset(context = new Context()) {
		//нужен для ssr
		this.context = context;
		this.proxyController.reset();
		this.customElementByKey.clear();
		this.proxyController = new MyWebProxyController(this, config.p_target);
		for (const i of this.commands.values()) {
			i.reset();
		}
	}

	getReact<T>(value: T) {
		return this.proxyController.createProxy(value);
	}

	getScopeReact<T>(value: T) {
		return this.proxyController.createScopeProxy(value);
	}

	addCommand(name: string, command: ICommandConstructor) {
		this.commands.set(name, new command(this));
	}

	addStrToCommandWithArgsIfThatCommend(str: string) {
		const already = this.context.commandWithArgsByStr.get(str);
		if (already === null) {
			return false;
		}
		if (already !== undefined) {
			return true;
		}
		const i = str.indexOf(config.commandArgsDiv);
		const commandName = i === -1 ? str : str.substring(0, i);
		const command = this.commands.get(commandName);
		if (command === undefined) {
			this.context.commandWithArgsByStr.set(str, null);
			return false;
		}
		this.context.commandWithArgsByStr.set(
			str,
			new CommandWithArgs(
				commandName,
				command,
				i !== -1 ? str.substring(i + config.commandArgsDivLen).split(config.commandArgsDiv) : []
			)
		);
		return true;
	}

	getNewId() {
		return ++this.context.currentIdValue;
	}

	//todo rename local
	getSrcId(local: Map<number, LocalState>, srcId: number) {
		if (this.context.srcById.has(srcId)) {
			return srcId;
		}
		for (let l = local.get(srcId); l !== undefined && l.newSrcId !== 0; l = local.get(srcId)) {
			srcId = l.newSrcId;
		}
		return srcId;
	}

	getError(err: Error, $src: Node, req?: Req, scope?: Record<string, unknown>, fileName?: string, lineNum?: number, colNum?: number) {
		let errMsg = ">>>mw error";
		if (my.getLineNo !== undefined) {
			const pos = my.getLineNo($src as HTMLElement); // || my.getLineNo($src.parentNode);//todo зачем смотреть родителя?
			if (pos) {
				errMsg += ` in ${pos}`;
			}
		}
		errMsg += "\n" + err.toString();
		const params = [];
		params.push("\n$src =>", $src, "\nsrcId =>", this.context.srcBy$src.get($src as HTMLElement)?.id);
		if (req) {
			params.push("\nreq =>", req);
			params.push("\n" + req.str + " =>", req.expr);
		}
		if (scope) {
			params.push("\nscope =>", scope);
		}
		if (my.debugLevel !== 0) {
			console.info(errMsg, ...params);
		}
		//todo
		// return fileName ? new Error(err, fileName, lineNum, colNum) : err;
		return err;
	}
}
