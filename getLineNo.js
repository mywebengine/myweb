/*!
 * myweb/util.js v0.9.0
 * (c) 2019 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */
export function markLines($src = document.documentElement, url = window.location.pathname) {
	if ($src.getLineNo()) {
		return Promise.resolve();
	}
	return fetch(url)
		.then(res => {
			if (res.status == 200) {
				return res.text();
			}
			console.error(`markLines: request stat ${res.status}`);
		})
		.then(html => {
			markLines.mark({
				url,
				html
			}, $src);
		});
}
markLines.mark = function(req, $e) {
	req.html = req.html.toUpperCase();
	if (!req.line) {
		req.line = 1;
	}
	markLines._mark(req, $e);
}
markLines._mark = function(req, $e) {
	if ($e instanceof HTMLElement) {
		const idx = req.html.indexOf('<' + $e.tagName);
		if (idx == -1) {
			console.error(`markLines.mark: index <${$e.tagName} = -1`, $e, req);
			return;
		}
		req.line += req.html.substr(0, idx).split("\n").length - 1;

		$e.setAttribute(this.lineNoAttrName, `${req.url}:${req.line}`);

		req.html = req.html.substr(idx + 1);
	}
	for (let $i, i = 0; i < $e.children.length; i++) {
		$i = $e.children[i];
		this.mark(req, $i);
		if (typeof($i.content) == "object") {
			$i = $i.content;
			for (let j = 0; j < $i.children.length; j++) {
				this.mark(req, $i.children[j]);
			}
		}
	}
}
markLines.lineNoAttrName = "debug:line";

self.markLines = markLines;

HTMLElement.prototype.getLineNo = function() {
	return this.getAttribute(markLines.lineNoAttrName);
}

export default new Promise((resolve, reject) => {
	if (document.readyState == "loading") {
		addEventListener("DOMContentLoaded", () => {
			markLines()
				.then(resolve)
				.catch(reject);
		});
	} else {
		markLines()
			.then(resolve)
			.catch(reject);
	}
});
