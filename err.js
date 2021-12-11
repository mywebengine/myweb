import {srcBy$src} from "./descr.js";

export function getErr(err, $src, req, scope, fileName, lineNum, colNum) {
        let errMsg = ">>>mw error";
        if (self.mw_getLineNo !== undefined) {
        	const pos = self.mw_getLineNo($src);// || self.mw_getLineNo($src.parentNode);//todo зачем смотреть родителя?
        	if (pos) {
	        	errMsg += ` in ${pos}`;
	        }
        }
	errMsg += "\n" + err.toString();
	const params = [];
	params.push("\n$src =>", $src, "\nsId =>", srcBy$src.get($src)?.id);
	if (req) {
		params.push("\nreq =>", req);
	        params.push("\n" + req.str + " =>", req.expr);
	}
	if (scope) {
		params.push("\nscope =>", scope);
	}
	if (self.mw_debugLevel !== 0) {
		console.info(errMsg, ...params);
	}
	return fileName ? new Error(err, fileName, lineNum, colNum) : err;
}
