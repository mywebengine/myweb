import Q$i from "../../dom/Q$i.js";

export default class ForeachContext {
	constructor(keys, value, $els, valName, keyName) {
		const $elsLen = $els.length,
			els = new Array($elsLen);
		for (let i = 0; i < $elsLen; i++) {
			els[i] = new Q$i($els[i], i);
		}
		this.keys = keys;
		this.value = value;
		this.els = els;
		this.valName = valName;
		this.keyName = keyName;
	}
};
