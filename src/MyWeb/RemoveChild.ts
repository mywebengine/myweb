//import {importCache, incClearByKey} from "../../command/Import.js";
import {config} from "../config.js";
import {CreateDom} from "./CreateDom.js";
import {Src} from "./Src.js";

export abstract class RemoveChild extends CreateDom {
	removeChild($e: Node /*, req*/) {
		//console.error("remC", this.context.srcBy$src.get($e), $e);
		/*
//todo
if (!$e.parentNode) {
	console.error(req.sync, $e);
	alert(11)
}*/
		$e.parentNode?.removeChild($e);
		$e.dispatchEvent(new CustomEvent(config.removeEventName, config.defEventInit));
		const rem = new Map<number, Set<number>>();
		const srcBy$src = this.context.srcBy$src;
		let $i: Node | null = $e;
		const $parent = null;
		const $p = [];
		do {
			//////////////////////
			const iSrc = srcBy$src.get($i as HTMLElement);
			//if (iSrc !== undefined && !iSrc.descr.isCustomHtml) {
			if (iSrc !== undefined) {
				this.clearTag($i as HTMLElement, iSrc, rem);
				if (iSrc.descr.isCustomHtml) {
					continue;
				}
				if ($i.firstChild !== null) {
					$i = $i.firstChild;
					continue;
				}
				//if (iSrc.isCmd && $i.nodeName === "TEMPLATE" && $i.getAttribute(config.hideName) !== null) {
				if (iSrc.isHide && iSrc.isCmd && (($i as HTMLTemplateElement).content.firstChild as Node).firstChild !== null) {
					$p.push($i);
					$i = (($i as HTMLTemplateElement).content.firstChild as Node).firstChild;
					continue;
				}
			}
			if ($i.parentNode === $parent) {
				//если мы не ушли вглубь - значит и вправо двигаться нельзя
				break;
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				continue;
			}
			do {
				$i = ($i as Node).parentNode as HTMLElement; //!!
				if ($i.nodeType === 11) {
					$i = $p.pop() as HTMLElement;
				}
				if ($i.parentNode === $parent) {
					$i = null;
					break;
				}
				if ($i.nextSibling !== null) {
					$i = $i.nextSibling;
					break;
				}
			} while (true);
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

	private clearTag($e: HTMLElement, src: Src, rem: Map<number, Set<number>>) {
		//console.log($e, src.id, rem);
		const srcId = src.id,
			descr = src.descr,
			descrId = descr.id;
		this.context.$srcById.delete(srcId);
		this.context.srcById.delete(srcId);
		this.context.srcBy$src.delete($e);
		//console.error("DEL", src.id, $e, src.isCmd, descr);
		if (!src.isCmd) {
			//простые теги тоже могут быть с одним описанием
			descr.srcIds.delete(srcId);
			if (descr.srcIds.size === 0) {
				this.context.descrById.delete(descrId);
			}
			return;
		}
		/*
		for (const [n, v] of descr.attr) {
			if (n !== config.importCmdName) {
				continue;
			}
			const importKey = src.getIdx(n);
			if (importKey !== undefined && importCache.has(incKey)) {
				incClearByKey(importKey);
			}
		}
*/
		this.context.loadingCount.delete(srcId);
		descr.srcIds.delete(srcId);
		if (descr.srcId === srcId) {
			descr.srcId = descr.srcIds.values().next().value; //todo REM! тут может быть undef - это при условии что все элементы цикла пошли на удаление (это при замене через inc) - и раз undef то в rem есть все элементы и первый из них очистит всё, а остальные нужно пропустить
		}
		const r = rem.get(descrId);
		if (r) {
			r.add(srcId);
			return;
		}
		rem.set(descrId, new Set([srcId]));
	}

	private clearVars(rem: Map<number, Set<number>>) {
		const varIdByVar = this.context.varIdByVar;
		const varById = this.context.varById;
		const varIdByVarIdByProp = this.context.varIdByVarIdByProp;
		const srcIdsByVarId = this.context.srcIdsByVarId;
		const descrById = this.context.descrById;
		const varIds = new Set<number>();
		const srcIds = new Set<number>();
		const deletedVarId = new Set<number>(); //,
		//	skipDelBySrcId = {};
		for (const [dId, s] of rem) {
			const d = descrById.get(dId);
			if (d === undefined) {
				//todo REM!
				continue;
			}
			for (const vId of d.varIds as Set<number>) {
				//!!
				varIds.add(vId);
			}
			//}
			for (const sId of s) {
				srcIds.add(sId);
				//if (d.isAsOne && sId != d.srcId) {
				//todo
				//console.error(123);
				//alert(123);
				//	skipDelBySrcId[sId] = true;
				//}
			}
		}
		for (const vId of varIds) {
			const s = srcIdsByVarId.get(vId);
			if (!s) {
				continue;
			}
			const vIdByProp = varIdByVarIdByProp.get(vId);
			//let f = false;
			for (const sId of srcIds) {
				//if (skipDelBySrcId[sId]) {
				//	f = true;
				//}
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
			//if (f) {
			//	continue;
			//}
			//console.log(2, vId, s);
			if (s.size === 0) {
				deletedVarId.add(vId);
				srcIdsByVarId.delete(vId);
				varIdByVar.delete(varById.get(vId) as object); //!!
				varById.delete(vId);
				if (vIdByProp !== undefined) {
					varIdByVarIdByProp.delete(vId);
					//todo
					if (vIdByProp.size !== 0) {
						console.warn("должно быть пусто", vId, vIdByProp);
					}
					//--for (const pId of vIdByProp.values()) {
					//	srcIdsByVarId.delete(pId);
					//}
				}
			} else if (vIdByProp !== undefined && vIdByProp.size === 0) {
				varIdByVarIdByProp.delete(vId);
			}
		}
		for (const [dId, s] of rem) {
			const d = descrById.get(dId);
			if (d === undefined) {
				//todo REM!
				continue;
			}
			if (d.varIds !== null) {
				//todo а когда он нулю?
				for (const vId of deletedVarId) {
					d.varIds.delete(vId);
				}
			}
			for (const sId of s) {
				d.srcIds.delete(sId);
				//todo--
				if (d.srcId === sId) {
					console.warn(22222222);
				}
			}
			if (d.srcIds.size === 0) {
				descrById.delete(dId);
			}
		}
	}
}
