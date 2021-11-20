import {incCache} from "./cmd/inc.js";
import {render, curRender, setDelay
//todo close
//	, syncInRender
	} from "./render/algo.js";
import {p_target, p_topUrl} from "./config.js";
//import {$srcById, srcById, srcBy$src, descrById} from "./descr.js";
import {removeChild} from "./dom.js";
import {dispatchCustomEvent} from "./evt.js";
//import {showLoading
//todo close
//	, loadingCount
//	} from "./loading.js";
import {setLoc} from "./loc.js";
import {getProxy
//todo close--
//	, varIdByVar, varById, varIdByVarIdByProp, srcIdsByVarId
	} from "./proxy.js";
import {oset, del} from "./oset.js";
import {copyToClipboard} from "./str.js";
import {getUrl
//	, isUri, normalizeUrl
	} from "./url.js";

function begin() {
	self.mw_incCache = incCache;

	self.mw_render = render;
	self.mw_curRender = curRender;
	self.mw_setDelay = setDelay;

	self.mw_p_target = p_target;
	self.mw_p_topUrl = p_topUrl;

	self.mw_removeChild = removeChild;

	self.mw_setLoc = setLoc;

	self.mw_getProxy = getProxy;

	self.mw_oset = oset;
	self.mw_del = del;

	self.mw_copyToClipboard	= copyToClipboard;

	self.mw_getUrl = getUrl;
//	self.mw_isUri = isUri;
//	self.mw_normalizeUrl = normalizeUrl;

	self.mw_dispatchCustomEvent = dispatchCustomEvent;
//todo close
//	self.mw_syncInRender = syncInRender;
//
//	self.mw_$srcById = $srcById;
//	self.mw_srcById = srcById;
//	self.mw_srcBy$src = srcBy$src;
//	self.mw_descrById = descrById;
//
//	self.mw_loadingCount = loadingCount;
//	self.mw_showLoading = showLoading;
//
//	self.mw_varIdByVar = varIdByVar;
//	self.mw_varById = varById;
//	self.mw_varIdByVarIdByProp = varIdByVarIdByProp;
//	self.mw_srcIdsByVarId = srcIdsByVarId;
}
if (self.__imports === undefined) {
	begin();
} else {
	self.__imports
		.then(begin);
}
