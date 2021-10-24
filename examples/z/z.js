import {render} from "/myweb/render/algo.js";
import {removeChild} from "/myweb/dom.js";

let sync = 0;
export function go($e, code) {
	const s = ++sync;
	setTimeout(() => _go($e, code, s), 1000);
}
export function _go($e, code, s) {
	if (s && s !== sync) {
		return;
	}
	const $c = $e.querySelector(".z-view");
	if ($c.firstChild !== null) {
		removeChild($c.firstChild);
	}
	$c.innerHTML = `<div scope="glob" 
	 is_fiiling1="" filling="console.log(glob.f); return glob.f" on.render="setTimeout(() => glob.f = true, 1000)"
	exec='!this._init && this.querySelectorAll("script").forEach($s => $s.type === "module" ? import(url) : new Function("glob", $s.textContent).apply(self, [glob[p_target]])); this._init = 1'>${code}</div>`;
//	$c.innerHTML = `<div scope="glob" exec='!this._init && this.querySelectorAll("script").forEach($s => $s.type === "module" ? import(url) : eval($s.textContent)); this._init = 1'>${code}</div>`;
	render($c.firstElementChild);
}
export function keyDown($e, evt) {
	if (evt.key === "Tab") {
		evt.preventDefault();
		const pos = $e.selectionStart,
			newPos = pos + 1,
			val = $e.value;
		$e.value = val.substr(0, pos) + "\t" + val.substr(pos);
		$e.setSelectionRange(newPos, newPos);
		return;
	}
	if (evt.key !== "Enter") {
		return;
	}
	const pos = $e.selectionStart,
		val = $e.value,
		toSpaceVal = val.substr(0, pos);
	let spaceBeginIdx = 0,
		spaceCount = 0;
	for (let i = toSpaceVal.length - 1;; i--) {
		if (toSpaceVal[i - 1] !== "\n" && i !== 0) {
			continue;
		}
		spaceBeginIdx = i;
		const toSpaceValLen = toSpaceVal.length;
		for (; i < toSpaceValLen; i++) {
			const c = toSpaceVal[i]
			if (c !== " " && c !== "\t") {
				break;
			}
			spaceCount++;
		}
		break;
	}
	if (spaceCount === 0) {
		return;
	}
	evt.preventDefault();
	const newPos = pos + spaceCount + 1;
	$e.value = val.substr(0, pos) + "\n" + val.substr(spaceBeginIdx, spaceCount) + val.substr(pos);
	$e.setSelectionRange(newPos, newPos);
}
