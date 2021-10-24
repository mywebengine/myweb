﻿import {p_target} from "../config.js";
import {eval2, q_eval2} from "../eval2.js";
import {kebabToCamelStyle} from "../util.js";

export default {
	render(req) {
		return eval2(req, req.$src, true)
			.then(val => setValue(req, req.scope, val));
	},
	q_render(req, arr, isLast) {
		const arrLen = arr.length;
		return q_eval2(req, arr, isLast)
//todo ???????????
			.then(vals => {
				const pArr = new Array(arrLen);
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
						pArr[i] = vals[i];
					}
				}
				return Promise.all(pArr);
			})
			.then(vals => {
				for (let i = 0; i < arrLen; i++) {
					if (!isLast[i]) {
						setValue(req, arr[i].scope, vals[i]);
					}
				}
				return null;
			});
	}
};
function setValue(req, scope, val) {
	const n = req.reqCmd.args[0];
	if (n) {
		scope[p_target][kebabToCamelStyle(n)] = val;
	}
	return null;
}