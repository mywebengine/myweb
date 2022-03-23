export function type_env() {
	return {
		cmd: new Map(),
		reqCmd: new Map(),

		$srcById: new Map(),
		srcById: new Map(),
		srcBy$src: new WeakMap(),
		descrById: new Map(),
		idCurVal: 0,

		varIdByVar: new Map(),
		varById: new Map(),
		varIdByVarIdByProp: new Map(),
		srcIdsByVarId: new Map(),

		_func: new Map()
	};
}
