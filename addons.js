//const dRe = /\d/g;
const DRe = /\D/g;
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

function hideEnum(obj, pName) {
	Object.defineProperty(obj, pName, {
		enumerable: false
	});
}

if (!String.prototype.q) {
	const aRe = /`/g;
	const qRe = /'/g;
	const qqRe = /'/g;
	String.prototype.a = function() {
		return this.replace(aRe, '\\`');
	}
	String.prototype.q = function() {
		return this.replace(qRe, "\\'");
	}
	String.prototype.qq = function() {
		return this.replace(qqRe, '\\"');
	}
	for (const n of ["a", "q", "qq"]) {
		Number.prototype[n] = function() {
			return this.toString().qq();
		}
		for (const o of [String.prototype, Number.prototype]) {
			hideEnum(o, n);
		}
	}
/*
	self.LocaleNumber = function(n) {
		if (!this) {
			return new self.LocaleNumber(n);
		}
		this.value = n;
	}
	self.LocaleNumber.prototype = {
		valueOf() {
			return Number(this.value);
		},
		toString() {
			return Number(this.value).toLocaleString();
		}
	};*/

//	String._locale = "en-Us";
	String.localeDotSymbol = (0.1).toLocaleString(String._locale).indexOf(".") === -1 ? "," : ".";
	String.prototype.toNumber = function() {
		const dotIdx = this.lastIndexOf(String.localeDotSymbol);
		return Number(dotIdx === -1 ? this.replace(DRe, "") : this.substr(0, dotIdx).replace(DRe, "")  + "." + this.substr(dotIdx + 1));
	}
	hideEnum(String.prototype, "toNumber");

	String.prototype.json = function() {
		try {
			return JSON.parse(this);
		} catch(err) {
			console.error(err);
		}
	}
	hideEnum(String.prototype, "json");

	String.prototype.copyToClipboard = function() {
		const $f = document.createElement("input");
		$f.type = "text";
		$f.contentEditable = true;
		$f.value = this;
		$f.style.position = "absolute";
		$f.style.left = "-1000px";
		document.body.appendChild($f);
		$f.select();
/*
		const range = document.createRange();
		range.selectNodeContents($f);
		const sel = self.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);*/

		$f.setSelectionRange(0, this.length);//<- hz - maybe safari???

		document.execCommand("copy");
//		$f.parentNode.removeChild($f);
	}
	hideEnum(String.prototype, "copyToClipboard");
}
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
}
//!!удалить когда наступит момент
if (!self.requestIdleCallback) {
	self.requestIdleCallback = function(f) {
		const startTime = Date.now();
		return setTimeout(function() {
			f({
				didTimeout: false,
				timeRemaining() {
					return Math.max(0, 50.0 - (Date.now() - startTime));
				}
			});
		}, 1);
	}
}
