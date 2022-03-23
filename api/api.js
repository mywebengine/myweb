import {incCache} from "../cmd/inc/inc.js";
import {render, getCurRender, setDelay, cancelSync} from "../render/algo.js";
import {p_target, p_topUrl} from "../config/config.js";
import {preRender, removeChild} from "../dom/dom.js";
import {dispatchCustomEvent} from "../evt/evt.js";
//import {showLoading
//todo close
//	, loadingCount
//	} from "../loading/loading.js";
import {setLoc} from "../loc/loc.js";
import {getProxy} from "../proxy/proxy.js";
import {oset, del} from "../oset/oset.js";
import {copyToClipboard} from "../str/str.js";
import {typedef} from "../typedef/typedef.js";
import {getUrl
//	, isUri, normalizeUrl
	} from "../url/url.js";

if (!self.my) {
	self.my = {};
}

my.incCache = incCache;

my.render = render;
my.getCurRender = getCurRender;
my.setDelay = setDelay;
my.cancelSync = cancelSync;

my.p_target = p_target;
my.p_topUrl = p_topUrl;

my.preRender = preRender;
my.removeChild = removeChild;

my.setLoc = setLoc;

my.getProxy = getProxy;

my.oset = oset;
my.del = del;

my.copyToClipboard = copyToClipboard;

my.typedef = typedef;

my.getUrl = getUrl;
//my.isUri = isUri;
//my.normalizeUrl = normalizeUrl;

my.dispatchCustomEvent = dispatchCustomEvent;
//todo close
//my.loadingCount = loadingCount;
//my.showLoading = showLoading;
