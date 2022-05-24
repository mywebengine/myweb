export default class Context {
	constructor() {
		this.reqCmd = new Map();

		this.$srcById = new Map();
		this.srcById = new Map();
		this.srcBy$src = new WeakMap();
		this.descrById = new Map();
		this.idCurVal = 0;

		this.varIdByVar = new Map();
		this.varById = new Map();
		this.varIdByVarIdByProp = new Map();
		this.srcIdsByVarId = new Map();

		this._func = new Map();

		this.loadingCount = new Map();

		this.renderParams = new Set();
		this.mw_delay = 0;
		this.mw_delayId = 0;
		this.mw_syncId = 0;
		this.__oldLocHash = "";
		this.delayParams = new Set();
		this.syncInRender = new Set();
		this.curRender = Promise.resolve();

		this.document = document;
		this.rootElement = document.documentElement;
	}
};
