import {type_animation, type_renderRes} from "../render/render.js";
import {type_cacheValue, type_cacheCurrent} from "../cache.js";
import {defFetchReq, loadEventName, okEventName, errorEventName, resultDetailName, errorDetailName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2} from "../eval2.js";
import {getRequest, dispatchEvt, check} from "../util.js";
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
self.Tpl_fetchDefGetError = undefined;//default error handler

export default {
	render(req) {
//console.log("fetch", req);
		return eval2(req, req.$src, true)
			.then(val => {
				const r = getRequest(val, "");
				if (r === null) {
					return type_renderRes(true);
				}
				const f = r instanceof Response ? fetchGetRes(req, r, null) : fetchGetFetch(req, r);
				req.sync.afterAnimation.add(type_animation(() => f, req.local, 0));
				return null;
			});
	}
};
function fetchGetFetch(req, r) {
	if (req.sync.stat !== 0) {
		fetchClear(req);
		return;
	}
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
		.then(res => fetchGetRes(req, res, null))
		.catch(err => fetchGetRes(req, null, err));
}
function fetchGetRes(req, res, err) {
	if (req.sync.stat !== 0) {
		fetchClear(req);
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
function fetchClear(req) {
	if (self.Tpl_debugLevel !== 0) {
		console.info("clear fetch => ", req);
	}
	const c = srcBy$src.get(req.$src).cache;
//	if (c !== null) {
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
