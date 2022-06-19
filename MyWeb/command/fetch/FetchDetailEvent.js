import config from "../../../config/config.js";

export default class FetchDetailEvent {
	constructor(res, err) {
		this[config.resultDetailName] = res;
		this[config.errorDetailName] = err;
	}
};
