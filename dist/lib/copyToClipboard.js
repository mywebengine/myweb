export function copyToClipboard(str) {
    const $f = document.createElement("input");
    $f.type = "text";
    $f.value = str;
    $f.setSelectionRange(0, str.length);
    //todo
    document.execCommand("copy");
}
