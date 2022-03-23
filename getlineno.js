/*!
 * myweb/getlineno.js v0.9.0
 * (c) 2019-2021 Aleksey Zobnev
 * Released under the MIT License.
 * https://github.com/mywebengine/myweb
 */

import {hideName} from "./config/config.js";

const lineNoAttrName = "debug:line";

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
					if (document.readyState === "interactive" || document.readyState === "complete") {
						resolve();
						return;
					}
//					if (document.readyState === "loading") {
					document.addEventListener("DOMContentLoaded", resolve);
				});
		});
});
function createLineNo(url, html, $src) {
	let line = 1,
		$i = $src;
	const $parent = $i.parentNode,
		$p = [];
	do {
//////////////////////
		if ($i.nodeType === 1) {
			const idx = html.indexOf("<" + $i.localName);
			if (idx === -1) {
				console.warn(`Mark lines error: index <${$i.localName} = -1`, $i, html.substr(0, 40));
/*
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
					if ($i.nextSibling !== null) {
						$i = $i.nextSibling;
						break;
					}
				} while (true);
				continue;*/
				return;
			}
			line += html.substr(0, idx).split("\n").length - 1;
//console.log(1, html.substr(0, 40), idx, line, html.substr(0, idx), $i);
//console.log(1, line);
//alert(1)
			$i.setAttribute(lineNoAttrName, `${url}:${line}`);
			html = html.substr(idx + 1);
			if ($i.firstChild !== null) {
				$i = $i.firstChild;
				continue;
			}
			if ($i.nodeName === "TEMPLATE" && $i.getAttribute(hideName) !== null) {
				$p.push($i);
				$i = $i.content.firstChild;
				continue;
			}
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
			if ($i.nodeType === 11) {// && $i.parentNode !== $src) {
				$i = $p.pop();
			}
			if ($i.parentNode === $parent) {
				$i = null;
				break;
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
if (!self.my) {
	self.my = {};
}
my.createLineNo = createLineNo;
my.getLineNo = getLineNo;
