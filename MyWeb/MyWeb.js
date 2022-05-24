//MyWeb -> Cmd -> Description -> Dom -> Eval2 -> Loading -> RenderTag -> QRenderTag -> Render -> Api
export default class MyWeb {
	cmd = new Map();
	ctx = null;
	setContext(ctx) {
		this.ctx = ctx;
	}
	getErr(err, $src, req, scope, fileName, lineNum, colNum) {
        	let errMsg = ">>>mw error";
	        if (my.getLineNo !== undefined) {
        		const pos = my.getLineNo($src);// || my.getLineNo($src.parentNode);//todo зачем смотреть родителя?
	        	if (pos) {
	        		errMsg += ` in ${pos}`;
	        	}
        	}
		errMsg += "\n" + err.toString();
		const params = [];
		params.push("\n$src =>", $src, "\nsId =>", this.ctx.srcBy$src.get($src)?.id);
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
};
