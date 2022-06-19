import config from "../config/config.js";
import {getLoc, setLoc} from "../loc/loc.js";
import getUrl from "../url/getUrl.js";
import {getView} from "../view/view.js";
import Render from "./render/Render.js";

if (self.my === undefined) {
	self.my = self;
}
export default class Api extends Render {
	constructor() {
		super();
		my.getReact = this.getReact.bind(this);
		my.render = this.render.bind(this);
		my.getCurRender = this.getCurRender.bind(this);
		my.setDelay = this.setDelay.bind(this);
		my.cancelSync = this.cancelSync.bind(this);

		my.preRender = this.preRender.bind(this);
		my.removeChild = this.removeChild.bind(this);

		//my.incCache = incCache;//todo
//todo close
//		my.loadingCount = this.context.loadingCount;
//		my.showLoading = this.showLoading.bind(this);

//--		my[config.globVarName] = this.getReact(self[config.globVarName] || {});
		my[config.locVarName] = this.getReact(getLoc(location.href));
		my[config.viewVarName] = this.getReact(getView(document));

		my.getUrl = getUrl;
		my.setLoc = setLoc;
	}
};
