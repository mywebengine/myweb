//todo удалить когда наступит момент
if (!self.requestIdleCallback) {
	self.requestIdleCallback = function(f) {
		const startTime = Date.now();
		return setTimeout(() => {
			f({
				didTimeout: false,
				timeRemaining() {
					return Math.max(0, 50.0 - (Date.now() - startTime));
				}
			});
		}, 1);
	}
}
if (!String.prototype.copyToClipboard) {
	String.prototype.copyToClipboard = function() {
		const $f = document.createElement("input");
		$f.type = "text";
		$f.contentEditable = true;
		$f.value = this;
		$f.style.position = "absolute";
		$f.style.left = "-1000px";
		document.body.appendChild($f);
//		$f.select();
		$f.focus();
		$f.setSelectionRange(0, this.length);//<- hz - maybe safari???
		document.execCommand("copy");
		$f.parentNode.removeChild($f);
	}
	hideEnum(String.prototype, "copyToClipboard");
}
/*
if (!FormData.prototype.toJSON) {
	FormData.prototype.toJSON = function() {
		const obj = {};
		for (const [name, value] of this.entries()) {
			obj[name] = value;
		}
		return obj;
	}
//	hideEnum(FormData.prototype, "toJSON");
}
if (!HTMLFormElement.prototype.toJSON) {
	HTMLFormElement.prototype.toJSON = function() {
		const obj = {},
			elsLen = this.elements.length;
		for (let i = 0; i < elsLen; i++) {
			const n = this.elements[i].name || this.elements[i].id;
			if (n) {
				obj[n] = this.elements[i].value;
			}
		}
		return obj;
	}
//	hideEnum(HTMLFormElement.prototype, "toJSON");
}*/
function hideEnum(obj, pName) {
	Object.defineProperty(obj, pName, {
		enumerable: false
	});
}
