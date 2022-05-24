export default class RenderRes {
	constructor(isLast, $src = null, $last = null, $attr = null, attrStr = "") {
		this.isLast = isLast;
		this.$src = $src;
		this.$last = $last;
		this.$attr = $attr;
		this.attrStr = attrStr;
	}
};
