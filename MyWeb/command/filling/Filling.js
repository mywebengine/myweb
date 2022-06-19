import Command from "../Command.js";

export default class Filling extends Command {
	render(req) {
		const args = req.commandWithArgs.args;
		return this.my.showLoading(req.$src, () => this.my.eval2(req, req.$src, true), args[0], args[1])
			.then(() => null);
	}
};
