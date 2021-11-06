/*!
 * myweb/getlineno.js v0.9.0
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */

export default new Promise(resolve => {
	const url = location.pathname;
	fetch(url)
		.then(res => {
			if (!res.ok) {
				console.error(`Mark lines error: request ${url} stat ${res.status}`);
				return;
			}
			return res.text()
				.then(html => {
					createLineNo(url, html, document.documentElement);
					if (document.readyState === "loading") {
						document.addEventListener("DOMContentLoaded", resolve);
						return;
					}
					resolve();
				});
		});
});
const lineNoAttrName = "debug-line";
function createLineNo(url, html, $src) {
	let line = 1,
		$i = $src;
	const $parent = $i.parentNode,
		$p = [];
	do {
		if ($i.nodeType === 1) {
			const idx = html.indexOf('<' + $i.localName);
			if (idx === -1) {
//				console.error(`Mark lines error: index <${$i.localName} = -1`, $i, ctx);
				return;
			}
			line += html.substr(0, idx).split("\n").length - 1;
			$i.setAttribute(lineNoAttrName, `${url}:${line}`);
			html = html.substr(idx + 1);
		}
//////////////////////
		if ($i.firstChild !== null) {
			$i = $i.firstChild;
			continue;
		}
		//todo а что если это просто тег?
		if ($i.nodeName === "TEMPLATE" && $i.content.firstChild.firstChild !== null) {
			$p.push($i);
			$i = $i.content.firstChild.firstChild;
			continue;
		}
		if ($i.parentNode === $parent) {//если мы не ушли вглубь - значит и вправо двигаться нельзя
			break;
		}
		if ($i.nextSibling !== null) {
			$i = $i.nextSibling;
			continue;
		}
		do {
			$i = $i.parentNode;
			if ($i.parentNode === $parent) {
				$i = null;
				break;
			}
			if ($i.parentNode.nodeType === 11 && $i.parentNode !== $src) {
				$i = $p.pop();
				if ($i.parentNode === $parent) {
					$i = null;
					break;
				}
			}
			if ($i.nextSibling !== null) {
				$i = $i.nextSibling;
				break;
			}
		} while(true);
	} while ($i !== null);
}
function getLineNo($e) {
	return $e.getAttribute(lineNoAttrName);
}
//API
self.createLineNo = createLineNo;
self.getLineNo = getLineNo;
