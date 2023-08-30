import { ShowHide } from "./ShowHide.js";
const AsyncFunction = Object.getPrototypeOf(async function () { }).constructor;
export class Eval2 extends ShowHide {
    eval2(req, $src, isReactive) {
        //1) isReactive ложь только в on
        //2) $src не равно req.$src только в случаи с loading - сейчас там это исправлено - но только там есть смысл
        const cacheSrcId = this.getCacheSrcId(req.$src, req.str);
        const cache = this.context.srcById.get(cacheSrcId).cache; //!!
        //todo cache !== null - почему может быть так что кэша нет?
        if (cache === null) {
            console.warn(111);
            alert(1);
            throw new Error("c === null");
        }
        //if (c !== null && req.str in c.value) {
        const cachedValue = cache.value.get(req.str);
        if (cachedValue !== undefined) {
            //console.log(7777, req.str, req.expr, req.$src, c.value);
            return cachedValue;
        }
        // const func = this.getEval2Func(req, req.expr);
        const proxyStat = this.proxyController.getProxyStat();
        proxyStat.value = 0;
        if (isReactive) {
            this.proxyController.setCur$src($src);
            const value = this.eval2Execute(req, $src);
            // const value = func.apply($src, [req.scope, req.event]).catch((err: Error) => {
            // 	throw this.getError(err, req.$src, req);
            // });
            if (proxyStat.value !== 0) {
                //--setCacheValue(cacheSrcId, req.str, val);
                cache.value.set(req.str, value);
                //proxyStat.value = 0;
            }
            this.proxyController.setCur$src(null);
            return value;
        }
        const value = this.eval2Execute(req, $src);
        // const value = func.apply($src, [req.scope, req.event]).catch((err: Error) => {
        // 	throw this.getError(err, req.$src, req);
        // });
        if (proxyStat.value !== 0) {
            //--setCacheValue(cacheSrcId, req.str, val);
            cache.value.set(req.str, value);
            //proxyStat.value = 0;
        }
        return value;
    }
    eval2Execute(req, $src) {
        const func = this.getEval2Func(req, req.expr);
        return func.apply($src, [req.scope, req.event]).catch((err) => {
            throw this.getError(err, req.$src, req);
        });
    }
    async q_eval2(req, arr, isLast) {
        return this.q_getEval2Func(req, req.expr)
            .apply(null, [
            req,
            arr,
            isLast,
            req.str,
            this.proxyController.setCur$src,
            this.proxyController.getProxyStat(),
            this.context.srcBy$src,
        ])
            .then(values => Promise.all(values))
            .catch(err => {
            throw this.getError(err, req.$src, req);
        });
    }
    //const commentRe = /\/\/.+?(\n|$)/g;
    getEval2Func(req, expr) {
        //expr = expr.trim();
        const cacheKey = expr;
        const existingFunc = this.context.functionByExpr.get(cacheKey);
        if (existingFunc !== undefined) {
            return existingFunc;
        }
        if (expr === "") {
            const emptyFunc = new AsyncFunction();
            this.context.functionByExpr.set(cacheKey, emptyFunc);
            return emptyFunc;
        }
        //todo
        //expr = expr.replace(commentRe, "");
        /*
//todo if need change with
        const fBody = `const _tpl_scopeNames = [];
for (const i in _tpl_scope) {
    _tpl_scopeNames.push(i);
}
const _tpl_scopeNamesLen = _tpl_scopeNames.length;
_tpl_scopeValues = new Array(_tpl_scopeNamesLen);
for (let i = 0; i < _tpl_scopeNamesLen; i++) {
    _tpl_scopeValues[i] = _tpl_scope[_tpl_scopeNames[i]];
}
return (function(Object.keys(_tpl_scope)) {${expr}
}).apply(this, Object.values(_tpl_scope));`;

or

        const fBody = "return (function(Object.keys(_tpl_scope)) {" + expr + "\n}).apply(this, Object.values(_tpl_scope))";
*/
        const fBody = `const _tpl_res = ${isNeedRet(expr) ? expr : `(() => {${expr}\n})()`}
return typeof _tpl_res === "function" ? _tpl_res.apply(this, [_tpl_scope, _tpl_event]) : _tpl_res`;
        //console.log(fBody);
        try {
            //console.log(fBody)
            const func = new AsyncFunction("_tpl_scope", "_tpl_event", fBody);
            this.context.functionByExpr.set(cacheKey, func);
            return func;
        }
        catch (err) {
            throw this.getError(err, req.$src, req);
        }
    }
    q_getEval2Func(req, expr) {
        //expr = expr.trim();
        const cacheKey = "=q" + expr;
        const existingFunc = this.context.functionByExpr.get(cacheKey);
        if (existingFunc !== undefined) {
            return existingFunc;
        }
        if (expr === "") {
            const emptyFunc = new AsyncFunction();
            this.context.functionByExpr.set(cacheKey, emptyFunc);
            return emptyFunc;
        }
        if (!isNeedRet(expr)) {
            expr = "(() => {" + expr + "\n})();";
        }
        const fBody = `const _tpl_len = _tpl_arr.length;
const _tpl_val = new Array(_tpl_len);
const _tpl_func = function(_tpl_scope) {
	const _tpl_res = ${expr}
	return typeof _tpl_res === "function" ? _tpl_res.apply(this, [_tpl_scope, null]) : _tpl_res;
}
for (let i = 0; i < _tpl_len; ++i) {
	if (_tpl_isLast.has(i)) {
		continue;
	}
	const $i = _tpl_arr[i].$src;
	const src = _tpl_srcBy$src.get($i);
	const c = src.cache;
	if (c.value.has(_tpl_str)) {
		_tpl_val[i] = c.value.get(_tpl_str);
//console.log(7777, "q", _tpl_val[i]);
		continue;
	}
	_tpl_proxyStat.value = 0;
	_tpl_setCur$src($i);
	//to_debug
	if (my.debugLevel !== 0) {
		req.scope = _tpl_arr[i].scope;
	}
	const v = _tpl_val[i] = _tpl_func.apply($i, [_tpl_arr[i].scope]);
	if (_tpl_proxyStat.value !== 0) {
//--	_tpl_setCacheValue(cacheSrcId, _tpl_str, v);
		c.value.set(_tpl_str, v);
	}
}
_tpl_setCur$src(null);
//_tpl_proxyStat.value = 0;
return _tpl_val;`;
        //console.log(fBody);
        try {
            const func = new AsyncFunction("req", "_tpl_arr", "_tpl_isLast", "_tpl_str", "_tpl_setCur$src", "_tpl_proxyStat", "_tpl_srcBy$src", fBody); //, "_tpl_isReactive"
            this.context.functionByExpr.set(cacheKey, func);
            return func;
        }
        catch (err) {
            throw this.getError(err, req.$src, req);
        }
    }
    getCacheSrcId($e, str) {
        let $i = $e;
        //todo если _for1 _for2 - кэш будет браться для for2 c первого элемента
        const srcBy$src = this.context.srcBy$src;
        const src = srcBy$src.get($i);
        //todo
        if (src === undefined) {
            //Такое было с filling - так как запуск через таймер и что-то могло удалиться. Нужно защемиться от всех подобных ситуаций.
            console.warn("2323", $i, str);
            //debugger
            return 0;
        }
        const descr = src.descr;
        if (descr.asOnes === null || !descr.asOnes.has(str)) {
            return src.id;
        }
        const nStr = src.getNextStr(str);
        $i = src.get$first(nStr);
        do {
            const iSrc = srcBy$src.get($i);
            if (iSrc !== undefined && iSrc.isCmd) {
                return iSrc.id;
            }
            $i = $i.nextSibling;
        } while ($i !== null);
        //todo
        throw new Error("getCacheSrcId");
    }
}
const _e = ["with", "var", "try", "catch", "switch", "do", "while", "let", "const", "for", "if", "return"];
function isNeedRet(expr) {
    if (expr === "") {
        return false;
    }
    expr = clearBlock(clearBlock(clearBlock(clearBlock(clearBlock(expr, "'", "'"), "`", "`"), '"', '"'), "{", "}"), "(", ")");
    //console.log(expr)
    for (let i = _e.length - 1; i > -1; --i) {
        const j = expr.indexOf(_e[i]);
        if (j === -1) {
            continue;
        }
        //switch (expr.substr(j + _e[i].length, 1)) {
        switch (expr[j + _e[i].length]) {
            case " ":
            case "(":
            case "\n":
            case "\t":
            case "\r":
                //console.log(1, _e[i]);
                return false;
        }
        //console.log(2, _e[i]);
        //return true;
    }
    //console.log(3);
    return true;
}
function clearBlock(str, begin, end) {
    for (let i = str.indexOf(begin); i !== -1; i = str.indexOf(begin, i + 1)) {
        const strLen = str.length;
        for (let j = i + 1, count = 0; j < strLen; ++j) {
            if (str[j] === "\\") {
                ++j;
            }
            if (str[j] === end) {
                if (count === 0) {
                    str = str.substring(0, i + 1) + str.substring(j);
                    i = j;
                    break;
                }
                --count;
                continue;
            }
            if (str[j] === begin) {
                ++count;
            }
        }
    }
    return str;
}
