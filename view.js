import {viewVarName} from "./config.js";
import {oset} from "./oset.js";
import {getProxy} from "./proxy.js";

export function setView(doc) {
	oset(self, viewVarName, getView(doc));
//console.log("resize", self.view.clientWidth);
}
export function getView(doc) {
	const $s = doc.scrollingElement;
//	return type_view(doc.scrollingElement);
//}
//function type_view($s) {
	return {
		scrollTop: $s.scrollTop,
		scrollLeft: $s.scrollLeft,
		clientWidth: $s.clientWidth,
		clientHeight: $s.clientHeight
	};
}
