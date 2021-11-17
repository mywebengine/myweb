export function kebabToCamelCase(str) {
	if (str === "" || str === undefined) {
		return str;
	}
	const words = str.split("-"),
		wordsLen = words.length;
	if (wordsLen == 1) {
		return str;
	}
	str = words[0];
	for (let i = 1; i < wordsLen; i++) {
		if (words[i] !== "") {
			str += words[i][0].toUpperCase() + words[i].substr(1);
		}
	}
	return str;
}
export function copyToClipboard(str) {
	const $f = document.createElement("input");
	$f.type = "text";
	$f.value = str;
	$f.setSelectionRange(0, this.length);
	document.execCommand("copy");
}
