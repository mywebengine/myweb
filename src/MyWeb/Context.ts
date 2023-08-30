import {CommandWithArgs} from "./CommandWithArgs.js";
import {Descr} from "./Descr.js";
import {DelayParam} from "./DelayParam.js";
import {RenderParam} from "./RenderParam.js";
import {Src} from "./Src.js";
import {Sync} from "./Sync.js";
import {CustomElementState} from "./CustomElementState.js";

export class Context {
	currentIdValue = 0;
	commandWithArgsByStr = new Map<string, CommandWithArgs | null>();

	$srcById = new Map<number, HTMLElement>();
	srcById = new Map<number, Src>();
	srcBy$src = new WeakMap<HTMLElement, Src>();
	descrById = new Map<number, Descr>();
	varIdByVar = new Map<object, number>();
	varById = new Map<number, object>();
	varIdByVarIdByProp = new Map<number, Map<string | symbol, number>>();
	srcIdsByVarId = new Map<number, Set<number>>();
	functionByExpr = new Map<string, (...args: unknown[]) => Promise<unknown>>();
	customElementByKey = new Map<string | Request | Response, CustomElementState>();

	renderParams = new Set<RenderParam>();
	delayInMs = 0;
	delayId = 0;
	delayParams = new Set<DelayParam>();
	syncId = 0;
	_oldLocHash = "";
	syncInRender = new Set<Sync>();
	currentRender = Promise.resolve();
	//todo rename to loadingCountBySrcId
	loadingCount = new Map<number, Map<string, number>>();

	document = document;
	rootElement = document.documentElement;
}
