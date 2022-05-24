export default class Src {
	constructor(id, descr, isCmd, isHide, asOneIdx, idx, cache, scopeCache) {
		this.id = id;
//		this.descrId = 0,
		this.descr = descr;
		this.isCmd = isCmd;//false,
		this.isHide = isHide;
		this.asOneIdx = asOneIdx;
		this.idx = idx
		this.save = null;
		this.cache = cache;
		this.scopeCache = scopeCache;
		this.isMounted = false;
	}
};
