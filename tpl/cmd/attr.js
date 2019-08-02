import {cmdArgsDiv} from "../const.js";
//Когда атрибур привязан к циклу, получается так что описания у элементов цикла одно и то же (у корневых) - и из-за этого сравнеие
//--неверно
//наверное при копировании в цикле копируются атрибуты
export default {
	render: function(req) {
		const attr = attr_get.call(this, req);
		if (attr.value) {
//console.log(2222111, req.$src, attr.value, req.$src.attr_oldVal[attr.name]);
//			if (!req.$src.attr_oldVal[attr.name] || attr.value != req.$src.attr_oldVal[attr.name]) {
			if (!req.$src.attr_oldVal[attr.name] || attr.value != req.$src.getAttribute(attr.name)) {
//console.log(2222111, req.$src, attr.value, req.$src.attr_oldVal[attr.name]);
				this.setAttribute(req.$src, attr.name, attr.value);
				req.$src.attr_oldVal[attr.name] = attr.value;
			}
			return;
		}
//		if (req.$src.attr_oldVal[attr.name] !== "") {
		if (req.$src.getAttribute(attr.name) !== "") {
//console.log(3333, req.$src.attr_oldVal[attr.name]);
//todo
			if (req.$src.getAttribute(attr.name)) {
				this.removeAttribute(req.$src, attr.name);
			}
			req.$src.attr_oldVal[attr.name] = "";
		}
	},
	linker(req) {
		const attr = attr_get.call(this, req);
		req.$src.attr_oldVal[attr.name] = attr.value;
	}
};
function attr_get(req) {
	const attr = {
		name: req.args.join(cmdArgsDiv)
	};
	if (!attr.name) {
		this.check(new Error(">>>Tpl attr:render:01: Need set attribute name (" + attr.name + ")"), req);
		return;
	}
	attr.value = this.eval(req);
	if (!req.$src.attr_oldVal) {
		req.$src.attr_oldVal = {};
	}
	return attr;
}
