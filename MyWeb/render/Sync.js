export default class Sync {
	constructor(syncId, renderParam) {
		this.syncId = syncId;
		this.renderParam = renderParam;
		this.local = new Map();

		this.beforeAnimations = new Set();
		this.animations = new Set();
		this.afterAnimations = new Set();
		this.scrollAnimations = new Set();
		this.onreadies = new Set();

		this.idleCallback = new Map();
		this.animationFrame = new Map();
		this.stat = 0;
		this.promise = new Promise(resolve => this.resolve = resolve);
	}
};
