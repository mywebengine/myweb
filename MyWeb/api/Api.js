import Render from "../render/Render.js";

if (self.my === undefined) {
	self.my = self;
}
export default class Api extends Render {
	createApi() {
		my.getReact = this.getReact.bind(this);
		my.render = this.render.bind(this);
		my.getCurRender = this.getCurRender.bind(this);
		my.setDelay = this.setDelay.bind(this);
		my.cancelSync = this.cancelSync.bind(this);

		my.preRender = this.preRender.bind(this);
		my.removeChild = this.removeChild.bind(this);

		my.incCache = incCache;//todo
//todo close
//		my.loadingCount = this.ctx.loadingCount;
//		my.showLoading = this.showLoading.bind(this);
	}
};
