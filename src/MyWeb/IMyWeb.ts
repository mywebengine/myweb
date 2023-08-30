import {ICommand} from "./ICommand.js";
import {Context} from "./Context.js";
import {Descr} from "./Descr.js";
import {LocalState} from "./LocalState.js";
import {Req} from "./Req.js";
import {Q_arr} from "./Q_arr.js";
import {Src} from "./Src.js";
import {Sync} from "./Sync.js";

export interface ICommandConstructor {
	new (my: IMyWeb): ICommand;
}

//Base_MyWeb <- (CreateDom <- RemoveChild <- ShowHide) <- Eval2 <- Loading <- (RenderLoop <- RenderTag <- Q_renderTag <- Render) <- this
export interface IMyWeb {
	context: Context;

	//CreateDom
	createSrc($e: HTMLElement, descr: Descr | null, asOneIdx: Map<string, number> | null, idx: Map<string, number> | null): Src;

	createDescr($e: HTMLElement, srcId: number): Descr;

	prepare$src($i: Node, isLinking: boolean): void;

	joinText($e: HTMLElement | DocumentFragment): void;

	//RemoveChild
	removeChild($e: Node): void;

	//ShowHide
	show(req: Req, $e: HTMLElement): void;

	hide(req: Req, $e: HTMLElement): void;

	is$visible($e: HTMLElement): boolean;

	//Eval2
	eval2(req: Req, $src: HTMLElement, isReactive: boolean): Promise<unknown>;

	eval2Execute(req: Req, $src: HTMLElement): Promise<unknown>;

	q_eval2(req: Req, arr: Q_arr[], isLast: Set<number>): Promise<unknown[]>;

	//Loading
	showLoading($e: HTMLElement, testFunc: Function, type: string, waitTime?: number | string): Promise<void>;

	//RenderLoop
	checkScrollAnimations(): void;

	//RenderTag
	renderTag($src: HTMLElement, scope: Record<string | symbol, unknown>, str: string, sync: Sync): Promise<HTMLElement>;

	createReq($src: HTMLElement, str: string, expr: string, scope: Record<string | symbol, unknown> | null, event: Event | null, sync: Sync): Req;

	//Q_renderTag
	q_renderTag(arr: Q_arr[], str: string, isLast: Set<number>, sync: Sync): Promise<Q_arr[]>;

	//Render
	render($src: HTMLElement, delay?: number, scope?: Record<string | symbol, unknown> | null, isLinking?: boolean): Promise<unknown>;

	renderBySrcIds(srcIds: Set<number>): Promise<unknown>;

	setDelay(time: number, cb?: Function): void;

	getCurRender(): Promise<void>;

	get$srcScope($e: HTMLElement): Record<string | symbol, unknown>;

	//Base_MyWeb
	reset(context: Context): void;

	getReact<T>(value: T): T;

	getScopeReact<T>(value: T): T;

	addCommand(name: string, command: ICommandConstructor): void;

	addStrToCommandWithArgsIfThatCommend(str: string): boolean;

	getNewId(): number;

	//todo rename local
	getSrcId(local: Map<number, LocalState>, srcId: number): number;

	getError(err: Error, $src: Node, req?: Req, scope?: Record<string, unknown>, fileName?: string, lineNum?: number, colNum?: number): Error;
}
