export function getErr(err, $src, req, scope, fileName, lineNum, colNum) {
        let errMsg = ">>>mw error";
        if (my.getLineNo !== undefined) {
        	const pos = my.getLineNo($src);// || my.getLineNo($src.parentNode);//todo зачем смотреть родителя?
        	if (pos) {
	        	errMsg += ` in ${pos}`;
	        }
        }
	errMsg += "\n" + err.toString();
	const params = [];
	params.push("\n$src =>", $src, "\nsId =>", my.env.srcBy$src.get($src)?.id);
	if (req) {
		params.push("\nreq =>", req);
	        params.push("\n" + req.str + " =>", req.expr);
	}
	if (scope) {
		params.push("\nscope =>", scope);
	}
	if (my.debugLevel !== 0) {
		console.info(errMsg, ...params);
	}
	return fileName ? new Error(err, fileName, lineNum, colNum) : err;
}
