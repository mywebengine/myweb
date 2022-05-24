import {Animation} from "../../render/Animation.js";
import {type_renderRes} from "../../render/RenderRes.js";

import {defRequestInit, loadEventName, okEventName, errorEventName, resultDetailName, errorDetailName} from "../../config/config.js";
import {eval2} from "../../eval2/eval2.js";
import dispatchCustomEvent from "../../evt/evt.js";
import {getRequest} from "../../url/url.js";
import {type_cmd} from "../type.js";

//my.fetchDefGetError = undefined;//default error handler

export default type_cmd(cmd_render, null, null, null, false, false);

function cmd_render(req) {
//console.log("fetch", req);
	return eval2(req, req.$src, true)
		.then(val => {
			const r = getRequest(val, "");
			if (r === null) {
				return type_renderRes(true);
			}
			const f = r instanceof Response ? getRes(req, r, null) : getFetch(req, r);
			req.sync.afterAnimations.add(new Animation(() => f, req.sync.local, 0));
			return null;
		});
}
/*
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
				req.sync.afterAnimations.add(new Animation(() => f, req.sync.local, 0));
				return null;
			});
	}
};*/
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
	req.sync.afterAnimations.add(new Animation(() => req.sync.beforeAnimations.add(new Animation(() => {//это нужно для того что бы избежать ситуации, когда ранее уже был загружен и был сет (который вызывает отмену рендера и очистку текущего)
		const det = type_fetchDetailEvent(res, err);
		if (err !== null) {
			dispatchCustomEvent(req.$src, errorEventName, det);
//			if (my.fetchDefGetError) {
//				return my.fetchDefGetError(det);
//			}
			return;
		}
		dispatchCustomEvent(req.$src, loadEventName, det);
		if (res.ok) {
			dispatchCustomEvent(req.$src, okEventName, det);
		}
	}, req.sync.local, 0)), req.sync.local, 0));
}
function clearFetch(req) {
	if (my.debugLevel !== 0) {
		console.info("clear fetch => ", req);
	}
	const c = my.ctx.srcBy$src.get(req.$src).cache;
//	if (c !== null) {
		c.value = new Map();//todo тут можно удалять кэш только для дочерних элементов, но так как еще нужно удалить кэш для команд-после, то такой подход оправдан
		c.current = new Map();
//	}
}
function type_fetchDetailEvent(res, err) {
	return {
		[resultDetailName]: res,
		[errorDetailName]: err
	};
}
