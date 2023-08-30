export function kebabToCamelCase(str) {
    if (str === "" || str === undefined) {
        return "";
    }
    const words = str.split("-");
    const wordsLen = words.length;
    if (wordsLen === 1) {
        return str;
    }
    str = words[0];
    for (let i = 1; i < wordsLen; ++i) {
        if (words[i] !== "") {
            str += words[i][0].toUpperCase() + words[i].substring(1);
        }
    }
    return str;
}
