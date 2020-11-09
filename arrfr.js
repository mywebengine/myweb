/*!
 * myweb/arrfr.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
export default function createArrFragment($arr) {
	return new ArrFragment($arr);
}
class ArrFragment {
	constructor($arr) {
		this.$arr = $arr;
	}
	get parentNode() {
		if (this.$arr[0]) {
			return this.$arr[0].parentNode;
		}
		return null;
	}
	get childNodes() {
		return this.$arr;
	}
	get children() {
		const $c = [];
		const l = this.$arr.length;
		for (let i = 0; i < l; i++) {
			if (this.$arr[i].nodeType === 1) {
				$c.push(this.$arr[i]);
			}
		}
		return $c;
	}
	get firstChild() {
		return this.$arr[0];
	}
	get lastChild() {
		return this.$arr[this.$arr.length - 1];
	}
	get firstElementChild() {
		const l = this.$arr.length;
		for (let i = 0; i < l; i++) {
			if (this.$arr[i].nodeType === 1) {
				return this.$arr[i];
			}
		}
		return null;
	}
	get lastElementChild() {
		for (let i = this.$arr.length - 1; i > -1; i--) {
			if (this.$arr[i].nodeType === 1) {
				return this.$arr[i];
			}
		}
		return null;
	}
	querySelector(q) {
		const $res = this.querySelectorAll(q);
		if ($res) {
			return $res[0];
		}
		return null;
	}
	querySelectorAll(q) {
		const $res = [];
		const l = this.$arr.length;
		if (!l) {
			return $res;
		}
		const $r = this.$arr[0].parentNode.querySelectorAll(q);
		if (!$r) {
			return $res;
		}
		const $rLen = $r.length;
		for (let i = 0; i < l; i++) {
			if (this.$arr[i].nodeType === 1) {
				for (let j = 0; j < $rLen; j++) {
					if (isIn($r[j], this.$arr[i])) {
						$res.push($r[j]);
					}
				}
			}
		}
		return $res;
	}
}
function isIn($r, $e) {
	if ($r === $e) {
		return true;
	}
	for ($e = $e.firstChild; $e; $e = $e.nextSibling) {
		if ($e.nodeType === 1 && isIn($r, $e)) {
			return true;
		}
	}
}
