/*!
 * myweb/getLineNo.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
export default new Promise((resolve, reject) => {
	const f = () => {
		getLineNo()
			.then(resolve)
			.catch(reject);
	}
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", f);
	} else {
		f();
	}
});
export async function getLineNo($src = document.documentElement, url = location.pathname) {
//	if ($src.getLineNo()) {
//		return Promise.resolve();
//	}
	const res = await fetch(url);
	if (res.ok) {
		getLineNo.mark(getLineNo.type_markCtx(url, await res.text()), $src);
		return;
	}
	console.error(`Mark lines error: request ${url} stat ${res.status}`);
}
getLineNo.lineNoAttrName = "debug-line";
getLineNo.mark = function(ctx, $e) {
	if ($e.nodeType === 1) {
		const idx = ctx.html.indexOf('<' + $e.localName);
		if (idx === -1) {
//			console.error(`Mark lines error: index <${$e.localName} = -1`, $e, ctx);
			return;
		}
		ctx.line += ctx.html.substr(0, idx).split("\n").length - 1;
		$e.setAttribute(getLineNo.lineNoAttrName, `${ctx.url}:${ctx.line}`);
		ctx.html = ctx.html.substr(idx + 1);
	}
	for (let $i = $e.firstChild; $i; $i = $i.nextSibling) {
		if ($i.nodeType !== 1) {
			continue;
		}
		getLineNo.mark(ctx, $i);
		if ($i.content) {
			for (let $j = $i.content.firstChild; $j; $j = $j.nextSibling) {
				getLineNo.mark(ctx, $j);
			}
		}
	}
}
getLineNo.type_markCtx = function(url, html) {
	return {
		url,
		html,
		line: 1
	};
}
self.getLineNo = getLineNo;

HTMLElement.prototype.getLineNo = function() {
	return this.getAttribute(getLineNo.lineNoAttrName);
}
