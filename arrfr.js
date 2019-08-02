export default function createArrFragment($arr) {
	return new ArrFragment($arr);
}
class ArrFragment {
	constructor($arr) {
		this.$arr = $arr;
	}
	get parentNode() {
		return this.$arr[0] ? this.$arr[0].parentNode : null;
	}
	get childNodes() {
		return this.$arr;
	}
	get children() {
		const $c = [];
		const l = this.$arr.length;
		for (let i = 0; i < l; i++) {
			if (this.$arr[i] instanceof HTMLElement) {
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
			if (this.$arr[i] instanceof HTMLElement) {
				return this.$arr[i];
			}
		}
		return null;
	}
	get lastElementChild() {
		for (let i = this.$arr.length - 1; i > -1; i--) {
			if (this.$arr[i] instanceof HTMLElement) {
				return this.$arr[i];
			}
		}
		return null;
	}
	querySelector(q) {
		const $res = this.querySelectorAll(q);
		return $res ? $res[0] : null;
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
			if (this.$arr[i] instanceof HTMLElement) {
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
	if ($r == $e) {
		return true;
	}
	for ($e = $e.firstElementChild; $e; $e = $e.nextElementSibling) {
		if (isIn($r, $e)) {
			return true;
		}
	}
}
