export default class IncLoading {
	constructor(req) {
		const args = req.commandWithArgs.args,
			a0 = args[0],
			a1 = args[1];
		this.type = a0 !== "" && a0 !== undefined ? a0 : "";
		this.waitTime = a1 !== "" && a1 !== undefined ? a1 : "";
		this.isShow = this.waitTime !== "" || this.type !== "";
	}
};
