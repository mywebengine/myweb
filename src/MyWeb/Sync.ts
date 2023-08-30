import {LocalState} from "./LocalState.js";
import {RenderParam} from "./RenderParam.js";
import {Task} from "./Task.js";

export class Sync {
	syncId: number;
	renderParam: RenderParam;
	local = new Map<number, LocalState>();
	beforeAnimations = new Set<Task>();
	animations = new Set<Task>();
	afterAnimations = new Set<Task>();
	scrollAnimations = new Set<Task>();
	//--this.onreadies = new Set();
	idleCallback = new Map<number, Function>();
	animationFrame = new Map<number, Function>();
	stat = 0;
	promise: Promise<void>;
	// @ts-ignore
	resolve: (value: (void | PromiseLike<void>)) => void;

	constructor(syncId: number, renderParam: RenderParam) {
		this.syncId = syncId;
		this.renderParam = renderParam;
		this.promise = new Promise(resolve => {
			this.resolve = resolve;
		});
	}
}
