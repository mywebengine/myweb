import {cmdPref} from "../const.js";
import {normalizeURL} from "../../util.js";

if (!self.AsyncFunction) {
	self.AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
}

export default {
	render: function(req) {
		const url = fetch_get.call(this, req);
//console.log("fetch url", url);
		const body = fetch_getVal.call(this, req, "body");
		if (!url || ((req.$src.dataset.body || req.$src.dataset[cmdPref + "body"]) && body === undefined)) {
			return {
				isLast: true
			};
		}
		const headers = fetch_getVal.call(this, req, "headers") || {};
		for (const i in headers) {
			if (!headers[i] && headers[i] !== 0) {
				delete headers[i];
			}
		}
		const type = req.$src.dataset.type;
		if (type) {
			switch (type.toUpperCase()) {
				case "JSON":
					headers["Content-Type"] = "application/json";
				break;
				case "FORM":
					headers["Content-Type"] = "application/x-www-form-urlencoded";
				break;
			}
		}
		fetch(url, {
			method: req.$src.dataset.method,
			headers,
			body: body,
			mode: req.$src.dataset.mode,
			credentials: req.$src.dataset.credentials,
			cache: req.$src.dataset.cache,// || "default",
			redirect: req.$src.dataset.cache// || "follow"
		})
			.then(res => {
				fetch_execAsync.call(this, req, "onload", res);
				if (res.ok) {
					fetch_execAsync.call(this, req, "onok", res);
				} else {
					fetch_execAsync.call(this, req, "onerror", res);
				}
			});
	},
	linker(req) {
		fetch_get.call(this, req);
	}
};
function fetch_get(req) {
	const url = req.args[0] ? req.expr : this.eval(req);
	if (!url) {
		return;
	}
	return normalizeURL(url);
}
function fetch_getVal(req, name, res) {
	let expr = req.$src.dataset[name];
	if (expr) {
//console.log(7777, expr, this.getEvalFunc(req, expr).toString());
		try {
			return this.getEvalFunc(req, expr).call(req.$src);
		} catch (err) {
//--			this.check(new Error(`${err}\n\tfunction body => ${expr}`, req), req);
			this.check(err, req);
			return;
		}
	}
	if (expr = req.$src.dataset[cmdPref + name]) {
		const r = this.eval({
			$src: req.$src,
			scope: req.scope,
			expr
		});
//console.log(6666, req.$src.dataset[cmdPref + name], r);
		return r;
	}
}
function fetch_execAsync(req, name, res) {
	const expr = req.$src.dataset[name];
	if (!expr) {
		return;
	}
//todo разобраться с обработкой ошибок
	new self.AsyncFunction("tpl", "req", "try {" + expr + "} catch(err) {console.log('!! async func error', err); tpl.check(err, req)}").call(res, this, req);
//	try {
//		new self.AsyncFunction(str).call(res);
//	} catch (err) {
//		this.check(err, req);//, url, err.lineNumber, err.columnNumber);
//	}
}
