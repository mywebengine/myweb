export class RenderRes {
	$last: HTMLElement | null;
	$src: HTMLElement | null;
	attrStr: string;

	constructor($last: HTMLElement | null = null, $src: HTMLElement | null = null, attrStr = "") {
		this.$last = $last;
		this.$src = $src;
		this.attrStr = attrStr; //info если attrStr !== "", то $src !== null и $last !== null
	}
}
