export class RenderRes {
    $last;
    $src;
    attrStr;
    constructor($last = null, $src = null, attrStr = "") {
        this.$last = $last;
        this.$src = $src;
        this.attrStr = attrStr; //info если attrStr !== "", то $src !== null и $last !== null
    }
}
