export default class Context {
	currentIdValue = 0;
	commandWithArgsByStr = new Map();

	$srcById = new Map();
	srcById = new Map();
	srcBy$src = new WeakMap();
	descrById = new Map();
	varIdByVar = new Map();
	varById = new Map();
	varIdByVarIdByProp = new Map();
	srcIdsByVarId = new Map();
	functionByExpr = new Map();

	renderParams = new Set();
	delayInMs = 0;
	delayId = 0;
	delayParams = new Set();
	syncId = 0;
	_oldLocHash = "";
	syncInRender = new Set();
	currentRender = Promise.resolve();
	loadingCount = new Map();

	document = document;
	rootElement = document.documentElement;
/*
	constructor() {
		this.currentIdValue = 0;
		this.commandWithArgsByStr = new Map();

		this.$srcById = new Map();
		this.srcById = new Map();
		this.srcBy$src = new WeakMap();
		this.descrById = new Map();
		this.varIdByVar = new Map();
		this.varById = new Map();
		this.varIdByVarIdByProp = new Map();
		this.srcIdsByVarId = new Map();
		this.functionByExpr = new Map();

		this.renderParams = new Set();
		this.delayInMs = 0;
		this.delayId = 0;
		this.delayParams = new Set();
		this.syncId = 0;
		this._oldLocHash = "";
		this.syncInRender = new Set();
		this.currentRender = Promise.resolve();
		this.loadingCount = new Map();

		this.document = document;
		this.rootElement = document.documentElement;
	}*/
};
