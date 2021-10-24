import {type_animation, type_renderRes} from "../render/render.js";
import {type_cacheValue, type_cacheCurrent} from "../cache.js";
import {defFetchReq, loadEventName, okEventName, errorEventName, resultDetailName, errorDetailName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2} from "../eval2.js";
import {dispatchEvt, check} from "../util.js";
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
//--const fetchParams = ["method", "mode", "cache", "credentials", "headers", "redirect", "referrer", "body", "contentType"];

self.Tpl_fetchDefGetError = undefined;//default error handler

export default {
	render(req) {
//console.log("fetch", req);
		return getUrl(req)
			.then(r => {
				if (r === null) {
					return type_renderRes(true);
				}
				const f = r instanceof Response ? getRes(req, r, null) : getFetch(req, r);
				req.sync.afterAnimation.add(type_animation(() => f, req.local, 0));
				return null;
			});
	}
};
function getUrl(req) {
	return eval2(req, req.$src, true)
		.then(r => {
			if (typeof r === "string") {
				return r !== "" ? new Request(r) : null;
			}
			return r instanceof Request || r instanceof Response ? r : null;
		});
}
function getFetch(req, r) {
	if (req.sync.stat !== 0) {
		clear(req);
		return;
	}
/*
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
	} else if (typeof fParam.body === "object" && !isFormData) {
		fParam.headers["Content-Type"] = "application/json";
		fParam.body = JSON.stringify(fParam.body);
	}*/
	for (const n in defFetchReq) {
		if (n === "headers") {
			for (const n in defFetchReq.headers) {
				if (r.headers[n] === undefined) {
					r.headers[n] = defFetchReq.headers[n];
				}
			}
			continue;
		}
		if (r[n] === undefined) {
			r[n] = defFetchReq[n];
		}
	}
	return fetch(r)
		.then(res => getRes(req, res, null))
		.catch(err => getRes(req, null, err));
}
function getRes(req, res, err) {
	if (req.sync.stat !== 0) {
		clear(req);
		return;
	}
	req.sync.afterAnimation.add(type_animation(() => req.sync.beforeAnimation.add(type_animation(() => {//это нужно для того что бы избежать ситуации, когда ранее уже был загружен и был сет (который вызывает отмену рендера и очистку текущего)
		const det = type_fetchDetailEvent(res, err);
		if (err !== null) {
			dispatchEvt(req.$src, errorEventName, det);
			if (self.Tpl_fetchDefGetError) {
				return self.Tpl_fetchDefGetError(det);
			}
			return;
		}
		dispatchEvt(req.$src, loadEventName, det);
		if (res.ok) {
			dispatchEvt(req.$src, okEventName, det);
		}
	}, req.local, 0)), req.local, 0));
}
function clear(req) {
	if (self.Tpl_debugLevel !== 0) {
		console.info("clear fetch => ", req);
	}
	const c = srcBy$src.get(req.$src).cache;
//	if (c) {
		c.value = type_cacheValue();//todo тут можно удалять кэш только для дочерних элементов, но так как еще нужно удалить кэш для команд-после, то такой подход оправдан
		c.current = type_cacheCurrent();
//	}
}
function type_fetchDetailEvent(res, err) {
	return {
		[resultDetailName]: res,
		[errorDetailName]: err
	};
}
