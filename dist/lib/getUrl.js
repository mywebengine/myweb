const reHost = /^(\w+:\/\/|\/\/)/;
const reSlash = /\/\/+/;
const reUp = /[^\/]+\/+\.\.\//;
const reThis = /\/+\.\//;
export function getUrl(url, topUrl = location.pathname) {
    if (isUri(url)) {
        //		if (topUrl !== undefined) {
        if (isUri(topUrl)) {
            topUrl = normalizeUrl(topUrl);
        }
        let u = normalizeUrl_get(url.trim());
        while (u.indexOf(".") === 0) {
            if (u.indexOf("./") === 0) {
                u = u.substring(2);
            }
            else if (u.indexOf("../") === 0) {
                u = u.substring(3);
            }
        }
        url = topUrl.endsWith(u) ? topUrl : normalizeUrl(topUrl.substring(0, topUrl.lastIndexOf("/") + 1) + url);
        //		} else {
        //			url = normalizeUrl(url);
        //		}
    }
    return url.search(reHost) === -1 ? location.origin + url : url;
}
function isUri(url) {
    url = url.trim();
    return url.search(reHost) !== 0 && url[0] !== "/";
}
function normalizeUrl(url) {
    url = url.trim();
    //	if (url.search(reHost) === 0) {
    //		return new URL(url).href;
    //	}
    //	if (url[0] !== "/") {
    //	if (url.search(reHost) !== 0 && url[0] !== "/") {
    if (isUri(url)) {
        const lastSlashIdx = location.pathname.lastIndexOf("/");
        if (lastSlashIdx === location.pathname.length - 1) {
            url = location.pathname + url;
        }
        else if (lastSlashIdx !== -1) {
            url = location.pathname.substring(0, lastSlashIdx + 1) + url;
        }
    }
    return normalizeUrl_get(url);
}
function normalizeUrl_get(url) {
    for (let re = [reUp, reThis], i = re.length - 1; i > -1; --i) {
        while (url.search(re[i]) !== -1) {
            url = url.replace(re[i], "/");
        }
    }
    if (url.search(reHost) === -1) {
        return url.replace(reSlash, "/");
    }
    const i = url.indexOf("//");
    return url.substring(0, i + 1) + url.substring(i + 1).replace(reSlash, "/");
    //.trim();
}
