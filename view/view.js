import config from "../config/config.js";
import oset from "../oset/oset.js";

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
export function setView(doc) {
	oset(self, config.viewVarName, getView(doc));
//console.log("resize", self.view.clientWidth);
}
