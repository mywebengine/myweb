import "./addons/addons.js";
import MyWeb from "./MyWeb/Api.js";

const myWeb = new MyWeb(),
	mwUrl = import.meta.url;
my.debugLevel = mwUrl.indexOf("debug=1") !== -1 ? 1 : (mwUrl.indexOf("debug=2") !== -1 ? 2 : 0);
