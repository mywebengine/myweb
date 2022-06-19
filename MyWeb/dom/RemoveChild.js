//import {incCache, incClearByKey} from "../command/inc.js";
import config from "../../config/config.js";
import CreateDom from "./CreateDom.js";

export default class RemoveChild extends CreateDom {
	removeChild($e, req) {
//console.error("remC", this.context.srcBy$src.get($e), $e);
/*
//todo
if (!$e.parentNode) {
	console.error(req.sync, $e);
	alert(11)
}*/
		$e.parentNode.removeChild($e);
		$e.dispatchEvent(new CustomEvent(config.removeEventName, config.defEventInit));
		const rem = new Map(),
			srcBy$src = this.context.srcBy$src;
		let $i = $e;
		const $parent = null,
			$p = [];
		do {
//////////////////////
			const iSrc = srcBy$src.get($i);
//			if (iSrc !== undefined && !iSrc.descr.isCustomHtml) {
			if (iSrc !== undefined) {
				this.clearTag($i, iSrc, rem);
				if (iSrc.descr.isCustomHtml) {
					continue;
				}
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
//				if (iSrc.isCmd && $i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {
				if (iSrc.isHide && iSrc.isCmd && $i.content.firstChild.firstChild !== null) {
					$p.push($i);
					$i = $i.content.firstChild.firstChild;
					continue;
				}
			}
			if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				continue;
			}
			do {
				$i = $i.parentNode;
				if ($i.nodeType === 11) {
					$i = $p.pop();
				}
				if ($i.parentNode === $parent) {
					$i = null;
					break;
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					break;
				}
			} while(true);
		} while ($i !== null);
		if (rem.size === 0) {
			return;
		}
		requestIdleCallback(() => {
//console.time("rem");
			this.clearVars(rem);
//console.timeEnd("rem");
		}, config.defIdleCallbackOpt);
	}
	//private
	clearTag($e, src, rem) {
//console.log($e, src.id, rem);
		const sId = src.id,
			descr = src.descr,
			dId = descr.id;
		this.context.$srcById.delete(sId);
		this.context.srcById.delete(sId);
		this.context.srcBy$src.delete($e);
//console.error("DEL", src.id, $e, src.isCmd, descr);
		if (!src.isCmd) {
//простые теги тоже могут быть с одним описанием
			descr.srcIds.delete(sId);
			if (descr.srcIds.size === 0) {
				this.context.descrById.delete(dId);
			}
			return;
		}
/*
		for (const [n, v] of descr.attr) {
			if (n !== config.incCmdName) {
				continue;
			}
			const incKey = src.getIdx(n);
			if (incKey !== undefined && incCache.has(incKey)) {
				incClearByKey(incKey);
			}
		}
*/
		this.context.loadingCount.delete(sId);
		descr.srcIds.delete(sId);
		if (descr.sId === sId) {
			descr.sId = descr.srcIds.values().next().value;//todo REM! тут может быть undef - это при условии что все элемены цикла пошли на удаление (это при замене через inc) - и раз undef то в rem есть все элементы и первый изних очистит всё, а остальные нужно пропустить
		}
		const r = rem.get(dId);
		if (r) {
			r.add(sId);
			return;
		}
		rem.set(dId, new Set([sId]));
	}
	//private
	clearVars(rem) {
		const varIdByVar = this.context.varIdByVar,
			varById = this.context.varById,
			varIdByVarIdByProp = this.context.varIdByVarIdByProp,
			srcIdsByVarId = this.context.srcIdsByVarId,
			descrById = this.context.descrById,

			vIds = new Set(),
			sIds = new Set(),
			deletedVarId = new Set();//,
//			skipDelBySrcId = {};
		for (const [dId, s] of rem) {
			const d = descrById.get(dId);
			if (d === undefined) {//todo REM!
				continue;
			}
			for (const vId of d.varIds) {
				vIds.add(vId);
			}
//}
			for (const sId of s) {
				sIds.add(sId);
//				if (d.isAsOne && sId != d.sId) {
//todo
//console.error(123);
//alert(123);
//					skipDelBySrcId[sId] = true;
//				}
			}
		}
		for (const vId of vIds) {
			const s = srcIdsByVarId.get(vId);
			if (!s) {
				continue;
			}
			const vIdByProp = varIdByVarIdByProp.get(vId);
//			let f = false;
			for (const sId of sIds) {
//				if (skipDelBySrcId[sId]) {
//					f = true;
//				}
				if (s.has(sId)) {
//console.log(1, vId, sId, s.has(sId), s);
//alert(1);
					s.delete(sId);
				}
				if (vIdByProp === undefined) {
					continue;
				}
				for (const [pName, pId] of vIdByProp) {
					const propS = srcIdsByVarId.get(pId);
					if (propS !== undefined && propS.has(sId)) {
//console.log(vIdByProp, sId, pId);
						s.delete(sId);
						propS.delete(sId);
						if (propS.size === 0) {
							deletedVarId.add(pId);
							srcIdsByVarId.delete(pId);
							vIdByProp.delete(pName);
						}
					}
				}
			}
//			if (f) {
//				continue;
//			}
//console.log(2, vId, s);
			if (s.size === 0) {
				deletedVarId.add(vId);
				srcIdsByVarId.delete(vId);
				varIdByVar.delete(varById.get(vId));
				varById.delete(vId);
				if (vIdByProp !== undefined) {
					varIdByVarIdByProp.delete(vId);
//todo
					if (vIdByProp.size !== 0) {
						console.warn("должно быть пусто", vId, vIdByProp);
					}
//--					for (const pId of vIdByProp.values()) {
//						srcIdsByVarId.delete(pId);
//					}
				}
			} else if (vIdByProp !== undefined && vIdByProp.size === 0) {
				varIdByVarIdByProp.delete(vId);
			}
		}
		for (const [dId, s] of rem) {
			const d = descrById.get(dId);
			if (d === undefined) {//todo REM!
				continue;
			}
			for (const vId of deletedVarId) {
				d.varIds.delete(vId);
			}
			for (const sId of s) {
				d.srcIds.delete(sId);
//todo--
				if (d.sId === sId) {
					console.warn(22222222);
				}
			}
			if (d.srcIds.size === 0) {
				descrById.delete(dId);
			}
		}
	}
};
