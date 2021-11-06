import {type_animation, type_renderRes} from "../render/render.js";
import {type_cacheValue, type_cacheCurrent} from "../cache.js";
import {defRequestInit, loadEventName, okEventName, errorEventName, resultDetailName, errorDetailName} from "../config.js";
import {srcBy$src} from "../descr.js";
import {eval2} from "../eval2.js";
import {getRequest, dispatchEvt, check} from "../util.js";

//self.Tpl_fetchDefGetError = undefined;//default error handler

export default {
	render(req) {
//console.log("fetch", req);
		return eval2(req, req.$src, true)
			.then(val => {
				const r = getRequest(val, "");
				if (r === null) {
					return type_renderRes(true);
				}
				const f = r instanceof Response ? getRes(req, r, null) : getFetch(req, r);
				req.sync.afterAnimations.add(type_animation(() => f, req.sync.local, 0));
				return null;
			});
	}
};
function getFetch(req, r) {
	if (req.sync.stat !== 0) {
		clearFetch(req);
		return;
	}
	for (const n in defRequestInit) {
		if (n === "headers") {
			for (const n in defRequestInit.headers) {
				if (r.headers[n] === undefined) {
					r.headers[n] = defRequestInit.headers[n];
				}
			}
			continue;
		}
		if (r[n] === undefined) {
			r[n] = defRequestInit[n];
		}
	}
	return fetch(r)
		.then(res => getRes(req, res, null))
		.catch(err => getRes(req, null, err));
}
function getRes(req, res, err) {
	if (req.sync.stat !== 0) {
		clearFetch(req);
		return;
	}
	req.sync.afterAnimations.add(type_animation(() => req.sync.beforeAnimations.add(type_animation(() => {//это нужно для того что бы избежать ситуации, когда ранее уже был загружен и был сет (который вызывает отмену рендера и очистку текущего)
		const det = type_fetchDetailEvent(res, err);
		if (err !== null) {
			dispatchEvt(req.$src, errorEventName, det);
//			if (self.Tpl_fetchDefGetError) {
//				return self.Tpl_fetchDefGetError(det);
//			}
			return;
		}
		dispatchEvt(req.$src, loadEventName, det);
		if (res.ok) {
			dispatchEvt(req.$src, okEventName, det);
		}
	}, req.sync.local, 0)), req.sync.local, 0));
}
function clearFetch(req) {
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
