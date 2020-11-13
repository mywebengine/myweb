import {cache} from "../cache.js";
import {srcId, cmdPref, defFetchReq, watchName, ifWatchName, paramName, ifParamName} from "../config.js";
import {eval2, getVal, _getVal} from "../eval2.js";
import {normalizeURL} from "../loc.js";
import {getScope} from "../scope.js";
import {afterRender, type_renderRes} from "../render/algo.js";
import {check} from "../util.js";

const fetchParams = ["method", "mode", "cache", "credentials", "headers", "redirect", "referrer", "body", "contentType"];

export default {
	async render(req) {
/*
    return fetch(url, {
        method: 'POST', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, cors, *same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
            'Content-Type': 'application/json',
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrer: 'no-referrer', // no-referrer, *client
        body: JSON.stringify(data), // тип данных в body должен соответвовать значению заголовка "Content-Type"
    })*/
//console.log("fetch", req);
		const url = await getURL(req);
		if (!url) {
			return type_renderRes(true);
		}
		const ifp = await getIfparam(req, url);
		if (ifp.f) {
			const pArr = [];
			for (const i of fetchParams) {
				pArr.push(getVal(req, i, req.$src, true));
			}
			pArr.push(ifp.param || _getVal(req, paramName, req.$src, true));
			afterRender.add(() => Promise.all(pArr)
				.then(vals => getFetch(req, url, ...vals))
//				.then(() => console.log(url))
			);
		}
		return type_renderRes(true);
	},
	linker(req) {
/*
		if (getURL(req)) {
			const ifp = getIfparam(req);
			if (ifp.f) {
				for (const i of params) {
					getVal(req, i, req.$src, true);
				}
				if (!ifp.param) {
					_getVal(req, "param", req.$src, true);
				}
			}
		}
		return type_renderRes(true);*/
	}
};
async function getURL(req) {
	const url = req.reqCmd.args[0] ? req.expr : await eval2(req, req.$src, true);
	if (!url) {
		return "";
	}
	const isIfWatch = req.$src.dataset[cmdPref + ifWatchName] !== undefined || req.$src.dataset[ifWatchName] !== undefined;
	if (!isIfWatch && req.$src.dataset[cmdPref + watchName] === undefined && req.$src.dataset[watchName] === undefined) {
		return normalizeURL(url);
	}
	const watch = await getVal(req, isIfWatch && ifWatchName || watchName, req.$src, true);
	if (isIfWatch && !watch) {
//console.log(111, watch, req);
		return "";
	}
	const sId = req.$src[srcId],
		cur = cache[sId].current[req.str] || (cache[sId].current[req.str] = type_fetchCur());
//console.log(sId, cur, watch === cur.watch);
	if (cache[sId].isInit[req.str]) {
		if (watch === cur.watch) {
//console.log(222, watch, cur[0], cur[1], req);
			return "";
		}
	} else {
		cache[sId].isInit[req.str] = true;
	}
	cur.watch = watch;
	return normalizeURL(url);
}
async function getIfparam(req, url) {
	const ifp = type_ifparam(true, null);
	if (req.$src.dataset[cmdPref + ifParamName] === undefined && req.$src.dataset[ifParamName] === undefined) {
		return ifp;
	}
	ifp.param = await _getVal(req, ifParamName, req.$src, true);
	const sId = req.$src[srcId],
		cur = cache[sId].current[req.str] || (cache[sId].current[req.str] = type_fetchCur());
	if (ifp.param === cur.ifparam) {
		ifp.f = false;
		return ifp;
	}
	if (!ifp.param) {
		ifp.f = false;
	}
	cur.ifparam = ifp.param;
	return ifp;
}
function type_fetchCur() {
	return {
		watch: undefined,
		ifparam: undefined
	};
}
function type_ifparam(f, param) {
	return {
		f,
		param
	};
}
function getFetch(req, url, method, mode, cache, credentials, headers, redirect, referrer, body, contentType, param) {
	const fParam = type_fParam(method || "GET", mode, cache, credentials, headers || {}, redirect, referrer, body);
	if (param) {
		for (const i of fetchParams) {
			if (param[i] !== undefined) {
				fParam[i] = param[i];
			}
		}
		if (param.contentType) {
			contentType = param.contentType;
		}
		if (param.query) {
			const q = [];
			for (const n in param.query) {
				const v = param.query[n];
				if (Array.isArray(v)) {
					for (const i of v) {
						q.push(type_qParam(n, i));
					}
				} else {
					q.push(type_qParam(n, v));
				}
			}
			if (url.indexOf('?') === -1) {
				url += "?";
			}
			url += q.join("&");
		}
	}
	if (contentType) {
		switch (contentType.toUpperCase()) {
			case "JSON":
				fParam.headers["Content-Type"] = "application/json";
				if (fParam.body && typeof fParam.body === "object") {
					fParam.body = JSON.stringify(fParam.body);
				}
			break;
			case "FORM":
				fParam.headers["Content-Type"] = "application/x-www-form-urlencoded";
			break;
			case "FORMDATA":
//--				fParam.headers["Content-Type"] = "multipart/form-data";
			break;
			default:
				fParam.headers["Content-Type"] = contentType;
			break;
		}
	} else if (fParam.body && typeof fParam.body === "object" && !(fParam.body instanceof FormData)) {
		fParam.headers["Content-Type"] = "application/json";
		fParam.body = JSON.stringify(fParam.body);
	}
	for (const n in defFetchReq) {
		if (n === "headers") {
			for (const n in defFetchReq.headers) {
				if (fParam.headers[n] === undefined) {
					fParam.headers[n] = defFetchReq.headers[n];
				}
			}
			continue;
		}
		if (fParam[n] === undefined) {
			fParam[n] = defFetchReq[n];
		}
	}
	return fetch(url, fParam)
		.then(async res => {
			req.scope = await getScope(req.$src, req.str);
			await _getVal(req, "onload", res, false);
			await _getVal(req, res.ok && "onok" || "onerror", res, false);
		})
		.catch(async err => {
			req.scope = await getScope(req.$src, req.str);
			const f = await _getVal(req, "onerror", err, false);
			if (f === undefined || f) {
				throw err;
			}
		});
/*
	try {
		const res = await fetch(url, fParam);
		_getVal(req, "onload", res, false);
		_getVal(req, res.ok ? "onok" : "onerror", res, false);
	} catch (err) {
		const f = await _getVal(req, "onerror", err, false)
		if (f === undefined || f) {
			throw check(err);
		}
	}*/
}
function type_fParam(method, mode, cache, credentials, headers, redirect, referrer, body) {
	return {
		method,
		mode,
		cache,
		credentials,
		headers,
		redirect,
		referrer,
		body
	};
}
function type_qParam(n, v) {
	return encodeURIComponent(n) + "=" + encodeURIComponent(v);
}
