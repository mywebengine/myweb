export default class Include {
	constructor(readyState, url, req, res) {
//		this.key = req === null ? (res === null ? url : res) : (req.method === "GET" ? url : req);
		this.key = req === null ? url : (req.method === "GET" ? url : req);
		this.readyState = readyState;
		this.url = url;
		this.req = req;
		this.res = res;
		this.$fr = null;
		this.$tags = null;
		this.scope = null;
	}
};
