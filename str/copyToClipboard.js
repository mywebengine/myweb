export export function copyToClipboard(str) {
	const $f = document.createElement("input");
	$f.type = "text";
	$f.value = str;
	$f.setSelectionRange(0, this.length);
	document.execCommand("copy");
}
