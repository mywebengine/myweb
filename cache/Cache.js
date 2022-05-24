export default class Cache {
	constructor() {
		this.isInits = new Set();
		this.current = new Map();
		this.value = new Map();
		this.attrSyncCur = new Map();
	}
};
