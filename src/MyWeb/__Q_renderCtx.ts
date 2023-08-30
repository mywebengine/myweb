import {Q_arr} from "./Q_arr";

export class Q_renderCtx {
	//todo rename to afterQ_arrByDecrIdByAttrKey
	afterByDescrByAttr = new Map<number, Map<string, Q_arr[]>>();
	strByAttrKey = new Map<string, string>();
}
