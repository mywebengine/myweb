import config from "../../../config/config.js";
import dispatchCustomEvent from "../../../evt/dispatchCustomEvent.js";
import getRequest from "../../../url/getRequest.js";
import Animation from "../../render/Animation.js";
import RenderRes from "../../render/RenderRes.js";
import Command from "../Command.js";
import FetchDetailEvent from "./FetchDetailEvent.js";

//my.fetchDefGetError = undefined;//default error handler

export default class Fetch extends Command {
	render(req) {
//console.log("fetch", req);
		return this.my.eval2(req, req.$src, true)
			.then(val => {
				const r = getRequest(val, "");
				if (r === null) {
					return new RenderRes(true);
				}
				const f = r instanceof Response ? this.getRes(req, r, null) : this.getFetch(req, r);
				req.sync.afterAnimations.add(new Animation(() => f, req.sync.local, 0));
				return null;
			});
	}
	//private
	getRes(req, res, err) {
		if (req.sync.stat !== 0) {
			this.clearFetch(req);
			return;
		}
		req.sync.afterAnimations.add(new Animation(() => req.sync.beforeAnimations.add(new Animation(() => {//это нужно для того что бы избежать ситуации, когда ранее уже был загружен и был сет (который вызывает отмену рендера и очистку текущего)
			const det = new FetchDetailEvent(res, err);
			if (err !== null) {
				dispatchCustomEvent(req.$src, config.errorEventName, det);
//				if (my.fetchDefGetError) {
//					return my.fetchDefGetError(det);
//				}
				return;
			}
			dispatchCustomEvent(req.$src, config.loadEventName, det);
			if (res.ok) {
				dispatchCustomEvent(req.$src, config.okEventName, det);
			}
		}, req.sync.local, 0)), req.sync.local, 0));
	}
	getFetch(req, r) {
		if (req.sync.stat !== 0) {
			this.clearFetch(req);
			return;
		}
		for (const n in config.defRequestInit) {
			if (n === "headers") {
				for (const n in config.defRequestInit.headers) {
					if (r.headers[n] === undefined) {
						r.headers[n] = config.defRequestInit.headers[n];
					}
				}
				continue;
			}
			if (r[n] === undefined) {
				r[n] = config.defRequestInit[n];
			}
		}
		return fetch(r)
			.then(res => this.getRes(req, res, null))
			.catch(err => this.getRes(req, null, err));
	}
	clearFetch(req) {
		if (my.debugLevel !== 0) {
			console.info("clear fetch => ", req);
		}
		const c =this.my.context.srcBy$src.get(req.$src).cache;
//		if (c !== null) {
			c.value = new Map();//todo тут можно удалять кэш только для дочерних элементов, но так как еще нужно удалить кэш для команд-после, то такой подход оправдан
			c.current = new Map();
//		}
	}
};
