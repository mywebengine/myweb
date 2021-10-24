/*
export function getLocalNumber(val, fmt) {
	if (!val || typeof(val) !== "string") {
		return val;
	}
	val = val.replace(/\s+/g, "");
	if (getLocalNumber.dotSymbol === ".") {
		val = val.replace(/,/g, "");
	} else {
		val = val.replace(/\./g, "");
		val = val.replace(",", ".");
	}
	if (fmt && fmt.scale > 0) {
		const dotIdx = val.indexOf(getLocalNumber.dotSymbol);
		if (dotIdx !== -1) {
			val = val.substr(0, dotIdx + fmt.scale + 1);
		}
	}
	return val * 1;
}
//getLocalNumber.locale = "en-Us";
getLocalNumber.dotSymbol = (0.1).toLocaleString(getLocalNumber.locale).indexOf(".") === -1 ? "," : ".";*/
/*
export function formatFunc(val, fmt) {
	if (val === "" || isNaN(val)) {
		return "";
	}
//	return Number(val).toLocaleString(navigator.language, {
	return Number(val).toLocaleString(undefined, {
		maximumFractionDigits: fmt ? fmt.scale : 0//,
//		useGrouping: false
	});
}*/
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
