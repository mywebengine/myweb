export default class Animation {
	constructor(handler, local, viewedSrcId) {
		for (const p of local.values()) {
			p.animationsCount++;
		}
		this.handler = handler;
		this.local = local;
		this.viewedSrcId = viewedSrcId;
	}
	execute() {
		for (const p of this.local.values()) {
			if (p.animationsCount > 0) {
				p.animationsCount--;
			}
		}
		return this.handler();
	}
};
